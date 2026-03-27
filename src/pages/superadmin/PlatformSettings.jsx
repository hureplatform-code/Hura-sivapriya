import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Settings, Shield, Key, Eye, EyeOff, CheckCircle2, AlertCircle, BrainCircuit, DollarSign, Globe, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import auditService from '../../services/auditService';
import { Navigate } from 'react-router-dom';

export default function PlatformSettings() {
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const [config, setConfig] = useState({
    geminiApiKey: '',
    baseCurrency: 'USD'
  });

  // Verify Superadmin access
  if (userData?.role !== 'superadmin') {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    fetchPlatformConfig();
  }, []);

  const fetchPlatformConfig = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'platform_settings', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig({
          geminiApiKey: data.geminiApiKey || '',
          baseCurrency: data.baseCurrency || 'USD'
        });
      }
    } catch (err) {
      console.error('Error fetching config:', err);
      toastError('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const docRef = doc(db, 'platform_settings', 'main');
      await setDoc(docRef, {
        ...config,
        updatedAt: serverTimestamp(),
        updatedBy: userData.uid
      }, { merge: true });
      
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'UPDATE_PLATFORM_SETTINGS',
        module: 'GOVERNANCE',
        description: `Updated platform settings. Base Currency set to ${config.baseCurrency}`
      });

      success('Platform settings saved successfully.');
    } catch (err) {
      console.error('Error saving config:', err);
      toastError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-32">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="h-7 w-7 text-primary-600" />
            Global Platform Settings
          </h1>
          <p className="text-slate-500 mt-1">Manage global configurations, API keys, and base system currency.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Currency Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                   <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                     <DollarSign className="h-5 w-5 text-emerald-600" />
                   </div>
                   Currency Management
                 </h3>
                 <p className="text-sm text-slate-500 mt-2">Define the default currency for platform oversight and new clinics.</p>
              </div>
              
              <div className="p-8 space-y-8 flex-1">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Base System Currency</label>
                  <select
                    value={config.baseCurrency}
                    onChange={(e) => setConfig({ ...config, baseCurrency: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                  >
                    <option value="USD">USD - United States Dollar</option>
                    <option value="MVR">MVR - Maldivian Rufiyaa</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="GHS">GHS - Ghanaian Cedi</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="TZS">TZS - Tanzanian Shilling</option>
                  </select>
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-blue-700 font-medium">
                      This dictates the primary currency for superadmin subscription tracking and revenue reports. 
                      Existing clinic-specific currencies will remain unchanged.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                   <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                     <BrainCircuit className="h-5 w-5 text-indigo-600" />
                   </div>
                   AI Generative Engine
                 </h3>
                 <p className="text-sm text-slate-500 mt-2">Configure Google Gemini 1.5 Flash for unstructured clinical dictation mapping.</p>
              </div>
              
              <div className="p-8 space-y-8 flex-1">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    Google Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={config.geminiApiKey}
                      onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                      className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-700"
                      placeholder="AIzaSyA..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white transition-all"
                    >
                      {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex gap-3">
                    <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-amber-700 font-medium">
                      Changes take effect immediately across all clinical modules. Ensure your quota is managed in Google AI Studio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="fixed bottom-0 left-72 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-6 z-30 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Platform Config
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
