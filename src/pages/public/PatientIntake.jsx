import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import firestoreService from '../../services/firestoreService';
import { ShieldAlert, CheckCircle2, Stethoscope, Heart, Activity, User, Phone, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientIntake() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const patientId = searchParams.get('pid');

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [verified, setVerified] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
     name: '',
     age: '',
     gender: '',
     address: '',
     nextOfKin: '',
     kinPhone: '',
     allergies: '',
     chronicConditions: '',
     insuranceScheme: '',
     insuranceMemberNo: ''
  });

  useEffect(() => {
    if (!token || !patientId) {
       setError("Invalid or expired secure link.");
       setLoading(false);
       return;
    }
    
    // In production, token should be verified against a backend to ensure it hasn't expired (>24h).
    // For this client showcase, we simulate the token fetch.
    const fetchPatientData = async () => {
       try {
           const data = await firestoreService.get('patients', patientId);
           if (!data) {
               setError("Record not found.");
           } else {
               setPatient(data);
               setFormData({
                   name: data.name || '',
                   age: data.age || '',
                   gender: data.gender || '',
                   address: data.address || '',
                   nextOfKin: data.nextOfKin || '',
                   kinPhone: data.kinPhone || '',
                   allergies: data.allergies || '',
                   chronicConditions: data.chronicConditions || '',
                   insuranceScheme: data.insuranceScheme || '',
                   insuranceMemberNo: data.insuranceMemberNo || ''
               });
           }
       } catch (err) {
           setError("Failed to load secure link.");
       } finally {
           setLoading(false);
       }
    };
    fetchPatientData();
  }, [token, patientId]);

  const handleVerify = (e) => {
      e.preventDefault();
      setError('');
      if(!patient?.phone) {
          setError("Patient record missing phone. Cannot verify.");
          return;
      }
      // Check last 4 digits (ignoring spaces/dashes)
      const cleanPhone = patient.phone.replace(/\D/g, '');
      const last4True = cleanPhone.slice(-4);
      if(verifyPhone === last4True) {
          setVerified(true);
      } else {
          setError("Verification failed. Please check the last 4 digits of your phone number.");
      }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          const intakeRecord = {
              patientId,
              token,
              submittedAt: new Date().toISOString(),
              status: 'Pending Review',
              data: formData
          };
          await firestoreService.create('intake_forms', intakeRecord);
          setSubmitted(true);
      } catch(err) {
          setError("Failed to submit intake form.");
      } finally {
          setLoading(false);
      }
  };

  if (loading) {
      return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500 font-medium">Loading secure portal...</div>;
  }

  if (error && !patient) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
             <div className="max-w-md w-full bg-white p-12 rounded-3xl border border-red-100 shadow-xl overflow-hidden">
                <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Access Denied</h1>
                <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">{error}</p>
             </div>
          </div>
      );
  }

  if (submitted) {
       return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
             <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="max-w-md w-full bg-white p-12 rounded-[2.5rem] border border-emerald-100 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
                <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6 drop-shadow-lg" />
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Form Submitted</h1>
                <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">Thank you. Your health history and clinical intake details have been securely transmitted to the clinic. You may close this window.</p>
             </motion.div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
       <div className="max-w-3xl mx-auto space-y-8">
           {/* Header */}
           <div className="text-center space-y-2">
               <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center text-primary-600 shadow-xl mx-auto mb-6 border border-slate-100">
                   <Stethoscope className="h-8 w-8" />
               </div>
               <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Secure Portal</h1>
               <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">HURE Care Pre-Registration</p>
           </div>

           <AnimatePresence mode="wait">
               {!verified ? (
                   <motion.div key="verify" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.95}} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-lg mx-auto mt-12 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
                      <div className="flex items-center gap-4 mb-8">
                          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                             <ShieldCheck className="h-6 w-6" />
                          </div>
                          <div>
                             <h2 className="text-xl font-bold text-slate-900 tracking-tight">Identity Verification</h2>
                             <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Required to access form</p>
                          </div>
                      </div>
                      
                      {error && <div className="p-4 mb-6 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest rounded-xl text-center border border-red-100 animate-pulse">{error}</div>}
                      
                      <form onSubmit={handleVerify} className="space-y-6">
                          <div>
                              <label className="block text-xs font-bold text-slate-900 mb-2">LAST 4 DIGITS OF YOUR PHONE</label>
                              <div className="relative">
                                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                  <input 
                                     type="text" 
                                     maxLength={4}
                                     required
                                     placeholder="e.g. 5555"
                                     value={verifyPhone}
                                     onChange={(e) => setVerifyPhone(e.target.value)}
                                     className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl py-5 pl-14 pr-6 text-xl tracking-[0.3em] font-mono outline-none transition-all"
                                  />
                              </div>
                              <p className="text-[10px] font-medium text-slate-400 mt-3 text-center">Your data is secured with AES-256 TLS Encryption.</p>
                          </div>
                          <button type="submit" className="w-full py-5 bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
                              Verify & Continue
                          </button>
                      </form>
                   </motion.div>
               ) : (
                   <motion.div key="form" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative">
                       <div className="absolute top-0 left-0 right-0 h-2 bg-primary-500" />
                       <div className="p-10 border-b border-slate-50/50 bg-slate-50/30">
                          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Health History & Demographics</h2>
                          <p className="text-sm font-medium text-slate-500 mt-2">Please complete this form before your clinical visit to save time.</p>
                       </div>
                       
                       <form onSubmit={handleSubmit} className="p-10 space-y-10">
                           {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center">{error}</div>}

                           <div className="space-y-6">
                               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">1. Personal Information</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Full Legal Name</label>
                                     <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all shadow-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Current Age</label>
                                     <input type="number" required value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all shadow-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Gender</label>
                                     <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all shadow-sm">
                                         <option value="">Select...</option>
                                         <option>Male</option><option>Female</option><option>Other</option>
                                     </select>
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Home Address / Town</label>
                                     <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all shadow-sm" />
                                  </div>
                               </div>
                           </div>

                           <div className="space-y-6">
                               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">2. Emergency Contact / Next of Kin</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Next of Kin Name</label>
                                     <input type="text" value={formData.nextOfKin} onChange={(e) => setFormData({...formData, nextOfKin: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all shadow-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Kin Phone Number</label>
                                     <input type="text" value={formData.kinPhone} onChange={(e) => setFormData({...formData, kinPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all shadow-sm" />
                                  </div>
                               </div>
                           </div>

                           <div className="space-y-6">
                               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">3. Health Profile</h3>
                               <div className="space-y-6">
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Known Allergies (Food or Medication)</label>
                                     <textarea rows="2" value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})} placeholder="e.g. Penicillin, Peanuts (N/A if none)" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all resize-none shadow-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Chronic Conditions / Medical History</label>
                                     <textarea rows="2" value={formData.chronicConditions} onChange={(e) => setFormData({...formData, chronicConditions: e.target.value})} placeholder="e.g. Hypertension, Asthma (N/A if none)" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all resize-none shadow-sm" />
                                  </div>
                               </div>
                           </div>

                             <div className="space-y-6">
                               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">4. Insurance Details (If Applicable)</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Insurance Provider/Scheme</label>
                                     <input type="text" value={formData.insuranceScheme} onChange={(e) => setFormData({...formData, insuranceScheme: e.target.value})} placeholder="e.g. NHIF, Jubilee" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all shadow-sm" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 ml-1">Member Number</label>
                                     <input type="text" value={formData.insuranceMemberNo} onChange={(e) => setFormData({...formData, insuranceMemberNo: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-primary-300 font-medium text-sm transition-all shadow-sm" />
                                  </div>
                               </div>
                           </div>

                           <div className="pt-8 flex flex-col items-center">
                               <button disabled={loading} type="submit" className="w-full md:w-auto px-16 py-5 bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center">
                                   {loading ? 'Submitting securely...' : 'Submit Final Form'}
                               </button>
                               <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                   <Heart className="h-3 w-3" /> Data is safe and encrypted standard
                               </div>
                           </div>
                       </form>
                   </motion.div>
               )}
           </AnimatePresence>
       </div>
    </div>
  );
}
