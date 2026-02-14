import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Mail, User, Lock, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config';

export default function UserModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'doctor',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  // Sync form data when user changes or modal opens
  React.useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'doctor',
        status: 'active'
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave(formData);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-white"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{user ? 'Edit User' : 'Add New User'}</h3>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Full Name</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-2xl transition-all duration-200 text-slate-900 placeholder-slate-400 text-sm font-medium"
                      placeholder="e.g. Dr. John Doe"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Email Address</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-2xl transition-all duration-200 text-slate-900 placeholder-slate-400 text-sm font-medium"
                      placeholder="john@hospital.com"
                    />
                  </div>
                </div>

                {!user && (
                    <div className="relative">
                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Initial Password</label>
                    <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                        type="password"
                        required
                        minLength={6}
                        value={formData.password || ''}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-2xl transition-all duration-200 text-slate-900 placeholder-slate-400 text-sm font-medium"
                        placeholder="Min. 6 characters"
                        />
                    </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">User Role</label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-slate-400" />
                      </div>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-2xl transition-all duration-200 text-slate-900 text-sm font-medium appearance-none"
                      >
                        {APP_CONFIG.ROLES.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Account Status</label>
                    <div className="mt-1 relative">
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="block w-full px-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-2xl transition-all duration-200 text-slate-900 text-sm font-medium appearance-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 p-4 rounded-2xl flex gap-3 text-primary-700 text-sm font-medium border border-primary-100">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                Staff accounts are created immediately. The password you set will be required for their first login.
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-70 active:scale-95 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    user ? 'Update User' : 'Create Account'
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
