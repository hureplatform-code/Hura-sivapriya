import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Globe,
  MapPin,
  FileText,
  BadgeCent,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles
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
    licenseNumber: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    subscriptionPlan: 'Essential'
  });
  const [error, setError] = useState('');
  const { signup, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get('plan');
    if (plan && ['Essential', 'Professional', 'Enterprise'].includes(plan)) {
      setFormData(prev => ({ ...prev, subscriptionPlan: plan }));
    }
  }, [location]);

  React.useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

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

      const newFacility = await facilityService.createFacility({
        name: formData.facilityName,
        type: formData.facilityType,
        license: formData.licenseNumber,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        subscriptionPlan: formData.subscriptionPlan
      });

      if (!newFacility || !newFacility.id) {
        throw new Error("Failed to provision facility.");
      }

      await signup(formData.email, formData.password, {
        name: formData.name,
        role: 'clinic_owner',
        facilityId: newFacility.id,
        status: 'active'
      });

      await logout();
      setStep(4);
    } catch (err) {
      console.error('Signup Error:', err);
      setError(err.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { title: 'Identity', desc: 'Your personal access' },
    { title: 'Facility', desc: 'Clinic information' },
    { title: 'Plan', desc: 'Workflow selection' }
  ];

  return (
    <div className="min-h-screen flex bg-white font-['Inter']">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden bg-[#030712]">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/40 via-[#030712]/80 to-[#030712]" />

        <div className="relative z-10 w-full h-full p-20 flex flex-col justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg shadow-white/5 transition-transform group-hover:scale-110">
              <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight italic">
              HURE <span className="text-teal-400">Care</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-teal-500/5 border border-teal-500/10 text-teal-400 text-[10px] font-black tracking-[0.2em] uppercase">
              <Sparkles className="h-3 w-3" />
              Trusted by 500+ Clinicians
            </div>
            <h1 className="text-5xl lg:text-7xl font-medium text-white leading-[1.05] tracking-tight">
              Digital <br />
              Transformation <br />
              <span className="text-teal-400 relative inline-block">
                for your facility.
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-teal-500/20 rounded-full" />
              </span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-sm font-medium">
              Join the fastest growing clinical network in Kenya. Streamline documentation and elevate patient outcomes.
            </p>

            <div className="flex gap-4 pt-8">
              <div className="px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
                <div className="text-2xl font-bold text-white tracking-tight leading-none mb-2">24h</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-widest leading-none font-black italic">Setup Cycle</div>
              </div>
              <div className="px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
                <div className="text-2xl font-bold text-white tracking-tight leading-none mb-2">Zero</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-widest leading-none font-black italic">Setup Fees</div>
              </div>
            </div>
          </div>

          <div className="text-slate-600 text-[10px] uppercase font-black tracking-[0.4em] italic">
            © 2026 HURE CARE TECHNOLOGY
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-[60%] flex flex-col relative bg-slate-50/30">
        {/* Top Header for Mobile */}
        <div className="lg:hidden p-8 flex justify-center border-b border-slate-100 bg-white">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 overflow-y-auto">
          <div className="w-full max-w-xl">

            {step < 4 && (
              <div className="mb-16">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8">
                  {steps.map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className={`h-1.5 w-[80%] rounded-full mb-3 transition-colors duration-500 ${step > i ? 'bg-teal-600 shadow-sm shadow-teal-100' : 'bg-slate-200'}`} />
                      <div className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${step === i + 1 ? 'text-teal-600' : 'text-slate-400'}`}>{s.title}</div>
                    </div>
                  ))}
                </div>
                <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">{steps[step - 1].title} Details</h2>
                <p className="text-slate-500 mt-2 text-sm">{steps[step - 1].desc}</p>
              </div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 rotate-180" /> {error}
              </motion.div>
            )}

            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Administrator Name</label>
                        <div className="relative group">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Full Name"
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Primary Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@facility.com"
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Confirm Identity</label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Facility Registry Name</label>
                      <div className="relative group">
                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                        <input
                          type="text"
                          value={formData.facilityName}
                          onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                          placeholder="Formal Hospital/Clinic Name"
                          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Practice Category</label>
                        <select
                          value={formData.facilityType}
                          onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                          className="w-full px-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                        >
                          <option>General Clinic</option>
                          <option>Multi-Speciality Hospital</option>
                          <option>Dental Practice</option>
                          <option>Diagnostic Laboratory</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Official Licensing ID</label>
                        <div className="relative group">
                          <FileText className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                          <input
                            type="text"
                            value={formData.licenseNumber}
                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            placeholder="Reg-XXXXX"
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Contact Phone</label>
                        <div className="relative group">
                          <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+254 XXX"
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">City/Town</label>
                        <div className="relative group">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Nairobi"
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 rounded-2xl outline-none transition-all font-medium text-sm text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      {[
                        { id: 'Essential', users: '10 Users', locs: '1 Location', price: 'Ksh 10,000' },
                        { id: 'Professional', users: '30 Users', locs: '2 Locations', price: 'Ksh 18,000' },
                        { id: 'Enterprise', users: '75 Users', locs: '5 Locations', price: 'Ksh 30,000' }
                      ].map(plan => (
                        <label key={plan.id} className={`flex items-center p-6 border-2 rounded-[2rem] cursor-pointer transition-all ${formData.subscriptionPlan === plan.id ? 'border-teal-600 bg-teal-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                          <input
                            type="radio"
                            name="plan"
                            value={plan.id}
                            checked={formData.subscriptionPlan === plan.id}
                            onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                            className="hidden"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-slate-900">{plan.id} Plan</h4>
                              {plan.id === 'Professional' && <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-600 text-white rounded-full">POPULAR</span>}
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-1">{plan.users} • {plan.locs}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">{plan.price}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">monthly</div>
                          </div>
                          <div className={`ml-6 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.subscriptionPlan === plan.id ? 'border-teal-600 bg-teal-600' : 'border-slate-300'}`}>
                            {formData.subscriptionPlan === plan.id && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="h-24 w-24 bg-teal-100 rounded-[2.5rem] flex items-center justify-center text-teal-600 mx-auto mb-10 shadow-lg shadow-teal-50">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">System Provisioned!</h3>
                    <p className="text-slate-500 mt-6 text-lg max-w-sm mx-auto leading-relaxed">
                      Your clinical ecosystem for <span className="text-slate-900 font-bold">{formData.facilityName}</span> is being built.
                      A verification link has been dispatched to your email.
                    </p>

                    <div className="mt-12 p-6 bg-slate-100 rounded-[2rem] border border-slate-200 flex items-center gap-4 text-left">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shrink-0 shadow-sm font-bold">10</div>
                      <div className="text-sm font-medium text-slate-600">Your <span className="font-bold text-slate-900">10-Day Full Access Trial</span> has been activated for the {formData.subscriptionPlan} tier.</div>
                    </div>

                    <button
                      onClick={() => navigate('/login')}
                      className="mt-12 w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-2xl shadow-slate-200 hover:bg-teal-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      Enter Your Portal <ArrowRight className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {step < 4 && (
                <div className="flex gap-4 pt-4">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-8 py-5 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={step === 3 ? handleSubmit : handleNext}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-2xl shadow-slate-200 hover:bg-teal-600 transition-all disabled:opacity-70 active:scale-95 group"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {step === 3 ? 'Finalize Trial Setup' : 'Continue'}
                        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>

            {step < 4 && (
              <p className="mt-12 text-center text-sm font-medium text-slate-400">
                Already have an account? <Link to="/login" className="text-teal-600 hover:underline font-bold">Sign In</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
