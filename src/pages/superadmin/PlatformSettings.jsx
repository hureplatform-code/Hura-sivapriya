import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Settings, Shield, Key, Eye, EyeOff, CheckCircle2, AlertCircle, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PlatformSettings() {
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const [config, setConfig] = useState({
    geminiApiKey: '',
  });

  // Verify Superadmin access
  if (userData?.role !== 'superadmin') {
    return <Navigate to="/" />;
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
        setConfig({
          geminiApiKey: docSnap.data().geminiApiKey || '',
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
            <BrainCircuit className="h-7 w-7 text-primary-600" />
            AI Note Configuration
          </h1>
          <p className="text-slate-500 mt-1">Manage global API keys and AI settings for clinical documentation.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                 <Shield className="h-5 w-5 text-indigo-500" />
                 AI Generative API
               </h3>
               <p className="text-sm text-slate-500 mt-1">Configure Google Gemini 1.5 Flash for unstructured clinical dictation mapping.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={config.geminiApiKey}
                    onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                    className="w-full pl-5 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="AIzaSyA..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  You can get a free API key from Google AI Studio. This key is used globally across all clinics for AI Notes formatting.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-primary-600/30 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                 <>
                   <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                   Saving Settings...
                 </>
              ) : (
                 <>
                   <CheckCircle2 className="h-5 w-5" />
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
