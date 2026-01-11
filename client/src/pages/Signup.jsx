import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bot, UserPlus, Mail, Lock, User, Phone, ShieldCheck, Zap } from "lucide-react";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await register(username, email, phoneNumber, password);
      if (result.success) {
        navigate("/chat");
      } else {
        setError(result.message || "Failed to create account. Frequency might be taken.");
      }
    } catch (err) {
      setError("An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pilot-bg flex flex-col items-center justify-center relative overflow-hidden font-['Outfit']">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-pilot-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-pilot-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="w-full max-w-[1100px] flex flex-col md:flex-row-reverse items-stretch justify-center z-10 p-4 gap-0 shadow-2xl rounded-3xl overflow-hidden border border-white/5">
        
        {/* Right Side: Visuals */}
        <div className="hidden md:flex flex-1 bg-pilot-surface/40 backdrop-blur-md p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute bottom-0 left-0 p-32 bg-pilot-accent/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
            
            <div className="relative z-10 text-right flex flex-col items-end">
                <div className="flex items-center gap-3 mb-12">
                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-white/60">ChatPilot</span>
                    <div className="p-3 bg-pilot-accent rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                        <Bot size={32} className="text-white" />
                    </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                    Join the <span className="pilot-gradient-text">Neural Network.</span>
                </h1>
                <p className="text-pilot-secondary text-lg leading-relaxed max-w-md">
                    Claim your unique frequency and start communicating with the power of ChatPilot AI.
                </p>
            </div>

            <div className="relative z-10 flex flex-col items-end gap-6 mt-12 text-right">
                <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="mt-1 text-emerald-500"><ShieldCheck size={20} /></div>
                    <div>
                        <p className="text-white font-semibold text-sm">Secure Entry</p>
                        <p className="text-pilot-secondary text-xs">Biometric-ready access keys</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="mt-1 text-amber-500"><Zap size={20} /></div>
                    <div>
                        <p className="text-white font-semibold text-sm">Instant Sync</p>
                        <p className="text-pilot-secondary text-xs">Proprietary low-latency link</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Left Side: Signup Form */}
        <div className="flex-1 bg-pilot-surface p-8 lg:p-14 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Request Access</h2>
            <p className="text-pilot-secondary text-sm">Deploy your pilot station on the network.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-pilot-secondary uppercase tracking-widest ml-1">Callsign (Username)</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pilot-secondary group-focus-within:text-pilot-primary transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="w-full pl-12 pr-4 py-3 bg-pilot-bg border border-pilot-border rounded-xl text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 outline-none transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-pilot-secondary uppercase tracking-widest ml-1">Frequency (Phone)</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pilot-secondary group-focus-within:text-pilot-primary transition-colors">
                            <Phone size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="91xxxxxxxx"
                            className="w-full pl-12 pr-4 py-3 bg-pilot-bg border border-pilot-border rounded-xl text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 outline-none transition-all"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-pilot-secondary uppercase tracking-widest ml-1">Registry Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pilot-secondary group-focus-within:text-pilot-primary transition-colors">
                    <Mail size={18} />
                </div>
                <input
                    type="email"
                    placeholder="john@pilot.net"
                    className="w-full pl-12 pr-4 py-3 bg-pilot-bg border border-pilot-border rounded-xl text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-pilot-secondary uppercase tracking-widest ml-1">Master Access Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pilot-secondary group-focus-within:text-pilot-primary transition-colors">
                    <Lock size={18} />
                </div>
                <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-pilot-bg border border-pilot-border rounded-xl text-white placeholder-pilot-secondary/50 focus:ring-2 focus:ring-pilot-primary/30 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pilot-accent text-white py-4 rounded-xl hover:bg-pilot-accent/90 transition-all font-bold text-base shadow-[0_0_20px_rgba(139,92,246,0.3)] transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-6"
            >
              {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deploying Station...
                  </>
              ) : (
                  <>
                    <UserPlus size={20} />
                    ACTIVATE STATION
                  </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-pilot-secondary text-sm">
            Already registered?{" "}
            <Link to="/login" className="text-pilot-accent font-bold hover:underline">
              Access Station
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
