import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import facilityService from '../../services/facilityService';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Zap,
  Download,
  ShieldCheck,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';

// No mock payment history needed for now.
// No mock payment history needed for now.
const paymentHistory = [];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    limits: { staff: 2, locations: 1 },
    features: ['Basic Patient Records', 'Appointment Scheduling', 'Standard Support'],
    limitLabel: 'Up to 2 Staff',
    recommended: false
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$49',
    period: '/mo',
    limits: { staff: 5, locations: 2 },
    features: ['Up to 5 Staff', '2 Locations', 'Advanced Reporting', 'Priority Email Support'],
    limitLabel: 'Up to 5 Staff',
    recommended: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/mo',
    limits: { staff: 20, locations: 5 },
    features: ['Up to 20 Staff', '5 Locations', 'Financial Modules', 'Dedicated Account Manager'],
    limitLabel: 'Up to 20 Staff',
    recommended: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    limits: { staff: 999, locations: 999 },
    features: ['Unlimited Staff', 'Unlimited Locations', 'Custom API Integration', '24/7 Phone Support'],
    limitLabel: 'Unlimited',
    recommended: false
  }
];

export default function Accounts() {
  const { userData } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (userData?.facilityId) {
      facilityService.getProfile(userData.facilityId).then(profile => {
        setSubscription(profile?.subscription);
        setLoading(false);
      });
    }
  }, [userData]);

  const handleUpgrade = async (planName = 'Enterprise / Custom') => {
    setLoading(true);
    try {
      await facilityService.requestUpgrade(userData.facilityId, {
        currentPlan: subscription?.planName || 'Free',
        requestedPlan: planName,
        message: `Clinic owner requested to upgrade to ${planName} via dashboard.`
      });
      setNotification({ type: 'success', message: `Request for ${planName} sent! We will contact you shortly.` });
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error(error);
      setNotification({ type: 'error', message: 'Failed to send request. Please try again.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout><div>Loading subscription details...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Subscription</h1>
          <p className="text-slate-500 mt-1">Manage your facility plan and limits.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{subscription?.planName || 'Free Plan'}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Status: <span className="uppercase font-bold text-emerald-600">{subscription?.status || 'Active'}</span> • Expires: {subscription?.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">{subscription?.planId === 'free' ? 'Free' : 'Custom'}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Current Plan</p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Limits</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Max Staff: {subscription?.maxStaff || 5}
                    </li>
                    <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Max Locations: {subscription?.maxLocations || 1}
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Auto-renewal is ON</p>
                    <p className="text-xs text-slate-500 mt-1">Upgrade to Enterprise for unlimited capabilities.</p>
                  </div>
                  <button 
                    onClick={handleUpgrade}
                    className="mt-4 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
                  >
                    Request Upgrade <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>



          <div className="space-y-8">
            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Quick Actions
              </h4>
              <div className="space-y-3">
                <button onClick={() => handleUpgrade('Enterprise / Custom')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Request Custom Upgrade</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Contact Support</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-slate-900">Available Plans</h2>
              <span className="px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full">Upgrade Now</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`relative p-6 rounded-3xl border flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.recommended ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-900 hover:border-slate-200'}`}>
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                      Recommended
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className={`text-lg font-bold ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                    <div className="flex items-baseline mt-2">
                       <span className={`text-3xl font-black ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                       {plan.period && <span className={`text-sm font-bold ${plan.recommended ? 'text-slate-400' : 'text-slate-400'}`}>{plan.period}</span>}
                    </div>
                  </div>
                  
                  <div className={`h-px w-full my-4 ${plan.recommended ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs font-bold leading-relaxed">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.recommended ? 'text-emerald-400' : 'text-emerald-500'}`} />
                        <span className={plan.recommended ? 'text-slate-300' : 'text-slate-500'}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handleUpgrade(plan.name)}
                    className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        plan.recommended 
                        ? 'bg-white text-slate-900 hover:bg-slate-100' 
                        : 'bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    {subscription?.planName === plan.name ? 'Current Plan' : 'Choose Plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
             <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
             </div>
             {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
