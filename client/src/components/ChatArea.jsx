/**
 * CHAT AREA COMPONENT
 * 
 * This is the central workspace for messaging. Features include:
 * - Message feed rendering with real-time updates.
 * - AI Message Composer (drafting assistance).
 * - Relationship management (Accept/Reject links).
 * - Real-time typing indicators.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Paperclip, Smile, Mic, Search, MoreVertical, CheckCheck, Menu, Plus, ShieldCheck, Zap, LogOut, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatArea = ({ messages, currentContact, onSendMessage, messageInput, setMessageInput, conversation, setConversation, socket, isBotTyping }) => {
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    
    // UI State for AI Composer
    const [showComposer, setShowComposer] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [composerError, setComposerError] = useState("");

    // Automatically scroll to the bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * SEND HANDLER
     * Triggers the message broadcast via the parent's current workspace.
     */
    const handleSend = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        onSendMessage(messageInput);
        setMessageInput(""); // Clear input after send
    };

    /**
     * AI DRAFT GENERATOR
     * Calls the backend to rewrite raw user instructions into professional/casual drafts.
     */
    const handleGenerateDraft = async (prompt) => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setComposerError("");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/generate-draft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, chatHistory: messages })
            });

            if (!res.ok) throw new Error("Server error");

            const data = await res.json();
            if (data.draft) {
                setMessageInput(data.draft); // Set the drafted text as the input value
                setShowComposer(false); // Close composer UI
            }
        } catch (err) {
            console.error("Composer Error", err);
            setComposerError("AI is overloaded. Try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    /**
     * EMPTY STATE RENDER
     * Shown when no contact is selected.
     */
    if (!currentContact) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-pilot-bg/20 overflow-hidden relative">
                {/* Visual placeholder background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pilot-primary/30 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pilot-accent/30 rounded-full blur-[100px]"></div>
                </div>
                <div className="text-center max-w-[460px] flex flex-col items-center px-4 z-10">
                    <Bot size={120} className="text-pilot-primary animate-float mb-8 opacity-50" />
                    <h1 className="text-[36px] font-bold mb-2 pilot-gradient-text">ChatPilot Intelligence</h1>
                    <p className="text-[15px] text-pilot-secondary">Select a contact to begin an encrypted session.</p>
                </div>
            </div>
        );
    }

    // CONVERSATION PERMISSION LOGIC
    const isPending = conversation?.status === 'pending';
    const isInitiator = conversation?.initiatedBy?.toString() === user._id.toString();
    const showBanner = isPending && !isInitiator; // Show banner to the person WHO RECEIVED the first message
    const isInputDisabled = isPending && !isInitiator; // Disable input until they accept the 'Link'

    /**
     * ACCEPT REQUEST HANDLER
     * Updates conversation status to 'accepted', unlocking the chat.
     */
    const handleAccept = async () => {
        if (!conversation?._id) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/conversation/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: conversation._id, status: 'accepted' })
            });
            const data = await res.json();
            setConversation(data);
            
            // Notify the initiator via socket that we've accepted the request
            if (socket) {
                const otherId = conversation.participants.find(p => p.toString() !== user._id.toString());
                socket.emit('accept_request', {
                    conversationId: conversation._id,
                    acceptedBy: user._id,
                    receiverId: otherId
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex-1 h-full flex flex-col bg-pilot-bg/5 relative overflow-hidden">
            {/* Dynamic visual grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            {/* CHAT HEADER */}
            <div className="relative z-20 px-6 py-3 bg-pilot-header/90 border-b border-pilot-border backdrop-blur-md flex items-center justify-between h-[68px] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-pilot-primary to-pilot-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {currentContact?.username?.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-[16px] leading-tight">{currentContact?.username}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${conversation?.status === 'accepted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                            <p className="text-[11px] text-pilot-secondary uppercase tracking-wider">
                                {conversation?.status === 'accepted' ? 'Secure Link Active' : 'Encryption Pending'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACCEPTANCE BANNER */}
            {showBanner && (
                <div className="relative z-30 p-1 mx-4 my-2">
                    <div className="pilot-glass rounded-2xl p-6 shadow-2xl border border-white/10 animate-in slide-in-from-top-4">
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white mb-2">Inbound Transmission Request</h3>
                            <p className="text-sm text-pilot-secondary mb-6">Accept to start communicating with @{currentContact?.username}.</p>
                            <div className="flex gap-4">
                                <button onClick={handleAccept} className="w-full px-6 py-2.5 rounded-xl bg-pilot-primary text-white text-sm font-bold shadow-lg transform active:scale-95 transition-all">Accept Link</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MESSAGE CONTAINER */}
            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
                {Array.isArray(messages) && messages.map((msg, idx) => {
                    const isMe = msg.senderId.toString() === user._id.toString();
                    const isFirst = idx === 0 || (messages[idx - 1]?.senderId !== msg.senderId);
                    const timeString = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirst ? 'mt-6' : 'mt-1'}`}>
                            <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`relative px-4 py-3 rounded-2xl shadow-lg text-[14.5px] group ${isMe
                                        ? 'bg-gradient-to-br from-pilot-primary to-pilot-accent text-white rounded-br-none'
                                        : 'bg-slate-700 text-white rounded-bl-none border border-white/10'
                                    }`}>
                                    <div className="break-words">{msg.content}</div>
                                </div>
                                <span className="text-[10px] text-pilot-secondary opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase">{timeString}</span>
                            </div>

                            {/* AI Pilot Generated Flag */}
                            {msg.isAiGenerated && (
                                <div className={`flex items-center gap-1.5 mt-1 mx-2 text-[10px] font-bold ${isMe ? 'text-violet-400' : 'text-emerald-400'}`}>
                                    <Zap size={10} fill="currentColor" /> AI PILOT GENERATED
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* BOT TYING INDICATOR */}
                {isBotTyping && (
                    <div className="flex items-start mt-4 animate-pulse">
                        <div className="bg-slate-700 text-white px-4 py-3 rounded-2xl rounded-bl-none border border-white/10 shadow-lg">
                            <div className="flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-pilot-primary rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-pilot-primary rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 bg-pilot-primary rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT AREA */}
            <div className="relative z-10 px-6 py-4 bg-pilot-header/50 backdrop-blur-xl border-t border-pilot-border">
                {!isInputDisabled ? (
                    <div className="relative">
                        {/* COMPOSER OVERLAY */}
                        {showComposer && (
                            <div className="absolute bottom-full left-0 mb-4 w-full p-4 bg-pilot-surface border border-pilot-border rounded-2xl shadow-2xl z-50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-pilot-primary uppercase flex items-center gap-2">
                                        <Sparkles size={12} /> AI Message Composer
                                    </span>
                                    <button onClick={() => setShowComposer(false)} className="text-pilot-secondary"><X size={14} /></button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="e.g. 'Ask for the project status politely'"
                                    className="w-full bg-pilot-bg border border-pilot-border rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-pilot-primary outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleGenerateDraft(e.target.value);
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {/* INPUT FORM */}
                        <form onSubmit={handleSend} className="flex gap-3 items-center">
                            <button
                                type="button"
                                onClick={() => setShowComposer(!showComposer)}
                                className={`p-2.5 rounded-xl transition-all ${showComposer ? 'bg-pilot-primary text-white' : 'hover:bg-white/5 text-pilot-secondary'}`}
                                title="AI Composer"
                            >
                                <Bot size={22} />
                            </button>

                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder={isGenerating ? "AI is rewriting..." : "Secure transmission..."}
                                disabled={isGenerating}
                                className={`flex-1 bg-pilot-bg/50 border border-pilot-border rounded-xl px-4 py-3 text-[14.5px] text-white focus:ring-2 focus:ring-pilot-primary/30 outline-none transition-all ${isGenerating ? 'animate-pulse' : ''}`}
                            />

                            <button type="submit" className="p-3 bg-pilot-primary text-white rounded-xl hover:bg-pilot-primary-hover shadow-lg transition-all active:scale-95">
                                <Send size={22} />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center py-3 text-xs font-bold text-red-400/70 uppercase tracking-widest bg-red-500/5 rounded-xl border border-red-500/10">
                        Link Required: Transmissions Restricted
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatArea;
