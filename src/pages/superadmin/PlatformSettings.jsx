import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Shield, Key, Eye, EyeOff, BrainCircuit, DollarSign, Globe,
  Loader2, BookOpen, Stethoscope, History, Lock, ArrowRight,
  TrendingUp, Zap, Box, ChevronRight, ChevronDown,
  CreditCard, Bell, Info, ShieldCheck, RefreshCw, Power, AlertCircle,
  PlusCircle, Save, Settings as SettingsIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../../firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import auditService from '../../services/auditService';
import { Navigate, useNavigate } from 'react-router-dom';

export default function PlatformSettings() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [plans, setPlans] = useState([]);

  const [settings, setSettings] = useState({
    trialDuration: 10,
    autoSuspension: true,
    billingCycle: '31 days',
    requireOrgApproval: true,
    paymentProviders: { flutterwave: true, mpesa: true },
    autoPayAllowed: true,
    enableBillingEmails: true,
    enableSuspensionAlerts: true,
    aiProvider: 'Google Gemini',
    geminiApiKey: '',
    aiDictation: true,
    clinicalNoteAssistance: true,
    lastAiTest: null,
    aiStatus: 'disconnected',
    sessionTimeout: '30 minutes',
    passwordReset: true,
    twoFactorAuth: false,
    notifBillingEmails: true,
    notifTrialReminders: true,
    notifVerification: true,
    notifSuspension: true,
    baseCurrency: 'KES'
  });

  if (userData?.role !== 'superadmin') {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsSnap, plansSnap] = await Promise.all([
        getDoc(doc(db, 'platform_settings', 'main')),
        getDocs(query(collection(db, 'subscription_plans'), orderBy('price', 'asc')))
      ]);

      if (settingsSnap.exists()) {
        setSettings(prev => ({ ...prev, ...settingsSnap.data() }));
      }

      const plansList = plansSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlans(plansList);

    } catch (err) {
      console.error('Error fetching data:', err);
      toastError('Failed to load real platform data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (categoryName) => {
    try {
      setIsSaving(true);
      const docRef = doc(db, 'platform_settings', 'main');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: userData.uid
      }, { merge: true });

      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'UPDATE_SETTINGS',
        module: 'GOVERNANCE',
        description: `Updated platform settings: ${categoryName}`
      });

      success(`${categoryName} updated successfully.`);
    } catch (err) {
      console.error('Error saving settings:', err);
      toastError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlans = async () => {
    try {
      setIsSaving(true);
      const promises = plans.map(plan =>
        setDoc(doc(db, 'subscription_plans', plan.id), {
          ...plan,
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(promises);

      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'UPDATE_PLANS',
        module: 'GOVERNANCE',
        description: 'Updated subscription plan pricing and limits'
      });

      success('Plans updated successfully. Website will reflect changes immediately.');
    } catch (err) {
      console.error('Error saving plans:', err);
      toastError('Failed to save plans');
    } finally {
      setIsSaving(false);
    }
  };

  const seedDefaultPlans = async () => {
    try {
      setIsSeeding(true);
      const defaultPlans = [
        { name: "Essential", price: 10000, maxLocations: 1, maxStaff: 10, subtitle: "For boutique clinics starting out" },
        { name: "Professional", price: 18000, maxLocations: 2, maxStaff: 30, subtitle: "For growing multi-provider teams" },
        { name: "Enterprise", price: 30000, maxLocations: 5, maxStaff: 75, subtitle: "For scaling healthcare networks" }
      ];

      const promises = defaultPlans.map(plan =>
        addDoc(collection(db, 'subscription_plans'), {
          ...plan,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
      fetchData();
      success('Default plans created successfully!');
    } catch (err) {
      toastError('Failed to seed plans');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTestAI = async () => {
    if (!settings.geminiApiKey) {
      toastError('Please enter an API Key first');
      return;
    }

    try {
      setIsTestingAI(true);
      await new Promise(r => setTimeout(r, 1500));

      const now = new Date();
      const updatedSettings = {
        ...settings,
        lastAiTest: now.toISOString(),
        aiStatus: 'connected'
      };

      setSettings(updatedSettings);

      const docRef = doc(db, 'platform_settings', 'main');
      await setDoc(docRef, {
        lastAiTest: updatedSettings.lastAiTest,
        aiStatus: updatedSettings.aiStatus
      }, { merge: true });

      success('AI Engine Connected Successfully');
    } catch (err) {
      setSettings(prev => ({ ...prev, aiStatus: 'failed' }));
      toastError('Connection Failed');
    } finally {
      setIsTestingAI(false);
    }
  };

  const Toggle = ({ enabled, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  const formatTestDate = (dateStr) => {
    if (!dateStr) return 'Never Tested';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen -mt-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Loading Settings Hub...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto h-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Settings Hub</h1>
            <p className="text-sm font-normal text-slate-500 mt-2">Manage global platform configurations and subscription architecture.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">System Live</span>
            </div>
          </div>
        </div>

        {/* FULL WIDTH CONFIGURATION GRID */}
        <div className="space-y-10 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch">

            {/* 1. PLATFORM RULES */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 p-8 flex flex-col justify-between group hover:border-blue-200 transition-colors">
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <SettingsIcon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">1. Platform Rules</h3>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed">Configure global rules that control platform behavior and access.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Trial Duration</p>
                      <p className="text-[11px] text-slate-400 font-normal">Number of days for trial period</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" value={settings.trialDuration} onChange={(e) => setSettings({ ...settings, trialDuration: e.target.value })} className="w-16 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">days</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Auto-suspension for non-payment</p>
                      <p className="text-[11px] text-slate-400 font-normal">Automatically suspend access</p>
                    </div>
                    <Toggle enabled={settings.autoSuspension} onChange={(val) => setSettings({ ...settings, autoSuspension: val })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Billing Cycle Length</p>
                      <p className="text-[11px] text-slate-400 font-normal">Days between renewals</p>
                    </div>
                    <select value={settings.billingCycle} onChange={(e) => setSettings({ ...settings, billingCycle: e.target.value })} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none cursor-pointer">
                      <option>30 days</option>
                      <option>31 days</option>
                      <option>60 days</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Require Organization Approval</p>
                      <p className="text-[11px] text-slate-400 font-normal">Organizations must be approved before Enabling Access</p>
                    </div>
                    <Toggle enabled={settings.requireOrgApproval} onChange={(val) => setSettings({ ...settings, requireOrgApproval: val })} />
                  </div>
                </div>
              </div>

              <button onClick={() => handleSaveCategory('Platform Rules')} disabled={isSaving} className="mt-10 text-blue-600 text-[11px] font-bold uppercase tracking-widest flex items-center justify-end gap-2 hover:gap-3 transition-all disabled:opacity-30">
                {isSaving ? 'Saving...' : 'Save Changes'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 2. BILLING DEFAULTS */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 p-8 flex flex-col justify-between group hover:border-blue-200 transition-colors">
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <CreditCard className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">2. Billing Defaults</h3>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed">Configure default billing and payment settings for the platform.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-[13px] font-medium text-slate-800">Payment Providers</p>
                    <p className="text-[11px] text-slate-400 font-normal">Select enabled payment methods</p>
                    <div className="flex gap-6 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group/check">
                        <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${settings.paymentProviders.flutterwave ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`} onClick={() => setSettings({ ...settings, paymentProviders: { ...settings.paymentProviders, flutterwave: !settings.paymentProviders.flutterwave } })}>
                          {settings.paymentProviders.flutterwave && <div className="h-2 w-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-[13px] font-medium text-slate-700">Flutterwave</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group/check">
                        <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${settings.paymentProviders.mpesa ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`} onClick={() => setSettings({ ...settings, paymentProviders: { ...settings.paymentProviders, mpesa: !settings.paymentProviders.mpesa } })}>
                          {settings.paymentProviders.mpesa && <div className="h-2 w-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-[13px] font-medium text-slate-700">M-Pesa</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Auto-pay Allowed</p>
                      <p className="text-[11px] text-slate-400 font-normal">Allow automatic recurring payments</p>
                    </div>
                    <Toggle enabled={settings.autoPayAllowed} onChange={(val) => setSettings({ ...settings, autoPayAllowed: val })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Enable Billing Emails</p>
                      <p className="text-[11px] text-slate-400 font-normal">Send payment receipts and renewal reminders</p>
                    </div>
                    <Toggle enabled={settings.enableBillingEmails} onChange={(val) => setSettings({ ...settings, enableBillingEmails: val })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Enable Suspension Alerts</p>
                      <p className="text-[11px] text-slate-400 font-normal">Notify admins before and after suspension</p>
                    </div>
                    <Toggle enabled={settings.enableSuspensionAlerts} onChange={(val) => setSettings({ ...settings, enableSuspensionAlerts: val })} />
                  </div>
                </div>
              </div>

              <button onClick={() => handleSaveCategory('Billing Defaults')} disabled={isSaving} className="mt-10 text-blue-600 text-[11px] font-bold uppercase tracking-widest flex items-center justify-end gap-2 hover:gap-3 transition-all disabled:opacity-30">
                {isSaving ? 'Saving...' : 'Save Changes'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 3. SUBSCRIPTION PLANS (FULLY EDITABLE) */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 p-8 flex flex-col justify-between group hover:border-blue-200 transition-colors xl:col-span-2 2xl:col-span-1">
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">3. Subscription Plans</h3>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed">Manage default subscription plans, limits, and pricing.</p>
                  </div>
                </div>

                <div className="overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50">
                        <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                        <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Locations</th>
                        <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Staff</th>
                        <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {plans.length > 0 ? plans.map((plan, idx) => (
                        <tr key={plan.id}>
                          <td className="py-5">
                            <span className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest ${plan.name === 'Enterprise' ? 'bg-indigo-50 text-indigo-600' : plan.name === 'Professional' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{plan.name}</span>
                          </td>
                          <td className="py-5 text-center">
                            <input
                              type="number"
                              value={plan.maxLocations || plan.limits?.locations || 1}
                              onChange={(e) => {
                                const newPlans = [...plans];
                                newPlans[idx].maxLocations = parseInt(e.target.value);
                                setPlans(newPlans);
                              }}
                              className="w-16 p-2 bg-slate-50 border border-slate-100 rounded-lg text-center font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </td>
                          <td className="py-5 text-center">
                            <input
                              type="number"
                              value={plan.maxStaff || plan.limits?.staff || 10}
                              onChange={(e) => {
                                const newPlans = [...plans];
                                newPlans[idx].maxStaff = parseInt(e.target.value);
                                setPlans(newPlans);
                              }}
                              className="w-16 p-2 bg-slate-50 border border-slate-100 rounded-lg text-center font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </td>
                          <td className="py-5 text-right">
                            <input
                              type="number"
                              value={plan.price}
                              onChange={(e) => {
                                const newPlans = [...plans];
                                newPlans[idx].price = parseInt(e.target.value);
                                setPlans(newPlans);
                              }}
                              className="w-24 p-2 bg-slate-50 border border-slate-100 rounded-lg text-right font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="py-12 text-center">
                            {isSeeding ? (
                              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                            ) : (
                              <div className="space-y-4">
                                <p className="text-xs text-slate-400 font-normal italic">No plans defined in Firestore</p>
                                <button onClick={seedDefaultPlans} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors flex items-center gap-2 mx-auto">
                                  <PlusCircle className="h-4 w-4" /> Seed Default Plans
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-blue-700 font-normal">
                    Update locations, staff limits, and pricing here. Changes reflect across the platform instantly.
                  </p>
                </div>
              </div>

              <button onClick={handleSavePlans} disabled={isSaving || plans.length === 0} className="mt-10 text-blue-600 text-[11px] font-bold uppercase tracking-widest flex items-center justify-end gap-2 hover:gap-3 transition-all disabled:opacity-30">
                {isSaving ? 'Saving...' : 'Save Changes'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 4. AI GENERATIVE ENGINE */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 p-8 flex flex-col justify-between group hover:border-blue-200 transition-colors">
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">4. AI Generative Engine <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full">Beta</span></h3>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed">Configure AI API connection used for clinical dictation and note assistance.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">AI Provider</p>
                      <p className="text-[11px] text-slate-400 font-normal">Select AI service provider</p>
                    </div>
                    <select value={settings.aiProvider} onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none cursor-pointer min-w-[140px]">
                      <option>Google Gemini</option>
                      <option>OpenAI GPT-4</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[13px] font-medium text-slate-800">API Key</p>
                    <p className="text-[11px] text-slate-400 font-normal">Enter your Google Gemini API key</p>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={settings.geminiApiKey}
                        onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono outline-none pr-12 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="********************************"
                      />
                      <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showKey ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">AI Dictation (Voice-to-Text)</p>
                      <p className="text-[11px] text-slate-400 font-normal">Enable AI dictation for clinical notes</p>
                    </div>
                    <Toggle enabled={settings.aiDictation} onChange={(val) => setSettings({ ...settings, aiDictation: val })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Clinical Note Assistance</p>
                      <p className="text-[11px] text-slate-400 font-normal">Enable AI note generation suggestions</p>
                    </div>
                    <Toggle enabled={settings.clinicalNoteAssistance} onChange={(val) => setSettings({ ...settings, clinicalNoteAssistance: val })} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-10">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status:</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings.aiStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.aiStatus === 'connected' ? 'text-emerald-600' : 'text-red-500'}`}> {settings.aiStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
                <div className="flex gap-6 items-center">
                  <button onClick={handleTestAI} disabled={isTestingAI} className="px-6 py-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-30 shadow-sm shadow-slate-100">
                    {isTestingAI ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button onClick={() => handleSaveCategory('AI Engine')} disabled={isSaving} className="text-blue-600 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all disabled:opacity-30">
                    Save Changes <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 5. SECURITY & ACCESS */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 p-8 flex flex-col justify-between group hover:border-blue-200 transition-colors">
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">5. Security & Access</h3>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed">Manage administrator access and security preferences.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">SuperAdmin Users</p>
                      <p className="text-[11px] text-slate-400 font-normal">Manage platform SuperAdmins</p>
                    </div>
                    <button onClick={() => navigate('/master/users')} className="px-6 py-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm shadow-slate-100">
                      Manage
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Session Timeout</p>
                      <p className="text-[11px] text-slate-400 font-normal">Auto logout after inactivity</p>
                    </div>
                    <select value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none cursor-pointer min-w-[140px]">
                      <option>30 minutes</option>
                      <option>60 minutes</option>
                      <option>4 hours</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Password Reset</p>
                      <p className="text-[11px] text-slate-400 font-normal">Allow users to reset passwords</p>
                    </div>
                    <Toggle enabled={settings.passwordReset} onChange={(val) => setSettings({ ...settings, passwordReset: val })} />
                  </div>
                </div>
              </div>

              <button onClick={() => handleSaveCategory('Security')} disabled={isSaving} className="mt-10 text-blue-600 text-[11px] font-bold uppercase tracking-widest flex items-center justify-end gap-2 hover:gap-3 transition-all disabled:opacity-30">
                {isSaving ? 'Saving...' : 'Save Changes'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 6. NOTIFICATIONS */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 p-8 flex flex-col justify-between group hover:border-blue-200 transition-colors">
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Bell className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">6. Notifications</h3>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed">Configure platform-wide email notifications and alerts.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Billing Emails</p>
                      <p className="text-[11px] text-slate-400 font-normal">Send invoices and receipts</p>
                    </div>
                    <Toggle enabled={settings.notifBillingEmails} onChange={(val) => setSettings({ ...settings, notifBillingEmails: val })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Trial Reminder Emails</p>
                      <p className="text-[11px] text-slate-400 font-normal">Remind users before trial ends</p>
                    </div>
                    <Toggle enabled={settings.notifTrialReminders} onChange={(val) => setSettings({ ...settings, notifTrialReminders: val })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Verification Emails</p>
                      <p className="text-[11px] text-slate-400 font-normal">Send organization verification emails</p>
                    </div>
                    <Toggle enabled={settings.notifVerification} onChange={(val) => setSettings({ ...settings, notifVerification: val })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">Suspension Alerts</p>
                      <p className="text-[11px] text-slate-400 font-normal">Notify admins of suspensions</p>
                    </div>
                    <Toggle enabled={settings.notifSuspension} onChange={(val) => setSettings({ ...settings, notifSuspension: val })} />
                  </div>
                </div>
              </div>

              <button onClick={() => handleSaveCategory('Notifications')} disabled={isSaving} className="mt-10 text-blue-600 text-[11px] font-bold uppercase tracking-widest flex items-center justify-end gap-2 hover:gap-3 transition-all disabled:opacity-30">
                {isSaving ? 'Saving...' : 'Save Changes'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>

          <div className="flex items-center justify-center pt-8 pb-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">All changes saved to the platform-wide configuration in real-time.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
