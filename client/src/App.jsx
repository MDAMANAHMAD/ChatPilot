import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AIPanel from './components/AIPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Initialize socket outside component to avoid reconnects, 
// but we need to update auth, so maybe inside is better or use a Context.
// For simplicity, we'll handle connection inside the protected component.
let socket;

const MainApp = () => {
    const { user } = useAuth();
    const [currentContact, setCurrentContact] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [autoMode, setAutoMode] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

    const messagesRef = useRef(messages);
    const contactRef = useRef(currentContact);
    const autoModeRef = useRef(autoMode);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        contactRef.current = currentContact;
    }, [currentContact]);

    useEffect(() => {
        autoModeRef.current = autoMode;
    }, [autoMode]);

    // stable socket effect
    useEffect(() => {
        if (!user) return;

        socket = io('http://localhost:3001');
        socket.emit('register_user', user._id);

        const fetchConversations = async () => {
            try {
                const res = await fetch(`http://localhost:3001/api/conversations/${user._id}`);
                const data = await res.json();
                setContacts(data);
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            }
        };
        fetchConversations();

        socket.on('receive_message', (data) => {
            const currentContactNow = contactRef.current;
            const roomId = getRoomId(data.senderId, data.receiverId);
            const currentRoomId = currentContactNow ? getRoomId(user._id, currentContactNow._id) : null;

            if (roomId === currentRoomId) {
                setMessages(prev => {
                    // Deduplicate by _id safely
                    if (prev.some(m => m._id?.toString() === data._id?.toString())) return prev;
                    return [...prev, data];
                });
            }

            // Update sidebar
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
                    const item = updated.splice(existingIdx, 1)[0];
                    return [item, ...updated];
                }
                return prev;
            });

            if (data.senderId.toString() !== user._id.toString()) {
                handleIncomingMessageForAI(data.content, messagesRef.current);
            }
        });

        socket.on('request_accepted', (data) => {
            const currentContactNow = contactRef.current;
            if (currentContactNow && (currentContactNow._id.toString() === data.acceptedBy.toString())) {
                setConversation(prev => prev ? ({ ...prev, status: 'accepted' }) : prev);
            }
            setContacts(prev => prev.map(c => c._id.toString() === data.acceptedBy.toString() ? ({ ...c, status: 'accepted' }) : c));
        });

        return () => {
            socket.disconnect();
        };
    }, [user?._id]);

    // Re-fetch messages & status when contact changes
    useEffect(() => {
        if (currentContact) {
            setAiSuggestions([]); // Clear old suggestions
            const roomId = getRoomId(user._id, currentContact._id);
            socket?.emit('join_room', roomId);

            // Fetch messages & Handle AI trigger
            fetch(`http://localhost:3001/api/messages/${roomId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setMessages(data);
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

            // Fetch Conversation Status
            fetch(`http://localhost:3001/api/conversation/status/${user._id}/${currentContact._id}`)
                .then(res => res.json())
                .then(data => setConversation(data))
                .catch(err => console.error("Fetch status error:", err));
        }
    }, [currentContact, user?._id]);


    const getRoomId = (id1, id2) => {
        return [id1, id2].sort().join('_');
    }

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

        // Update contacts list for sender too
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

    const handleIncomingMessageForAI = async (incomingText, currentMessages, forceAutoMode = null) => {
        const modeAtTime = forceAutoMode !== null ? forceAutoMode : autoModeRef.current;
        console.log("🤖 AI Triggered for content:", incomingText, "AutoMode:", modeAtTime);

        setIsAiLoading(true);

        // Build context from last 8 messages for better suggestions
        const history = (currentMessages || []).slice(-8).map(m => ({
            sender: m.senderId.toString() === user._id.toString() ? 'me' : 'them',
            content: m.content
        }));

        // Only add if not already there (avoid duplicates)
        if (history.length === 0 || history[history.length - 1].content !== incomingText) {
            history.push({ sender: 'them', content: incomingText });
        }

        try {
            console.log("📡 Fetching suggestions with history length:", history.length);
            const response = await fetch('http://localhost:3001/api/generate-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatHistory: history, autoMode: modeAtTime })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to fetch suggestions");
            }

            const data = await response.json();
            console.log("✅ AI Response received:", data);

            if (modeAtTime) {
                if (data.reply && data.confidence_score > 90) {
                    console.log("🚀 Auto-sending AI reply:", data.reply);
                    handleSendMessage(data.reply, true);
                    setAiSuggestions([]);
                } else {
                    setAiSuggestions(data.reply ? [data.reply] : []);
                }
            } else {
                setAiSuggestions(Array.isArray(data) ? data : (data.reply ? [data.reply] : []));
            }
        } catch (error) {
            console.error("❌ AI Suggestion Error:", error);
            setAiSuggestions([]);
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="flex w-full h-screen bg-pilot-bg overflow-hidden relative font-['Outfit']">
            {/* Background elements for premium look */}
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
                    />
                    <AIPanel
                        isOpen={isAiPanelOpen}
                        onClose={() => setIsAiPanelOpen(false)}
                        suggestions={aiSuggestions}
                        onSelectSuggestion={(txt) => {
                            setMessageInput(txt);
                            // Auto-focus logic can be added here
                        }}
                        autoMode={autoMode}
                        toggleAutoMode={() => {
                            const newMode = !autoMode;
                            setAutoMode(newMode);
                            // If turning ON, check if we need to react to the last message
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

            {/* NUCLEAR OPTION: Fixed Logout FAB (Bottom Left) */}
            <button
                onClick={useAuth().logout}
                className="fixed bottom-6 left-6 z-[100] p-4 bg-red-500 text-white rounded-full shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group flex items-center justify-center border-4 border-pilot-bg"
                title="Emergency Logout"
            >
                <LogOut size={24} strokeWidth={2.5} />
                <span className="absolute left-full ml-3 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                    LOGOUT
                </span>
            </button>
        </div >
    );
};

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

// Main App Container to hold Routes
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
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;
