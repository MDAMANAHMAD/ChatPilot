/**
 * LOGIN PAGE
 * 
 * Handles user authentication through an email/password form.
 * Features:
 * - State-driven form validation.
 * - Integration with AuthContext for session management.
 * - Demo mode for instant access without manual registration.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bot, LogIn, Mail, Lock, ShieldCheck, Zap, Sparkles } from "lucide-react";

const Login = () => {
  // FORM STATE
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  /**
   * STANDARD LOGIN HANDLER
   * Sends credentials to the backend and redirects on success.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/chat");
      } else {
        setError(result.message || "Invalid credentials. Link denied.");
      }
    } catch (err) {
      setError("Connection failure. Check your link status.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * DEMO MODE HANDLER
   * Creates a temporary guest session and a link with Pilot Bot.
   */
  const handleDemo = async () => {
    setIsDemoLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/demo`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data._id) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        window.location.href = '/chat';
      }
    } catch (err) {
      setError("Demo servers are currently offline.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pilot-bg flex flex-col items-center justify-center relative overflow-hidden font-['Outfit']">
      
      {/* Background visual effects - blurred neon orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pilot-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pilot-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row items-stretch justify-center z-10 p-4 gap-0 shadow-2xl">
        
        {/* Left Side: Branding and Visuals */}
        <div className="flex-1 bg-pilot-surface/40 backdrop-blur-md p-10 lg:p-16 flex flex-col justify-between rounded-l-3xl border-l border-y border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-pilot-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="p-3 bg-pilot-primary rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                        <Bot size={32} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white font-['Outfit']">ChatPilot</span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                    The Next Gen <span className="pilot-gradient-text">AI Powered</span> Communication.
                </h1>
                <p className="text-pilot-secondary text-lg leading-relaxed max-w-md">
                    Secure, encrypted, and intelligently assisted. Connect your frequency to the Pilot network.
                </p>
            </div>

            <div className="relative z-10 flex flex-col gap-5 mt-10">
                <div className="flex items-center gap-3">
                    <div className="text-emerald-500 bg-emerald-500/10 p-2 rounded-lg"><ShieldCheck size={20} /></div>
                    <p className="text-white font-semibold text-sm">End-to-End Encryption Protocol</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-violet-500 bg-violet-500/10 p-2 rounded-lg"><Zap size={20} /></div>
                    <p className="text-white font-semibold text-sm">Real-time AI Suggestion Engine</p>
                </div>
            </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="flex-1 bg-pilot-surface p-10 lg:p-16 flex flex-col justify-center rounded-r-3xl border-r border-y border-white/5">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Initialize Session</h2>
            <p className="text-pilot-secondary text-sm">Enter your credentials to link to the network.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pilot-secondary uppercase tracking-widest ml-1">Frequency ID (Email)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pilot-secondary group-focus-within:text-pilot-primary transition-colors">
                    <Mail size={18} />
                </div>
                <input
                    type="email"
                    placeholder="pilot@chatpilot.ai"
                    className="w-full pl-12 pr-4 py-3.5 bg-pilot-bg border border-pilot-border rounded-xl text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-pilot-secondary uppercase tracking-widest ml-1">Access Key</label>
                <Link to="#" className="text-[11px] font-bold text-pilot-primary hover:underline">Lost access?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pilot-secondary group-focus-within:text-pilot-primary transition-colors">
                    <Lock size={18} />
                </div>
                <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-pilot-bg border border-pilot-border rounded-xl text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pilot-primary text-white py-4 rounded-xl hover:bg-pilot-primary-hover transition-all font-bold text-base shadow-[0_0_20px_rgba(99,102,241,0.3)] transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                  <>
                    <LogIn size={20} />
                    ESTABLISH LINK
                  </>
              )}
            </button>
          </form>

          {/* Social / Demo Options */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-8">
                <div className="border-t border-pilot-border w-full"></div>
                <span className="bg-pilot-surface px-4 text-[11px] font-bold text-pilot-secondary uppercase tracking-widest absolute">Or use quick access</span>
            </div>

            <button
              onClick={handleDemo}
              disabled={isDemoLoading}
              className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-xl hover:bg-white/10 transition-all font-bold text-sm flex items-center justify-center gap-3 active:scale-[0.98]"
            >
                {isDemoLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                        <Sparkles size={18} className="text-amber-400" />
                        INSTANT DEMO SESSION
                    </>
                )}
            </button>
          </div>

          <p className="mt-8 text-center text-pilot-secondary text-sm">
            Not configured on the network?{" "}
            <Link to="/signup" className="text-pilot-accent font-bold hover:underline">
              Request Frequency
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
