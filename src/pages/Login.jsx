import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          className="absolute inset-0 bg-[url('/assets/img/loginbg.png')] bg-cover bg-center opacity-40 scale-105 transition-transform duration-[20s] hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="relative z-10 w-full h-full p-24 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                 <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-widest uppercase italic">HURE CARE</span>
            </div>
          </div>

          <div className="max-w-xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-black text-white leading-[1.1] tracking-tight"
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
                <div key={i} className="h-12 w-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                </div>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-400">Trusted by over <span className="text-white">50+ Clinics</span> nationwide</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 bg-white relative">
        <div className="w-full max-w-md space-y-12">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="h-14 w-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-200">
               <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Portal Access</h2>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">Enter your professional credentials</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 p-6 rounded-2xl flex items-center gap-4 text-red-700 text-sm border-2 border-red-100/50"
            >
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-500" />
              <p className="font-bold leading-tight">{error}</p>
            </motion.div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-primary-600 transition-colors">Login Identification</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 rounded-[1.5rem] transition-all duration-300 text-slate-900 font-bold placeholder-slate-300 text-sm outline-none"
                    placeholder="physician@hurecare.com"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 group-focus-within:text-primary-600 transition-colors">Security Cipher</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 rounded-[1.5rem] transition-all duration-300 text-slate-900 font-bold placeholder-slate-300 text-sm outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" className="hidden" />
                <div className="h-5 w-5 border-2 border-slate-200 rounded-lg flex items-center justify-center group-hover:border-primary-500 transition-colors mr-3">
                  <div className="h-2 w-2 bg-primary-500 rounded-sm opacity-0" />
                </div>
                <span className="text-xs font-bold text-slate-600">Keep session active</span>
              </label>
              <a href="#" className="text-xs font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors">Recovery key?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-6 px-4 bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-slate-200 hover:bg-primary-600 hover:shadow-primary-100 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 group"
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
              Enterprise Grade Clinical ERP <br />
              Authorized Personnel Only
            </p>
            <p className="text-xs font-bold text-slate-400">
              New clinic? <a href="/signup" className="text-primary-600 hover:underline">Start for free</a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-12 flex flex-col items-center gap-4 text-center">
          <div className="h-px w-8 bg-slate-100" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} HURE CARE TECHNOLOGY WLL <br />
            SYSTEM ARCHITECTURE V2.4.0
          </p>
        </div>
      </div>
    </div>
  );
}
