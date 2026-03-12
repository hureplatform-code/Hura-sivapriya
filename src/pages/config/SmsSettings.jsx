import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  MessageSquare, Key, Phone, Eye, EyeOff, Save, Trash2,
  CheckCircle2, AlertTriangle, ShieldCheck, TestTube, ToggleLeft, ToggleRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import smsSettingsService from '../../services/smsSettingsService';

export default function SmsSettings() {
  const { userData } = useAuth();
  const facilityId = userData?.facilityId || null;

  const [config, setConfig] = useState({
    enabled: false,
    accountSid: '',
    authToken: '',
    fromNumber: '',
    testPhone: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'success' | 'fail' | null
  const [showToken, setShowToken] = useState(false);
  const [showSid, setShowSid] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, [facilityId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const existing = await smsSettingsService.getConfig(facilityId);
      if (existing) {
        setConfig(prev => ({
          ...prev,
          enabled: existing.enabled ?? false,
          accountSid: existing.accountSid || '',
          authToken: existing.authToken || '',
          fromNumber: existing.fromNumber || '',
        }));
        setSaved(true);
      }
    } catch (err) {
      console.error('Error loading SMS config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!config.accountSid || !config.authToken || !config.fromNumber) {
      showNotif('error', 'Please fill in all three Twilio credentials before saving.');
      return;
    }
    try {
      setSaving(true);
      await smsSettingsService.saveConfig(facilityId, {
        enabled: config.enabled,
        accountSid: config.accountSid.trim(),
        authToken: config.authToken.trim(),
        fromNumber: config.fromNumber.trim(),
      });
      setSaved(true);
      showNotif('success', 'SMS credentials saved successfully. Appointment notifications are now active.');
    } catch (err) {
      showNotif('error', 'Failed to save credentials. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await smsSettingsService.deleteConfig(facilityId);
      setConfig({ enabled: false, accountSid: '', authToken: '', fromNumber: '', testPhone: '' });
      setSaved(false);
      setDeleteConfirm(false);
      showNotif('success', 'SMS credentials removed.');
    } catch (err) {
      showNotif('error', 'Failed to remove credentials.');
    }
  };

  const handleTest = async () => {
    if (!config.testPhone) {
      showNotif('error', 'Enter a phone number to test (include country code, e.g. +9609XXXXXX).');
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const ok = await smsSettingsService.sendTestSms(facilityId, config.testPhone);
      setTestResult(ok ? 'success' : 'fail');
      showNotif(ok ? 'success' : 'error', ok ? 'Test SMS sent! Check your phone.' : 'SMS failed. Verify your credentials and phone number.');
    } catch (err) {
      setTestResult('fail');
      showNotif('error', 'Test SMS failed. Check your Twilio credentials.');
    } finally {
      setTesting(false);
    }
  };

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const toggleEnabled = async () => {
    const newVal = !config.enabled;
    setConfig(prev => ({ ...prev, enabled: newVal }));
    if (saved) {
      await smsSettingsService.saveConfig(facilityId, { ...config, enabled: newVal });
      showNotif('success', `SMS notifications ${newVal ? 'enabled' : 'paused'}.`);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="min-h-screen flex items-center justify-center text-slate-500 italic font-medium">
        Loading SMS configuration...
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-primary-600" />
              SMS Notifications
            </h1>
            <p className="text-slate-500 mt-1">Configure Twilio credentials to send appointment SMS alerts to patients.</p>
          </div>

          {/* Enable / Disable toggle */}
          <button
            onClick={toggleEnabled}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border font-medium transition-all ${
              config.enabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {config.enabled
              ? <><ToggleRight className="h-5 w-5" /> SMS Enabled</>
              : <><ToggleLeft className="h-5 w-5" /> SMS Paused</>
            }
          </button>
        </div>

        {/* Notification bar */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-medium ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {notification.type === 'success'
                ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                : <AlertTriangle className="h-5 w-5 shrink-0" />
              }
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Setup Guide Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
          <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">How to get your Twilio credentials</p>
            <ol className="mt-2 space-y-1 text-xs text-blue-700 font-medium list-decimal ml-4">
              <li>Sign up at <strong>twilio.com</strong> (free trial available)</li>
              <li>Go to <strong>Console → Account Info</strong></li>
              <li>Copy your <strong>Account SID</strong> and <strong>Auth Token</strong></li>
              <li>Go to <strong>Phone Numbers → Buy a number</strong> and copy the <strong>From Number</strong></li>
              <li>Paste all three below and click Save</li>
            </ol>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Twilio API Credentials</span>
            </div>
            {saved && (
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                <ShieldCheck className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>

          <div className="p-10 space-y-6">
            {/* Account SID */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Account SID
              </label>
              <div className="relative">
                <input
                  type={showSid ? 'text' : 'password'}
                  value={config.accountSid}
                  onChange={e => setConfig(p => ({ ...p, accountSid: e.target.value }))}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-slate-50 border border-transparent focus:border-primary-200 rounded-2xl py-4 px-5 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <button type="button" onClick={() => setShowSid(!showSid)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showSid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Auth Token */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Auth Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.authToken}
                  onChange={e => setConfig(p => ({ ...p, authToken: e.target.value }))}
                  placeholder="Your Twilio Auth Token (keep this secret)"
                  className="w-full bg-slate-50 border border-transparent focus:border-primary-200 rounded-2xl py-4 px-5 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <button type="button" onClick={() => setShowToken(!showToken)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* From Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Twilio From Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={config.fromNumber}
                  onChange={e => setConfig(p => ({ ...p, fromNumber: e.target.value }))}
                  placeholder="+1415XXXXXXX (your Twilio phone number)"
                  className="w-full bg-slate-50 border border-transparent focus:border-primary-200 rounded-2xl py-4 px-5 pl-11 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>

            {/* SMS Preview */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">SMS Preview</p>
              <div className="bg-white rounded-xl p-4 border border-slate-100 text-sm text-slate-700 font-medium leading-relaxed">
                "Hi <span className="text-primary-600">[Patient Name]</span>, your appointment is confirmed for{' '}
                <span className="text-primary-600">[Date]</span> at{' '}
                <span className="text-primary-600">[Time]</span> with Dr.{' '}
                <span className="text-primary-600">[Doctor Name]</span>.
                Reply CANCEL to cancel. – <span className="text-primary-600">[Clinic Name]</span>"
              </div>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-medium text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving Credentials...' : 'Save Credentials'}
            </button>
          </div>
        </form>

        {/* Test SMS Section */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <TestTube className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Test Your SMS Setup</span>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Send test SMS to
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={config.testPhone}
                    onChange={e => setConfig(p => ({ ...p, testPhone: e.target.value }))}
                    placeholder="+9609XXXXXXX (include country code)"
                    className="w-full bg-slate-50 border border-transparent focus:border-primary-200 rounded-2xl py-4 px-5 pl-11 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-medium text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                  testResult === 'success'
                    ? 'bg-emerald-500 text-white'
                    : testResult === 'fail'
                    ? 'bg-red-500 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-100'
                }`}
              >
                {testing ? (
                  <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                ) : testResult === 'success' ? (
                  <><CheckCircle2 className="h-4 w-4" /> SMS Sent Successfully!</>
                ) : testResult === 'fail' ? (
                  <><AlertTriangle className="h-4 w-4" /> Test Failed — Check Credentials</>
                ) : (
                  <><TestTube className="h-4 w-4" /> Send Test SMS</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Danger Zone */}
        {saved && (
          <div className="bg-white rounded-[3rem] border border-red-100 shadow-sm overflow-hidden">
            <div className="px-10 py-6 border-b border-red-50 bg-red-50/50 flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-400" />
              <span className="text-sm font-semibold text-red-700">Danger Zone</span>
            </div>
            <div className="p-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Remove SMS Credentials</p>
                <p className="text-xs text-slate-500 mt-1">This will permanently delete your Twilio credentials and disable SMS notifications.</p>
              </div>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-medium rounded-2xl border border-red-100 hover:bg-red-100 transition-all"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
            >
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Remove Credentials?</h3>
              <p className="text-sm text-slate-500 mb-8">
                This will delete your Twilio credentials. SMS notifications will stop immediately.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-100">
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
