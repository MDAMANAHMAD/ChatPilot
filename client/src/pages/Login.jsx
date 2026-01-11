import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bot, LogIn, Mail, Lock, ShieldCheck, Zap } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/chat");
      } else {
        setError(result.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pilot-bg flex flex-col items-center justify-center relative overflow-hidden font-['Outfit']">
      {/* Animated Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-pilot-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pilot-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="w-full max-w-[1100px] flex flex-col md:flex-row items-stretch justify-center z-10 p-4 gap-0 shadow-2xl rounded-3xl overflow-hidden border border-white/5">
        
        {/* Left Side: Branding/Visuals */}
        <div className="hidden md:flex flex-1 bg-pilot-surface/40 backdrop-blur-md p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-pilot-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-12">
                    <div className="p-3 bg-pilot-primary rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                        <Bot size={32} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">ChatPilot</span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                    The Next Generation of <span className="pilot-gradient-text">Conversational Intelligence.</span>
                </h1>
                <p className="text-pilot-secondary text-lg leading-relaxed max-w-md">
                    Secure, encrypted, and augmented with Titan-G4 neural processing for a seamless communication experience.
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
                <div className="flex items-start gap-3">
                    <div className="mt-1 text-emerald-500"><ShieldCheck size={20} /></div>
                    <div>
                        <p className="text-white font-semibold text-sm">Military Grade</p>
                        <p className="text-pilot-secondary text-xs">End-to-end encryption</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="mt-1 text-amber-500"><Zap size={20} /></div>
                    <div>
                        <p className="text-white font-semibold text-sm">Co-Pilot AI</p>
                        <p className="text-pilot-secondary text-xs">Smart response engine</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 bg-pilot-surface p-8 lg:p-14 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-pilot-secondary text-sm">Initialize your secure link to the network.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pilot-secondary uppercase tracking-widest ml-1">Pilot Frequency (Email)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pilot-secondary group-focus-within:text-pilot-primary transition-colors">
                    <Mail size={18} />
                </div>
                <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3.5 bg-pilot-bg border border-pilot-border rounded-xl text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 focus:border-pilot-primary outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-pilot-secondary uppercase tracking-widest">Access Key (Password)</label>
                <button type="button" className="text-[11px] text-pilot-primary hover:underline font-bold">RECOVER KEY</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pilot-secondary group-focus-within:text-pilot-primary transition-colors">
                    <Lock size={18} />
                </div>
                <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3.5 bg-pilot-bg border border-pilot-border rounded-xl text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 focus:border-pilot-primary outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </div>
            </div>

          <div className="flex gap-4 mt-8">
            <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-pilot-primary text-white py-4 rounded-xl hover:bg-pilot-primary-hover transition-all font-bold text-base shadow-[0_0_20px_rgba(99,102,241,0.3)] transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                      <LogIn size={20} />
                      LOGIN
                    </>
                )}
            </button>
            <button
                type="button"
                onClick={async () => {
                    setIsLoading(true);
                    try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/demo`, { method: 'POST' });
                        const data = await res.json();
                        if (res.ok) {
                             localStorage.setItem('userInfo', JSON.stringify(data));
                             // Force reload/redirect to ensure Context picks it up? 
                             // Better to use a Context method, but direct localStorage + window.location is robust for "Demo"
                             window.location.href = '/chat';
                        } else {
                            setError("Demo Unavailable");
                        }
                    } catch (err) {
                        setError("Connection Error");
                    } finally {
                        setIsLoading(false);
                    }
                }}
                className="flex-1 bg-pilot-surface border border-pilot-primary/50 text-pilot-primary hover:bg-pilot-primary/10 py-4 rounded-xl transition-all font-bold text-base transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Zap size={20} />
                TRY DEMO
            </button>
          </div>
          </form>

          <p className="mt-10 text-center text-pilot-secondary text-sm">
            Not registered on the network?{" "}
            <Link to="/signup" className="text-pilot-primary font-bold hover:underline">
              Request Access
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 text-pilot-secondary text-[11px] font-bold uppercase tracking-[0.2em] opacity-30">
        Secure Handshake Protocol v4.2 • Pilot Network
      </div>
    </div>
  );
};

export default Login;
