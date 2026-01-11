import React, { useState } from 'react';
import { Search, MoreVertical, MessageSquare, Compass, Shield, LogOut, CheckCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentContact, setCurrentContact, contacts, setContacts }) => {
    const { user, logout } = useAuth();
    const [searchPhone, setSearchPhone] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const handleFoundUser = (foundUser) => {
        const exists = contacts.find(c => c._id === foundUser._id);
        if (!exists) {
            setContacts(prev => [foundUser, ...prev]);
        }
        setCurrentContact(foundUser);
        setSearchPhone("");
    };

    const handleSearch = async () => {
        if (!searchPhone.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/search?phone=${searchPhone}`);
            const data = await response.json();

            if (response.ok) {
                if (data._id === user._id) {
                    alert("You cannot message yourself.");
                } else {
                    handleFoundUser(data);
                }
            } else {
                alert(data.message || "User not found");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="w-[30%] min-w-[340px] max-w-[450px] bg-pilot-surface/50 border-r border-pilot-border h-full flex flex-col relative z-20">
            
            {/* HEADER: Flex-Shrink-0 to prevent collapsing */}
            <div className="flex-shrink-0 px-5 py-4 flex justify-between items-center bg-pilot-surface border-b border-pilot-border z-30 shadow-sm relative">
                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                    <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-pilot-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-pilot-primary/20 ring-1 ring-white/10">
                        <span className="text-white font-bold text-lg uppercase font-mono">{user?.username?.charAt(0) || "P"}</span>
                    </div>
                    <div className="min-w-0 truncate">
                        <div className="text-sm font-bold text-white leading-tight tracking-wide truncate">{user?.username || "Pilot"}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-2 w-2 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] text-pilot-secondary uppercase tracking-wider font-semibold truncate">Signal Strong</span>
                        </div>
                    </div>
                </div>
                
                {/* Logout Button */}
                <button 
                    onClick={logout} 
                    className="flex-shrink-0 ml-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all duration-200 group"
                    title="Logout"
                >
                    <LogOut size={16} strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase hidden md:inline-block">Logout</span>
                </button>
            </div>

            {/* SEARCH: Flex-Shrink-0 */}
            <div className="flex-shrink-0 p-4 border-b border-pilot-border/30 bg-pilot-surface/50 z-20">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className={`transition-colors ${isSearching ? 'text-pilot-primary' : 'text-pilot-secondary'}`} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by phone number..."
                        className="w-full pl-10 pr-4 py-2.5 bg-pilot-bg/50 border border-pilot-border rounded-xl text-sm text-pilot-text-main placeholder-pilot-secondary focus:ring-2 focus:ring-pilot-primary/30 focus:border-pilot-primary outline-none transition-all"
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {isSearching && (
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <div className="w-4 h-4 border-2 border-pilot-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTACTS: Flex-1 and Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar px-2 py-2 space-y-1">
                {contacts.length === 0 && !isSearching && (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-16 h-16 bg-pilot-surface rounded-2xl flex items-center justify-center mb-4 text-pilot-secondary border border-pilot-border border-dashed">
                            <User size={32} className="opacity-20" />
                        </div>
                        <h3 className="text-pilot-text-main font-medium">No transmissions yet</h3>
                        <p className="text-xs text-pilot-secondary mt-1">Start a conversation by searching for a pilot's frequency.</p>
                    </div>
                )}

                {contacts.map((contact) => (
                    <div
                        key={contact._id}
                        onClick={() => setCurrentContact(contact)}
                        className={`group px-3 py-3 rounded-xl flex items-center cursor-pointer transition-all relative overflow-hidden ${currentContact?._id === contact._id
                                ? 'bg-pilot-primary/10 border border-pilot-primary/20 shadow-lg'
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        {/* Selected Indicator */}
                        {currentContact?._id === contact._id && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 bg-pilot-primary rounded-r-full"></div>
                        )}

                        {/* Avatar */}
                        <div className="relative flex-shrink-0 mr-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner uppercase transition-transform group-hover:scale-105 ${contact.status === 'accepted' ? 'bg-gradient-to-br from-indigo-500 to-pilot-accent' : 'bg-pilot-surface border border-pilot-border'
                                }`}>
                                {contact.username?.charAt(0) || '?'}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-pilot-surface rounded-full ${contact.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}></div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <h3 className={`font-semibold text-[15px] truncate ${currentContact?._id === contact._id ? 'text-white' : 'text-pilot-text-main'}`}>
                                    {contact.username || 'Unknown User'}
                                </h3>
                                {contact.lastMessage && (
                                    <span className="text-[10px] text-pilot-secondary font-medium">
                                        {new Date(contact.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {contact.lastMessage && contact.lastMessage.senderId.toString() === user?._id?.toString() && (
                                    <CheckCheck size={14} className="text-pilot-primary shrink-0" />
                                )}
                                <p className={`text-[13px] truncate leading-tight ${currentContact?._id === contact._id ? 'text-pilot-text-main/70' : 'text-pilot-secondary'}`}>
                                    {contact.lastMessage ? (
                                        contact.lastMessage.content
                                    ) : (
                                        <span className="italic opacity-50">Secure connection established</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
