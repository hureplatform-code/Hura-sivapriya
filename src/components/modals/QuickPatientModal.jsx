import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Phone, Mail, Calendar, MapPin, CreditCard, ShieldCheck, UserPlus } from 'lucide-react';
import patientService from '../../services/patientService';

export default function QuickPatientModal({ isOpen, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    dob: '',
    age: '',
    gender: 'Other',
    address: '',
    paymentMode: 'Cash',
    insurer: '',
    plan: '',
    memberNumber: '',
    relationship: 'Self',
    memberNameIfOther: '',
    nextOfKin: '',
    status: 'active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const patientId = `PAT-${Date.now().toString().slice(-6)}`;
      const newPatient = {
        ...formData,
        id: patientId,
        createdAt: new Date()
      };
      
      const result = await patientService.createPatient(newPatient);
      if (onSave) onSave({ ...newPatient, id: result.id || patientId });
      onClose();
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("Failed to register patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register New Patient</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Quick registration for immediate clinical visits.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all"
                      placeholder="+254..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      name="dob"
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={formData.dob}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Age</label>
                  <input
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all"
                    placeholder="Years"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Gender</label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-6 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all appearance-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Email (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Next of Kin</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      name="nextOfKin"
                      value={formData.nextOfKin}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all"
                      placeholder="Name & Relationship"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Payment Mode</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="paymentMode" 
                        value="Cash" 
                        checked={formData.paymentMode === 'Cash'}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 border-slate-200 focus:ring-primary-500"
                      />
                      <span className="text-sm font-bold text-slate-700">Cash / Personal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="paymentMode" 
                        value="Insurance" 
                        checked={formData.paymentMode === 'Insurance'}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 border-slate-200 focus:ring-primary-500"
                      />
                      <span className="text-sm font-bold text-slate-700">Insurance / Corporate</span>
                    </label>
                  </div>
                </div>

                {formData.paymentMode === 'Insurance' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Insurer Name</label>
                      <input
                        name="insurer"
                        value={formData.insurer}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary-500 transition-all"
                        placeholder="e.g. NHIF, Jubilee..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Member Number</label>
                      <input
                        name="memberNumber"
                        value={formData.memberNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary-500 transition-all"
                        placeholder="POL-1234..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Relationship</label>
                      <select
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleChange}
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary-500 transition-all"
                      >
                        <option value="Self">Self</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {formData.relationship !== 'Self' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Principal Member Name</label>
                        <input
                          name="memberNameIfOther"
                          value={formData.memberNameIfOther}
                          onChange={handleChange}
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary-500 transition-all"
                          placeholder="Primary account holder"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Residential Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none transition-all resize-none"
                    placeholder="Enter street, city, or estate..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-8 py-4 bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] px-8 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-200 disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Register Patient
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
