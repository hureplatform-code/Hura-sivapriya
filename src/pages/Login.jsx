import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-white font-['Inter']">
      {/* Left Side: Brand Imagery */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-slate-900">
        <div 
          className="absolute inset-0 bg-[url('/assets/img/loginbg_v2.png')] bg-cover bg-center opacity-80 scale-105 transition-transform duration-[20s] hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="relative z-10 w-full h-full p-24 flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Hure Care Logo" className="h-14 w-auto object-contain drop-shadow-md" />
              <span className="text-3xl font-bold text-white tracking-widest uppercase italic shadow-black drop-shadow-md">HURE CARE</span>
            </div>

          <div className="max-w-xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-medium text-white leading-[1.1] tracking-tight"
            >
              Excellence <br />
              <span className="text-primary-400">in Healthcare</span> <br />
              Management.
            </motion.h1>
            <p className="mt-8 text-xl text-slate-300 font-medium leading-relaxed">
              Standardizing hospital operations with precision, intelligence, and empathy. Your clinical ecosystem, elevated.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex -space-x-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-12 w-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-medium text-white uppercase overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-slate-400">Trusted by over <span className="text-white">50+ Clinics</span> nationwide</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 bg-white relative">
        <div className="w-full max-w-md space-y-12">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="h-14 w-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-200 overflow-hidden p-2">
               <img src="/logo.png" alt="Hure Care Logo" className="h-full w-full object-contain" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Portal Access</h2>
            <p className="text-slate-500 font-medium mt-2 uppercase tracking-widest text-xs">Enter your professional credentials</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 p-6 rounded-2xl flex items-center gap-4 text-red-700 text-sm border-2 border-red-100/50"
            >
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-500" />
              <p className="font-medium leading-tight">{error}</p>
            </motion.div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-primary-600 transition-colors">Login Identification</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 rounded-[1.5rem] transition-all duration-300 text-slate-900 font-medium placeholder-slate-300 text-sm outline-none"
                    placeholder="physician@hurecare.com"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-primary-600 transition-colors">Security Cipher</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-16 pr-14 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 rounded-[1.5rem] transition-all duration-300 text-slate-900 font-medium placeholder-slate-300 text-sm outline-none"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-primary-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              {/* Removed Session/Recovery options as per request */}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-6 px-4 bg-slate-900 text-white font-medium text-sm uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-slate-200 hover:bg-primary-600 hover:shadow-primary-100 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 group"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-loose">
              Enterprise Grade Clinical ERP <br />
              Authorized Personnel Only
            </p>
            <p className="text-xs font-medium text-slate-400">
              New clinic? <a href="/signup" className="text-primary-600 hover:underline">Start for free</a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-12 flex flex-col items-center gap-4 text-center">
          <div className="h-px w-8 bg-slate-100" />
          <p className="text-[10px] font-medium text-slate-300 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} HURE CARE TECHNOLOGY WLL <br />
            SYSTEM ARCHITECTURE V2.4.0
          </p>
        </div>
      </div>
    </div>
  );
}
