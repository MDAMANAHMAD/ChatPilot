/**
 * CHATPILOT FRONTEND - MAIN APPLICATION COMPONENT
 * 
 * This component orchestrates the entire application flow, 
 * including routing, socket lifecycle, and AI suggestion triggers.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from './context/AuthContext';

// Core Application Components
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AIPanel from './components/AIPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Global socket variable to persist between renders
let socket;

const MainApp = () => {
    const { user } = useAuth();
    
    // APPLICATION STATE
    const [currentContact, setCurrentContact] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [autoMode, setAutoMode] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
    const [isBotTyping, setIsBotTyping] = useState(false);

    /**
     * STATE REFRESHERS (useRef)
     * Used for socket callbacks to ensure they always access the latest state 
     * without triggering unnecessary re-renders or stale closures.
     */
    const messagesRef = useRef(messages);
    const contactRef = useRef(currentContact);
    const autoModeRef = useRef(autoMode);

    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { contactRef.current = currentContact; }, [currentContact]);
    useEffect(() => { autoModeRef.current = autoMode; }, [autoMode]);

    /**
     * SOCKET LIFECYCLE EFFECT
     * Runs once when a user logs in. Initializes the socket link 
     * and sets up the primary listeners.
     */
    useEffect(() => {
        if (!user) return;

        // Initialize connection to the backend server
        socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');
        
        // Let the server know who we are so it can route personal messages to us
        socket.emit('register_user', user._id);

        // Fetch user's conversation list on load
        const fetchConversations = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/conversations/${user._id}`);
                const data = await res.json();
                setContacts(data);
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            }
        };
        fetchConversations();

        /**
         * RECEIVE MESSAGE LISTENER
         * Handled when ANY message arrives for this user.
         */
        socket.on('receive_message', (data) => {
            const currentContactNow = contactRef.current;
            const roomId = getRoomId(data.senderId, data.receiverId);
            const currentRoomId = currentContactNow ? getRoomId(user._id, currentContactNow._id) : null;

            // If the message belongs to the active chat, update the message list
            if (roomId === currentRoomId) {
                setMessages(prev => {
                    // Prevent duplicate messages (due to React StrictMode or double-broadcasts)
                    if (prev.some(m => m._id?.toString() === data._id?.toString())) return prev;
                    return [...prev, data];
                });
            }

            // Update the sidebar contacts list to show the latest message preview
            setContacts(prev => {
                const otherId = data.senderId.toString() === user._id.toString() ? data.receiverId : data.senderId;
                const existingIdx = prev.findIndex(c => c._id.toString() === otherId.toString());

                if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        lastMessage: data,
                        updatedAt: data.timestamp
                    };
                    // Move the contact to the top of the list
                    const item = updated.splice(existingIdx, 1)[0];
                    return [item, ...updated];
                }
                return prev;
            });

            // AI TRIGGER: Process incoming message if it came from someone else
            if (data.senderId.toString() !== user._id.toString()) {
                handleIncomingMessageForAI(data.content, messagesRef.current);
            }
        });

        // Real-time notification when a contact accepts a link request
        socket.on('request_accepted', (data) => {
            const currentContactNow = contactRef.current;
            if (currentContactNow && (currentContactNow._id.toString() === data.acceptedBy.toString())) {
                setConversation(prev => prev ? ({ ...prev, status: 'accepted' }) : prev);
            }
            setContacts(prev => prev.map(c => c._id.toString() === data.acceptedBy.toString() ? ({ ...c, status: 'accepted' }) : c));
        });

        // Listen for Pilot Bot typing indicators
        socket.on('bot_typing', (data) => {
            const currentContactNow = contactRef.current;
            if (currentContactNow && currentContactNow._id.toString() === data.senderId.toString()) {
                setIsBotTyping(true);
            }
        });

        socket.on('bot_stop_typing', (data) => {
            setIsBotTyping(false);
        });

        // Clean up connection on logout/unmount
        return () => {
            socket.disconnect();
        };
    }, [user?._id]);

    /**
     * CONTACT CHANGE EFFECT
     * Runs whenever the user selects a new person to chat with.
     */
    useEffect(() => {
        if (currentContact) {
            setAiSuggestions([]);
            const roomId = getRoomId(user._id, currentContact._id);
            
            // Join the specific room for real-time broadcasts
            socket?.emit('join_room', roomId);

            // Fetch previous message history
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/messages/${roomId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setMessages(data);
                        // Trigger AI to suggest a reply based on the last message in history
                        if (data.length > 0) {
                            const lastMsg = data[data.length - 1];
                            if (lastMsg.senderId.toString() !== user._id.toString()) {
                                handleIncomingMessageForAI(lastMsg.content, data.slice(0, -1));
                            }
                        }
                    } else {
                        setMessages([]);
                    }
                })
                .catch(err => {
                    console.error("Fetch messages error:", err);
                    setMessages([]);
                });

            // Fetch current conversation metadata (status)
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/conversation/status/${user._id}/${currentContact._id}`)
                .then(res => res.json())
                .then(data => setConversation(data))
                .catch(err => console.error("Fetch status error:", err));
        }
    }, [currentContact, user?._id]);


    /**
     * ROOM ID UTILITY
     * Generates a unique room identifier by sorting user IDs alphabetically.
     */
    const getRoomId = (id1, id2) => {
        return [id1, id2].sort().join('_');
    }

    /**
     * SEND MESSAGE HANDLER
     * Emits message to server and updates local UI immediately.
     */
    const handleSendMessage = (content, isAi = false) => {
        if (!currentContact) return;

        const roomId = getRoomId(user._id, currentContact._id);
        const messageData = {
            room: roomId,
            senderId: user._id,
            receiverId: currentContact._id,
            content: content,
            timestamp: new Date(),
            isAiGenerated: isAi
        };

        socket.emit('send_message', messageData);
        setMessages((prev) => [...prev, messageData]);

        // Move contact to top of sidebar
        setContacts(prev => {
            const existingIdx = prev.findIndex(c => c._id.toString() === currentContact._id.toString());
            if (existingIdx !== -1) {
                const updated = [...prev];
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    lastMessage: messageData,
                    updatedAt: messageData.timestamp
                };
                const item = updated.splice(existingIdx, 1)[0];
                return [item, ...updated];
            }
            return prev;
        });
    };

    /**
     * AI SUGGESTION ORCHESTRATOR
     * Calls the backend AI API to generate reply suggestions based on history.
     * Handles 'Auto-Pilot' logic if the user has it enabled.
     */
    const handleIncomingMessageForAI = async (incomingText, currentMessages, forceAutoMode = null) => {
        const modeAtTime = forceAutoMode !== null ? forceAutoMode : autoModeRef.current;
        setIsAiLoading(true);

        // Prepare a clean context for the AI (last 8 messages)
        const history = (currentMessages || []).slice(-8).map(m => ({
            sender: m.senderId.toString() === user._id.toString() ? 'me' : 'them',
            content: m.content
        }));

        if (history.length === 0 || history[history.length - 1].content !== incomingText) {
            history.push({ sender: 'them', content: incomingText });
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/generate-suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatHistory: history, autoMode: modeAtTime })
            });
            if (!response.ok) throw new Error("AI Server Error");

            const data = await response.json();

            if (modeAtTime) {
                // AUTO-PILOT LOGIC: If AI is >90% confident, send the message automatically.
                if (data.reply && data.confidence_score > 90) {
                    handleSendMessage(data.reply, true);
                    setAiSuggestions([]);
                } else {
                    setAiSuggestions(data.reply ? [data.reply] : []);
                }
            } else {
                // NORMAL MODE: Display suggestions for the user to choose.
                setAiSuggestions(Array.isArray(data) ? data : (data.reply ? [data.reply] : []));
            }
        } catch (error) {
            console.error("❌ AI Suggestion Error:", error);
            setAiSuggestions([]);
        } finally {
            setIsAiLoading(false);
        }
    };

    /**
     * UI ASSEMBLY
     */
    return (
        <div className="flex w-full h-screen bg-pilot-bg overflow-hidden relative font-['Outfit']">
            {/* Ambient visual effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pilot-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pilot-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex w-full h-full max-w-[1700px] mx-auto overflow-hidden relative z-10 p-2 md:p-4 gap-4">
                <div className="flex w-full h-full overflow-hidden rounded-2xl border border-white/5 shadow-2xl pilot-glass">
                    <Sidebar
                        currentContact={currentContact}
                        setCurrentContact={setCurrentContact}
                        contacts={contacts}
                        setContacts={setContacts}
                    />
                    <ChatArea
                        messages={messages}
                        currentContact={currentContact}
                        onSendMessage={handleSendMessage}
                        messageInput={messageInput}
                        setMessageInput={setMessageInput}
                        conversation={conversation}
                        setConversation={setConversation}
                        socket={socket}
                        isBotTyping={isBotTyping}
                    />
                    <AIPanel
                        isOpen={isAiPanelOpen}
                        onClose={() => setIsAiPanelOpen(false)}
                        suggestions={aiSuggestions}
                        onSelectSuggestion={(txt) => {
                            setMessageInput(txt);
                        }}
                        autoMode={autoMode}
                        toggleAutoMode={() => {
                            const newMode = !autoMode;
                            setAutoMode(newMode);
                            // Re-trigger AI for last message if turning ON
                            if (newMode && messages.length > 0) {
                                const lastMsg = messages[messages.length - 1];
                                if (lastMsg.senderId.toString() !== user._id.toString()) {
                                    handleIncomingMessageForAI(lastMsg.content, messages.slice(0, -1), true);
                                }
                            }
                        }}
                        loading={isAiLoading}
                    />
                </div>
            </div>

            {/* Logout Floating Button */}
            <button
                onClick={useAuth().logout}
                className="fixed bottom-6 left-6 z-[100] p-4 bg-red-500 text-white rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group flex items-center justify-center border-4 border-pilot-bg"
            >
                <LogOut size={24} strokeWidth={2.5} />
            </button>
        </div >
    );
};

/**
 * AUTHENTICATION GUARD
 * Prevents unauthorized users from accessing the /chat route.
 */
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Auth Checking...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

/**
 * APP ENTRY ROUTER
 */
function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        <MainApp />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;
