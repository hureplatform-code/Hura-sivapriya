import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Save, 
  X,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { PERMISSION_MODULES } from '../../constants/permissions';
import userService from '../../services/userService';

export default function PermissionsEditor({ userId, userName, onClose }) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchPermissions();
  }, [userId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const user = await userService.getUserById(userId);
      setPermissions(user?.permissions || {});
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAll = () => {
    const allPermissions = {};
    PERMISSION_MODULES.forEach(module => {
      if (module.key) allPermissions[module.key] = true;
      if (module.rights) {
        module.rights.forEach(r => allPermissions[r.key] = true);
      }
      if (module.children) {
        module.children.forEach(c => allPermissions[c.key] = true);
      }
    });
    setPermissions(allPermissions);
  };

  const handleClearAll = () => {
    setPermissions({});
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updateUser(userId, { permissions });
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      setNotification({ type: 'error', message: 'Failed to save permissions matrix.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-slate-200">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Security Matrix</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Granular Access Control • {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleSelectAll}
               className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
             >
               Select All
             </button>
             <button 
               onClick={handleClearAll}
               className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
             >
               Clear All
             </button>
             <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all ml-2">
               <X className="h-6 w-6" />
             </button>
          </div>
        </div>

        {/* Matrix Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Decrypting permission nodes...</p>
             </div>
          ) : (
            <div className="space-y-4">
              {PERMISSION_MODULES.map((module) => (
                <div key={module.id} className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                  {/* Row Header */}
                  <div className={`p-6 flex items-center justify-between transition-colors ${module.type === 'parent' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${module.type === 'parent' ? 'bg-white/10' : 'bg-slate-100 text-slate-400'}`}>
                        {module.type === 'parent' ? <Unlock className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                      <span className="font-black uppercase tracking-widest text-xs">{module.name}</span>
                    </div>

                    {module.key && (
                      <button 
                        onClick={() => handleToggle(module.key)}
                        className={`p-2 rounded-xl transition-all ${permissions[module.key] ? 'text-primary-400' : 'text-slate-300'}`}
                      >
                        {permissions[module.key] ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                      </button>
                    )}
                  </div>

                  {/* Rights Grid */}
                  {(module.rights || module.children) && (
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white">
                      {(module.rights || module.children).map((right) => (
                        <button
                          key={right.key}
                          onClick={() => handleToggle(right.key)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group
                            ${permissions[right.key] 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                              : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'
                            }
                          `}
                        >
                          <span className={`text-[10px] font-black uppercase tracking-widest transition-transform group-active:scale-95`}>
                            {right.label}
                          </span>
                          {permissions[right.key] ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle className="h-4 w-4 opacity-30" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 bg-white sticky bottom-0 z-10 flex gap-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-slate-100 transition-all"
          >
            Discard Changes
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="flex-3 px-12 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? (
               <>
                 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Syncing Security Policy...
               </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Commit Permission Matrix
              </>
            )}
          </button>
        </div>

      </motion.div>
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
             <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-white" />}
             </div>
             {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
