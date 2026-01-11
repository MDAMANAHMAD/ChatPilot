import React from 'react';
import { Sparkles, Loader2, BrainCircuit, X, Zap, Send, MessageSquare, Cpu, Radio, Activity } from 'lucide-react';

const AIPanel = ({ suggestions, onSelectSuggestion, autoMode, toggleAutoMode, loading, isOpen, onClose }) => {
  if (!isOpen) return null; 

  return (
    <div className="w-[30%] min-w-[320px] max-w-[400px] bg-pilot-surface/80 border-l border-pilot-border h-full flex flex-col relative z-30 backdrop-blur-xl animate-in slide-in-from-right duration-500 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pilot-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Header */}
      <div className="px-6 py-4 bg-pilot-header/50 border-b border-pilot-border flex items-center justify-between h-[68px] shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-pilot-primary/10 rounded-lg text-pilot-primary">
                <Cpu size={20} />
            </div>
            <div>
                <div className="text-sm font-bold text-white tracking-tight">Intelligence Hub</div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-pilot-secondary uppercase font-bold tracking-wider">Pilot AI Online</span>
                </div>
            </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-pilot-secondary transition-all transform active:scale-95">
            <X size={20}/>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        
        {/* Banner/Hero */}
        <div className="p-8 flex flex-col items-center justify-center text-center border-b border-pilot-border/50">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-pilot-primary/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-24 h-24 bg-pilot-bg rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl relative z-10">
                    <BrainCircuit size={48} className="pilot-gradient-text stroke-pilot-primary" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-pilot-surface rounded-xl border border-white/10 shadow-lg animate-bounce">
                    <Activity size={16} className="text-pilot-accent" />
                </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Co-Pilot Assistant</h2>
            <p className="text-pilot-secondary text-[13px] leading-relaxed max-w-[200px]">Real-time neural suggestions and automated response protocols.</p>
        </div>

        <div className="p-6 space-y-8">
            {/* Auto Mode Configuration */}
            <div className="pilot-glass p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-pilot-accent"></div>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${autoMode ? 'bg-pilot-accent/20 text-pilot-accent' : 'bg-pilot-surface text-pilot-secondary'}`}>
                            <Zap size={16} fill={autoMode ? "currentColor" : "none"} />
                        </div>
                        <span className="text-[14px] font-bold text-white">Auto-Pilot Mode</span>
                    </div>
                    <button 
                        onClick={toggleAutoMode}
                        className={`w-11 h-6 rounded-full relative transition-all duration-300 ${autoMode ? 'bg-pilot-accent shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'bg-pilot-bg border border-pilot-border'}`}
                    >
                        <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all duration-300 shadow-md ${autoMode ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
                <p className="text-[12px] text-pilot-secondary leading-relaxed">
                    When active, the AI will autonomously transmit high-confidence responses ({'>'}90%).
                </p>
                {autoMode && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                        <div className="w-full bg-pilot-bg h-1.5 rounded-full overflow-hidden">
                            <div className="bg-pilot-accent h-full w-[90%] animate-pulse"></div>
                        </div>
                        <span className="text-[10px] font-bold text-pilot-accent">90%</span>
                    </div>
                )}
            </div>

            {/* Suggestions Engine */}
            <div>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-[11px] font-bold text-pilot-primary uppercase tracking-[0.2em] flex items-center gap-2">
                        <Radio size={12} className="animate-pulse" /> Suggested Protocols
                    </h3>
                    {loading && <Loader2 size={12} className="animate-spin text-pilot-primary" />}
                </div>
                
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-full h-16 bg-white/5 rounded-xl animate-pulse border border-white/5"></div>
                        ))}
                        <p className="text-center text-[11px] text-pilot-secondary mt-4 animate-pulse uppercase tracking-widest">Decoding Neural patterns...</p>
                    </div>
                ) : suggestions.length > 0 ? (
                    <div className="space-y-3">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSelectSuggestion(suggestion)}
                                className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-pilot-primary/20 text-[14px] text-pilot-text-main border border-white/5 hover:border-pilot-primary/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Send size={14} className="text-pilot-primary" />
                                </div>
                                <div className="relative z-10 pr-6">
                                    {suggestion}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-pilot-bg/20 rounded-2xl border border-dashed border-pilot-border">
                        <div className="mb-4 flex justify-center opacity-20">
                            <MessageSquare size={40} className="text-pilot-secondary" />
                        </div>
                        <p className="text-[13px] text-pilot-secondary font-medium leading-relaxed">
                            Awaiting incoming frequency logs to generate response protocols.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-6 bg-pilot-header/30 border-t border-pilot-border">
           <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pilot-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Titan-G4 Link</span>
                </div>
                <div className="text-[10px] text-pilot-secondary font-mono">LATENCY: 42ms</div>
           </div>
      </div>
    </div>
  );
};

export default AIPanel;
