import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2,
  Stethoscope,
  Globe
} from 'lucide-react';
import facilityService from '../services/facilityService';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    facilityName: '',
    facilityType: 'General Clinic',
    phone: ''
  });
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      // In a real SaaS, this would create the User AND the Facility entry
      await signup(formData.email, formData.password, {
        name: formData.name,
        role: 'clinic_owner'
      });
      
      // Seed initial facility data
      await facilityService.updateProfile({
        name: formData.facilityName,
        type: formData.facilityType,
        email: formData.email,
        phone: formData.phone
      });

      setStep(3); // Success step
    } catch (err) {
      console.error('Signup Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password Auth is NOT enabled in your Firebase Console. See step 3A of the guide.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError(err.message || 'Failed to create an account.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('/bg-mesh.svg')] bg-cover">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full space-y-8 bg-white/80 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl border border-white"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200 mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Launch Your Facility
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {step === 1 ? 'Start with your personal account' : step === 2 ? 'Tell us about your clinic' : 'Welcome aboard!'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-2xl text-red-600 text-sm font-bold border border-red-100 flex items-center gap-3">
             <CheckCircle2 className="h-5 w-5 rotate-45" /> {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Dr. Jon Day" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" 
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                 <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="jon@hospital.com" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" 
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                   <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full px-4 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm</label>
                   <input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full px-4 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" 
                   />
                 </div>
               </div>
               <button 
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 mt-8"
               >
                 Next: Facility Info <ArrowRight className="h-4 w-4" />
               </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Facility Name</label>
                 <div className="relative">
                   <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <input 
                    type="text" 
                    value={formData.facilityName}
                    onChange={(e) => setFormData({...formData, facilityName: e.target.value})}
                    placeholder="Nairobi Health Plaza" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" 
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Practice Type</label>
                 <select 
                  value={formData.facilityType}
                  onChange={(e) => setFormData({...formData, facilityType: e.target.value})}
                  className="w-full px-4 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none appearance-none"
                 >
                   <option>General Clinic</option>
                   <option>Multi-Speciality Hospital</option>
                   <option>Dental Practice</option>
                   <option>Diagnostic Laboratory</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Official Phone</label>
                 <div className="relative">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                   <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254 700 000 000" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 rounded-2xl text-sm font-bold transition-all outline-none" 
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mt-8">
                 <button 
                  onClick={handleBack}
                  className="py-5 bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                 >
                   Back
                 </button>
                 <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-5 bg-primary-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-70"
                 >
                   {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                 </button>
               </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
               <div className="h-24 w-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner">
                  <CheckCircle2 className="h-12 w-12" />
               </div>
               <h3 className="text-2xl font-black text-slate-900">Registration Successful!</h3>
               <p className="text-slate-500 mt-4 font-medium px-8 leading-relaxed">
                 Your facility <span className="text-slate-900 font-bold">{formData.facilityName}</span> is being provisioned. Please sign in to begin configuration.
               </p>
               <button 
                onClick={() => navigate('/login')}
                className="mt-10 px-12 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
               >
                 Proceed to Login
               </button>
            </motion.div>
          )}
        </form>

        {step < 3 && (
          <p className="mt-8 text-center text-sm font-bold text-slate-400">
            Already registered? <Link to="/login" className="text-primary-600 hover:underline">Sign In</Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
