import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  MessageSquare, Wallet, Globe, ShoppingCart, RefreshCcw, FileText, CheckCircle2,
  AlertTriangle, CreditCard, Bell, CalendarClock, Clock, Ban, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import smsSettingsService from '../../services/smsSettingsService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../contexts/ToastContext';
import facilityService from '../../services/facilityService';

// We hardcode KSh pricing per requirements, but use current currency for display
const SMS_BUNDLES = [
  { id: 'small', sms: 1000, price: 500 },
  { id: 'medium', sms: 2000, price: 1000 },
  { id: 'large', sms: 5000, price: 2200, popular: true }
];

export default function SmsSettings() {
  const { userData } = useAuth();
  const { currency } = useCurrency();

  const [selectedFacilityId, setSelectedFacilityId] = useState(userData?.facilityId || null);
  const [facilities, setFacilities] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, language: 'English' });
  const [providerBalance, setProviderBalance] = useState(null);
  const [providerError, setProviderError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null); // id of bundle being bought
  const [testPhone, setTestPhone] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [savingLang, setSavingLang] = useState(false);
  const [topupRequests, setTopupRequests] = useState([]);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const { success, error: toastError } = useToast();

  const isSuperadmin = userData?.role === 'superadmin';

  useEffect(() => {
    if (isSuperadmin) {
      fetchFacilities();
      fetchProviderBalance();
      fetchTopupRequests();
    }
  }, []);

  const fetchProviderBalance = async () => {
    try {
      setProviderError(null);
      const bal = await smsSettingsService.getAtBalance();
      if (bal) {
        setProviderBalance(bal);
      } else {
        setProviderError("Functions not deployed or Blaze plan required.");
      }
    } catch (err) {
      setProviderError("Failed to fetch balance.");
    }
  };

  const fetchTopupRequests = async () => {
    try {
      const data = await smsSettingsService.getTopupRequests();
      setTopupRequests(data || []);
    } catch (err) {
      console.error("Error fetching topup requests:", err);
    }
  };

  useEffect(() => {
    if (selectedFacilityId) {
      fetchWallet();
    } else {
      setLoading(false);
    }
  }, [selectedFacilityId]);

  const fetchFacilities = async () => {
    try {
      const data = await facilityService.getAllFacilities();
      setFacilities(data || []);
      
      if (data && data.length > 0) {
        const isValid = data.some(f => f.id === selectedFacilityId);
        if (!selectedFacilityId || !isValid) {
            setSelectedFacilityId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const data = await smsSettingsService.getWallet(selectedFacilityId);
      if (data) {
        setWallet(data);
      } else {
        setWallet({ balance: 0, language: 'English' });
      }
    } catch (err) {
      console.error('Error loading SMS wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyBundle = async (bundle) => {
    if (!selectedFacilityId) {
        toastError("Please select a facility first.");
        return;
    }

    // Direct topup for Superadmins, Request for Clinics
    if (isSuperadmin) {
        if (providerBalance && providerBalance.includes('-')) {
            const proceed = window.confirm("CRITICAL: Master balance is NEGATIVE. Clinic will get credits but SMS won't send. Proceed?");
            if (!proceed) return;
        }

        try {
          setBuying(bundle.id);
          await smsSettingsService.buyBundle(selectedFacilityId, bundle.sms);
          setWallet(prev => ({ ...prev, balance: prev.balance + bundle.sms }));
          success(`Successfully assigned ${bundle.sms} SMS credits.`);
          fetchProviderBalance();
        } catch (err) {
          toastError('Failed to add credits.');
        } finally {
          setBuying(null);
        }
    } else {
        try {
            setBuying(bundle.id);
            await smsSettingsService.requestTopup(selectedFacilityId, bundle);
            success("Purchase request sent to admin! They will contact you for payment.");
        } catch (err) {
            toastError("Failed to send request.");
        } finally {
          setBuying(null);
        }
    }
  };

  const handleApproveRequest = async (req) => {
    try {
        setProcessingRequestId(req.id);
        await smsSettingsService.approveTopupRequest(req.id);
        success(`Request approved! ${req.sms} SMS added to ${req.facilityName}`);
        fetchTopupRequests();
        if (req.facilityId === selectedFacilityId) fetchWallet();
        fetchProviderBalance();
    } catch (err) {
        toastError("Approval failed.");
    } finally {
        setProcessingRequestId(null);
    }
  };

  const handleLanguageChange = async (lang) => {
    if (!selectedFacilityId) {
        toastError("Please select a facility first.");
        return;
    }
    try {
      setSavingLang(true);
      await smsSettingsService.updateLanguage(selectedFacilityId, lang);
      setWallet(prev => ({ ...prev, language: lang }));
      success(`SMS language updated to ${lang}`);
    } catch (err) {
      console.error("Lang Update Error:", err);
      toastError('Failed to update SMS language.');
    } finally {
      setSavingLang(false);
    }
  };

  const handleSendTest = async () => {
    if (!selectedFacilityId) return toastError("Select a facility first");
    if (!testPhone) return toastError("Enter a phone number");
    
    try {
      setIsTesting(true);
      const result = await smsSettingsService.sendTestSms(selectedFacilityId, testPhone);
      if (result.success) {
        success("Test SMS sent successfully!");
        fetchWallet();
      } else {
        toastError(result.error || "Failed to send test SMS.");
      }
    } catch (err) {
      toastError("Error sending test SMS.");
    } finally {
      setIsTesting(false);
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
    if (wallet.language === 'Both') msg = `HURECARE\n${eng}\n\n${swa}`;

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
          
          <div className="flex items-center gap-3">
            {isSuperadmin && facilities.length > 0 && (
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none min-w-[200px]"
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
            <button 
              onClick={() => window.location.href='/config/sms-logs'}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <FileText className="h-5 w-5" /> SMS Logs
            </button>
          </div>
        </div>

        {isSuperadmin && providerBalance && providerBalance.includes('-') && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] flex items-center gap-6 shadow-lg shadow-red-100"
            >
                <div className="h-16 w-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle className="h-8 w-8 animate-pulse" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900">Africa's Talking Account Depleted</h3>
                    <p className="text-red-700 font-medium text-sm mt-1">
                        Your master balance is <span className="underline font-bold">{providerBalance}</span>. 
                        No SMS can be sent cross-platform until topped up.
                    </p>
                </div>
                <button 
                    onClick={() => window.open('https://dashboard.africastalking.com', '_blank')}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                >
                    Top Up AT Dashboard
                </button>
            </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* WALLET SECTION */}
            <div className="space-y-6">
                <div className="bg-primary-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-primary-900/20">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-8">
                            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/60 border border-white/10 flex items-center gap-2">
                                <CreditCard className="h-3 w-3" /> Clinic Wallet Balance
                            </div>
                            {isSuperadmin && (
                                <div className={`px-3 py-1 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-2 transition-all ${providerError ? 'bg-red-500/20 text-red-300 border-red-500/20' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20'}`}>
                                    <Globe className="h-3 w-3" /> 
                                    Provider Master: {providerError ? 'N/A' : (providerBalance || '...')}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-bold text-white tabular-nums">
                                {wallet.balance.toLocaleString()}
                            </span>
                            <span className="text-xl font-medium text-white/50">credits</span>
                        </div>
                        
                        <p className="text-white/60 mt-4 text-sm leading-relaxed max-w-xs">
                          Credits are used for automated appointment reminders and billing updates to patients.
                        </p>

                        {(wallet.balance <= 0) && (
                            <div className="w-full bg-red-500/20 text-red-100 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 mt-auto">
                                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                                <div className="text-xs font-medium">
                                    <p className="font-bold text-red-300 text-xs">Wallet Empty</p>
                                    <p>Patient reminders are currently paused. Top up to resume service.</p>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => { fetchWallet(); if(isSuperadmin) fetchProviderBalance(); }}
                            className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary-300 hover:text-white transition-colors"
                        >
                            <RefreshCcw className="h-3 w-3" /> Synchronize Balance
                        </button>
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
                                    <span className="absolute -top-3 left-6 px-3 py-0.5 bg-primary-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm">Best Selection</span>
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
                                        {buying === bundle.id ? 'Wait...' : (isSuperadmin ? 'Add Direct' : 'Purchase Request')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!isSuperadmin && (
                        <p className="mt-4 text-[10px] text-slate-400 font-medium text-center uppercase tracking-widest">
                          Admin will receive a notification to verify payment before adding credits.
                        </p>
                    )}
                </div>
            </div>

            {/* PREFERENCES SECTION */}
            <div className="space-y-6">
                
                {/* ADMIN REQUESTS SECTION */}
                {isSuperadmin && topupRequests.filter(r => r.status === 'pending').length > 0 && (
                   <div className="bg-white border-2 border-primary-100 rounded-[2.5rem] p-8 shadow-xl shadow-primary-50">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-primary-600 animate-bounce" />
                            <h3 className="text-lg font-semibold text-slate-900">Pending Top-up Requests</h3>
                         </div>
                         <span className="px-3 py-1 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
                            {topupRequests.filter(r => r.status === 'pending').length} New
                         </span>
                      </div>
                      
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                         {topupRequests.filter(r => r.status === 'pending').map(req => (
                            <div key={req.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary-200 transition-all">
                               <div className="flex justify-between items-start mb-3">
                                  <div>
                                     <p className="font-bold text-slate-900">{req.facilityName}</p>
                                     <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                                        Requested {new Date(req.createdAt?.toDate()).toLocaleString()}
                                     </p>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-lg font-bold text-primary-600">{req.sms.toLocaleString()} Credits</p>
                                     <p className="text-xs font-semibold text-slate-500">KES {req.price}</p>
                                  </div>
                               </div>
                               <button 
                                  onClick={() => handleApproveRequest(req)}
                                  disabled={processingRequestId === req.id}
                                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                               >
                                  {processingRequestId === req.id ? 'Processing Approval...' : 'Confirm Payment & Approve'} <Check className="h-4 w-4" />
                               </button>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

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
                                {lang === 'Both' ? 'English + Swahili' : lang}
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
                        <h3 className="text-md font-semibold text-slate-900">Notification Roadmap</h3>
                    </div>
                    <ul className="space-y-4 mb-8">
                        {[
                          { step: 1, label: '2 Days Before (8:00 AM)', desc: 'Initial confirmation check for all appointments.' },
                          { step: 2, label: '1 Day Before (8:00 AM)', desc: 'Follow-up reminder for unconfirmed appointments.' },
                          { step: 3, label: '1 Day Before (1:00 PM)', desc: 'Flagging non-responsive patients for clinic staff.' }
                        ].map(item => (
                           <li key={item.step} className="flex gap-4">
                              <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black text-slate-400">{item.step}</div>
                              <div>
                                 <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tighter">{item.label}</p>
                                 <p className="text-[11px] text-slate-500 mt-1 leading-tight">{item.desc}</p>
                              </div>
                           </li>
                        ))}
                    </ul>

                    <div className="border-t border-slate-200 pt-8 mt-4">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 uppercase tracking-tighter">
                            <Bell className="h-4 w-4 text-primary-600" /> Validation Test
                        </h3>
                        <div className="flex flex-col gap-3">
                            <input 
                                type="text"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                placeholder="Phone (e.g. +254...)"
                                className="px-5 py-4 bg-white border-2 border-transparent focus:border-primary-100 rounded-2xl text-sm font-medium outline-none transition-all"
                            />
                            <button
                                onClick={handleSendTest}
                                disabled={isTesting || !testPhone}
                                className="w-full py-4 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-600/10 active:scale-95 disabled:opacity-30 transition-all"
                            >
                                {isTesting ? 'Initiating...' : 'Send Manual Test'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
