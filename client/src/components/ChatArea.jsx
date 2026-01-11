import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Paperclip, Smile, Mic, Search, MoreVertical, CheckCheck, Menu, Plus, ShieldCheck, Zap, LogOut, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatArea = ({ messages, currentContact, onSendMessage, messageInput, setMessageInput, conversation, setConversation, socket, isBotTyping }) => {
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    const [showComposer, setShowComposer] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [composerError, setComposerError] = useState("");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        onSendMessage(messageInput);
        setMessageInput("");
    };

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
                setMessageInput(data.draft);
                setShowComposer(false);
            }
        } catch (err) {
            console.error("Composer Error", err);
            setComposerError("AI is overloaded. Try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!currentContact) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-pilot-bg/20 overflow-hidden relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pilot-primary/30 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pilot-accent/30 rounded-full blur-[100px]"></div>
                </div>
                <div className="text-center max-w-[460px] flex flex-col items-center px-4 z-10">
                    <div className="mb-8 w-64 h-64 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-pilot-primary/10 rounded-full animate-pulse"></div>
                        <div className="w-56 h-56 bg-pilot-surface rounded-full flex items-center justify-center shadow-2xl border border-white/5 animate-float">
                            <Bot size={120} className="text-pilot-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" strokeWidth={1} />
                        </div>
                    </div>
                    <h1 className="text-[36px] font-bold mb-2 tracking-tight pilot-gradient-text">ChatPilot Intelligence</h1>
                    <p className="text-[15px] text-pilot-secondary leading-relaxed font-normal px-8">
                        Your secure, AI-augmented communications hub. Connect with other pilots and let the Agent handle the routine.
                    </p>

                    <div className="mt-12 flex items-center gap-4">
                        <div className="px-4 py-2 bg-pilot-surface border border-pilot-border rounded-full flex items-center gap-2 text-xs text-pilot-secondary">
                            <ShieldCheck size={14} className="text-emerald-500" /> End-to-end Encrypted
                        </div>
                        <div className="px-4 py-2 bg-pilot-surface border border-pilot-border rounded-full flex items-center gap-2 text-xs text-pilot-secondary">
                            <Zap size={14} className="text-amber-500" /> AI-Ready
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isPending = conversation?.status === 'pending';
    const isInitiator = conversation?.initiatedBy?.toString() === user._id.toString();
    const showBanner = isPending && !isInitiator;
    const isInputDisabled = isPending && !isInitiator;

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
            {/* Dynamic Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            {/* Header */}
            <div className="relative z-20 px-6 py-3 bg-pilot-header/90 border-b border-pilot-border backdrop-blur-md flex items-center justify-between h-[68px] shrink-0">
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-pilot-primary to-pilot-accent flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden uppercase transform group-hover:scale-105 transition-transform">
                        {currentContact?.username?.charAt(0) || '?'}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <h2 className="text-white font-bold text-[16px] leading-tight truncate">
                            {currentContact?.username || 'Unknown'}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${conversation?.status === 'accepted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                            <p className="text-[11px] text-button-text font-medium text-pilot-secondary uppercase tracking-wider">
                                {conversation?.status === 'accepted' ? 'Online' : 'Encrypted Link'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Backup Logout for robustness */}
                    <button onClick={() => window.location.reload()} title="Refresh Link" className="p-2.5 hover:bg-white/5 rounded-xl text-pilot-secondary transition-all transform active:scale-95"><Zap size={20} /></button>
                    <button onClick={user && useAuth ? useAuth().logout : () => window.location.href = '/login'} title="Emergency Eject" className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all transform active:scale-95 border border-red-500/10">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Request Banner */}
            {showBanner && (
                <div className="relative z-30 p-1 mx-4 my-2">
                    <div className="pilot-glass rounded-2xl p-6 shadow-2xl border border-white/10 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 bg-pilot-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-pilot-bg rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white/5">
                                <Bot size={32} className="text-pilot-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Inbound Transmission Request</h3>
                            <p className="text-sm text-pilot-secondary max-w-sm mb-6">
                                <span className="text-white font-semibold">@{currentContact?.username}</span> is attempting to establish a secure link with your pilot station.
                            </p>
                            <div className="flex gap-4 w-full max-w-xs">
                                <button onClick={() => { }} className="flex-1 px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors">Reject</button>
                                <button onClick={handleAccept} className="flex-1 px-6 py-2.5 rounded-xl bg-pilot-primary text-white text-sm font-bold hover:bg-pilot-primary-hover shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all transform active:scale-95">Accept Link</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
                {(!messages || messages.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 select-none">
                        <ShieldCheck size={64} className="text-pilot-secondary mb-4" />
                        <p className="text-xs text-pilot-secondary uppercase tracking-[0.2em] font-bold">Secure Protocol Established</p>
                    </div>
                )}

                {Array.isArray(messages) && messages.map((msg, idx) => {
                    if (!msg) return null;
                    const isMe = msg.senderId.toString() === user._id.toString();
                    const isFirst = idx === 0 || (messages[idx - 1] && messages[idx - 1].senderId !== msg.senderId);

                    let timeString = "";
                    try {
                        timeString = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } catch (e) { timeString = ""; }

                    return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isFirst ? 'mt-6' : 'mt-1'}`}>
                            <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Message Bubble */}
                                <div className={`relative px-4 py-3 rounded-2xl shadow-lg text-[14.5px] leading-relaxed group ${isMe
                                        ? 'bg-gradient-to-br from-pilot-primary to-pilot-accent text-white rounded-br-none'
                                        : 'bg-slate-700 text-white rounded-bl-none border border-white/10'
                                    }`}>
                                    <div className="break-words min-w-[60px]">
                                        {msg.content}
                                    </div>
                                </div>

                                {/* Status/Time (showing on hover or always for premium feel) */}
                                <div className="flex flex-col items-center mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-[9px] font-bold text-pilot-secondary uppercase mb-1">{timeString}</span>
                                    {isMe && (
                                        <CheckCheck size={14} className={msg.read ? "text-pilot-primary" : "text-pilot-secondary"} />
                                    )}
                                </div>
                            </div>

                            {/* AI Badge underneath if applicable */}
                            {msg.isAiGenerated && (
                                <div className={`flex items-center gap-1.5 mt-1 mx-2 text-[10px] font-bold ${isMe ? 'text-violet-400' : 'text-emerald-400'}`}>
                                    <Zap size={10} fill="currentColor" />
                                    <span>AI PILOT GENERATED</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {isBotTyping && (
                    <div className="flex items-start mt-4 animate-in fade-in duration-300">
                        <div className="bg-slate-700 text-white px-4 py-3 rounded-2xl rounded-bl-none border border-white/10 shadow-lg">
                            <div className="flex gap-1.5 items-center h-5">
                                <div className="w-1.5 h-1.5 bg-pilot-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-pilot-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-pilot-primary rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="relative z-10 px-6 py-4 bg-pilot-header/50 backdrop-blur-xl border-t border-pilot-border">
                {!isInputDisabled ? (
                    <div className="relative">
                        {/* AI Composer Popover */}
                        {showComposer && (
                            <div className="absolute bottom-full left-0 mb-4 w-full p-4 bg-pilot-surface border border-pilot-border rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 z-50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-pilot-primary uppercase flex items-center gap-2">
                                        <Sparkles size={12} /> AI Message Composer
                                    </span>
                                    <button onClick={() => setShowComposer(false)} className="text-pilot-secondary hover:text-white"><X size={14} /></button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Describe what you want to say... (e.g. 'Ask nicely for the report')"
                                    className="w-full bg-pilot-bg border border-pilot-border rounded-xl px-3 py-2 text-sm text-white mb-2 focus:ring-1 focus:ring-pilot-primary outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleGenerateDraft(e.target.value);
                                        }
                                    }}
                                />

                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] text-pilot-secondary">Press Enter to generate</div>
                                    {composerError && (
                                        <span className="text-[10px] text-red-500 font-bold animate-pulse">{composerError}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSend} className="flex gap-3 items-center">
                            <button
                                type="button"
                                onClick={() => setShowComposer(!showComposer)}
                                className={`p-2.5 rounded-xl transition-all transform active:scale-95 ${showComposer ? 'bg-pilot-primary text-white' : 'hover:bg-white/5 text-pilot-secondary'}`}
                                title="AI Composer"
                            >
                                <Bot size={22} />
                            </button>

                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={isGenerating ? "AI is writing..." : "Secure transmission..."}
                                    disabled={isGenerating}
                                    className={`w-full bg-pilot-bg/50 border border-pilot-border rounded-xl px-4 py-3 text-[14.5px] text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 outline-none transition-all ${isGenerating ? 'animate-pulse cursor-wait' : ''}`}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                                    <button type="button" className="p-1.5 hover:text-pilot-primary text-pilot-secondary transition-colors"><Smile size={20} /></button>
                                </div>
                            </div>

                            {messageInput.trim() ? (
                                <button type="submit" className="p-3 bg-pilot-primary text-white rounded-xl hover:bg-pilot-primary-hover shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all transform active:scale-95">
                                    <Send size={22} />
                                </button>
                            ) : (
                                <button type="button" className="p-3 bg-pilot-surface text-pilot-secondary rounded-xl hover:bg-white/5 transition-all transform active:scale-95 border border-white/5">
                                    <Mic size={22} />
                                </button>
                            )}
                        </form>
                    </div>
                ) : (
                    <div className="text-center py-3 text-xs font-bold text-red-400/70 uppercase tracking-widest bg-red-500/5 rounded-xl border border-red-500/10">
                        Transmissions Restricted: Pending Link Approval
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatArea;
