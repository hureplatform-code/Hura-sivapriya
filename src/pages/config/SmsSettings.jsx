import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  MessageSquare, Wallet, Globe, ShoppingCart, RefreshCcw, FileText, CheckCircle2,
  AlertTriangle, CreditCard, Bell, CalendarClock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import smsSettingsService from '../../services/smsSettingsService';
import { useCurrency } from '../../contexts/CurrencyContext';

// We hardcode KSh pricing per requirements, but use current currency for display
// (If clinic currency is different, conversions would apply in production)
const SMS_BUNDLES = [
  { id: 'small', sms: 1000, price: 500 },
  { id: 'medium', sms: 2000, price: 1000 },
  { id: 'large', sms: 5000, price: 2200, popular: true }
];

export default function SmsSettings() {
  const { userData } = useAuth();
  const facilityId = userData?.facilityId || null;
  const { currency } = useCurrency();

  const [wallet, setWallet] = useState({ balance: 0, language: 'English' });
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null); // id of bundle being bought
  const [savingLang, setSavingLang] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchWallet();
  }, [facilityId]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const data = await smsSettingsService.getWallet(facilityId);
      if (data) {
        setWallet(data);
      }
    } catch (err) {
      console.error('Error loading SMS wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleBuyBundle = async (bundle) => {
    try {
      setBuying(bundle.id);
      await smsSettingsService.buyBundle(facilityId, bundle.sms);
      
      // Update local balance
      setWallet(prev => ({ ...prev, balance: prev.balance + bundle.sms }));
      showNotif('success', `Successfully added ${bundle.sms} SMS credits to your wallet!`);
    } catch (err) {
      showNotif('error', 'Payment failed. Could not add credits.');
    } finally {
      setBuying(null);
    }
  };

  const handleLanguageChange = async (lang) => {
    try {
      setSavingLang(true);
      await smsSettingsService.updateLanguage(facilityId, lang);
      setWallet(prev => ({ ...prev, language: lang }));
      showNotif('success', `SMS language updated to ${lang}`);
    } catch (err) {
      showNotif('error', 'Failed to update SMS language.');
    } finally {
      setSavingLang(false);
    }
  };

  const renderPreview = () => {
    const cl = 'HURE Clinic';
    const date = 'Tommorrow';
    const time = '10:00 AM';
    
    const eng = `${cl}: This is a reminder that your appointment is scheduled on ${date} at ${time}. Reply YES to confirm or NO to reschedule.`;
    const swa = `${cl}: Hii ni ukumbusho kwamba miadi yako imepangwa tarehe ${date} saa ${time}. Jibu YES kuthibitisha au NO kubadilisha muda.`;

    let msg = `HURECARE\n${eng}`;
    if (wallet.language === 'Swahili') msg = `HURECARE\n${swa}`;
    if (wallet.language === 'Both') msg = `HURECARE\n${eng}\n\n${cl}: Hii ni ukumbusho kwamba miadi yako imepangwa tarehe ${date} saa ${time}. Jibu YES kuthibitisha au NO kubadilisha muda.`;

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
            {msg}
        </div>
    );
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
      <div className="space-y-8 pb-12 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-primary-600" />
              SMS Wallet & Preferences
            </h1>
            <p className="text-slate-500 mt-1">Manage patient notification credits, top-ups, and auto-reminders.</p>
          </div>
          
          <button 
             onClick={() => window.location.href='/config/sms-logs'}
             className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
          >
             <FileText className="h-5 w-5" /> SMS Logs
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* WALLET SECTION */}
            <div className="space-y-6">
                <div className="bg-primary-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-primary-900/20">
                    <div className="relative z-10 flex flex-col items-start h-full">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
                           <Wallet className="h-3 w-3" /> AT SMS Wallet
                        </span>
                        
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-5xl font-bold tracking-tighter">{wallet.balance.toLocaleString()}</span>
                            <span className="text-primary-200 text-sm font-medium mb-1">credits</span>
                        </div>
                        <p className="text-primary-200 text-sm font-medium leading-relaxed max-w-sm mb-8">
                            This balance is deducted automatically when sending appointment reminders or status updates to patients via Africa's Talking.
                        </p>

                        {(wallet.balance <= 0) && (
                            <div className="w-full bg-red-500/20 text-red-100 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 mt-auto">
                                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                                <div className="text-xs font-medium">
                                    <p className="font-bold text-red-300">Wallet Empty</p>
                                    <p>SMS sending is currently disabled. Please top up your wallet below to resume patient reminders.</p>
                                </div>
                            </div>
                        )}
                        {(wallet.balance > 0 && wallet.balance < 50) && (
                            <div className="w-full bg-amber-500/20 text-amber-100 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3 mt-auto">
                                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                                <div className="text-xs font-medium">
                                    <p className="font-bold text-amber-300">Low Balance</p>
                                    <p>Your SMS wallet is running low. Please top up soon to avoid missing outbound reminders.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary-800 to-transparent pointer-events-none" />
                    <MessageSquare className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5 rotate-12" />
                </div>

                {/* BUNDLES */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <ShoppingCart className="h-5 w-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-900">Purchase SMS Bundles</h3>
                    </div>

                    <div className="space-y-4">
                        {SMS_BUNDLES.map(bundle => (
                            <div 
                                key={bundle.id}
                                className={`
                                    relative p-5 rounded-2xl border-2 transition-all flex items-center justify-between
                                    ${bundle.popular ? 'border-primary-500 bg-primary-50/30 shadow-md shadow-primary-50' : 'border-slate-100 hover:border-slate-300'}
                                `}
                            >
                                {bundle.popular && (
                                    <span className="absolute -top-3 left-6 px-3 py-0.5 bg-primary-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm">Max Value</span>
                                )}
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">{bundle.sms.toLocaleString()} <span className="text-sm font-medium text-slate-500">SMS</span></h4>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-lg font-semibold text-slate-900">KES {bundle.price}</p>
                                    <button 
                                        onClick={() => handleBuyBundle(bundle)}
                                        disabled={buying === bundle.id}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                                            ${buying === bundle.id ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'}
                                        `}
                                    >
                                        {buying === bundle.id ? 'Processing...' : 'Buy Now'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PREFERENCES SECTION */}
            <div className="space-y-6">
                
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Globe className="h-5 w-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-900">Language Preferences</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {['English', 'Swahili', 'Both'].map((lang) => (
                            <button
                                key={lang}
                                disabled={savingLang}
                                onClick={() => handleLanguageChange(lang)}
                                className={`
                                    px-4 py-3 rounded-2xl border transition-all text-sm font-medium
                                    ${wallet.language === lang 
                                        ? 'bg-primary-50 text-primary-700 border-primary-200 ring-2 ring-primary-500/20' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }
                                    ${savingLang ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {lang === 'Both' ? 'English + Swahili' : `${lang} Only`}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Template Preview</p>
                        {renderPreview()}
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <CalendarClock className="h-5 w-5 text-slate-400" />
                        <h3 className="text-md font-semibold text-slate-900">Automated Schedule</h3>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-slate-500 shadow-sm">1</div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">2 Days Before (8:00 AM)</p>
                                <p className="text-xs text-slate-500 mt-1">Sends out initial confirmation reminders to all booked patients.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-slate-500 shadow-sm">2</div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">1 Day Before (8:00 AM)</p>
                                <p className="text-xs text-slate-500 mt-1">Sends a final reminder only to attendees who haven't confirmed yet.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-slate-500 shadow-sm">3</div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">1 Day Before (1:00 PM)</p>
                                <p className="text-xs text-slate-500 mt-1">Patients who still haven't replied YES are flagged as <span className="font-mono text-red-500 bg-red-50 px-1 py-0.5 rounded">not_confirmed</span> for manual followup.</p>
                            </div>
                        </li>
                    </ul>
                </div>

            </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
