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
import { useToast } from '../../contexts/ToastContext';

// No mock payment history needed for now.
// No mock payment history needed for now.
const paymentHistory = [];

const PLANS = [
  {
    id: 'essential',
    name: 'Essential',
    price: '$49',
    period: '/mo',
    limits: { staff: 10, locations: 1 },
    features: ['Up to 10 Staff', '1 Location', 'Full EMR Modules', 'Standard Support'],
    limitLabel: 'Up to 10 Staff',
    recommended: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$99',
    period: '/mo',
    limits: { staff: 30, locations: 2 },
    features: ['Up to 30 Staff', '2 Locations', 'Advanced Reporting', 'Priority Email Support'],
    limitLabel: 'Up to 30 Staff',
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: '/mo',
    limits: { staff: 75, locations: 5 },
    features: ['Up to 75 Staff', '5 Locations', 'Dedicated Account Manager', '24/7 Phone Support'],
    limitLabel: 'Up to 75 Staff',
    recommended: false
  }
];

export default function Accounts() {
  const { userData } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();

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
      success(`Request for ${planName} sent! We will contact you shortly.`);
    } catch (error) {
      console.error(error);
      toastError('Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout><div>Loading subscription details...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Subscription</h1>
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
                    <h3 className="text-lg font-semibold text-slate-900">{subscription?.planName || 'Free Plan'}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Status: <span className="uppercase font-medium text-emerald-600">{subscription?.status || 'Active'}</span> • Expires: {subscription?.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-slate-900">{subscription?.planId === 'free' ? 'Free' : 'Custom'}</p>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Current Plan</p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest">Your Limits</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Max Staff: {subscription?.maxStaff || 5}
                    </li>
                    <li className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Max Locations: {subscription?.maxLocations || 1}
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Auto-renewal is ON</p>
                    <p className="text-xs text-slate-500 mt-1">Upgrade to Enterprise for unlimited capabilities.</p>
                  </div>
                  <button 
                    onClick={handleUpgrade}
                    className="mt-4 px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-lg shadow-slate-200 hover:bg-primary-600 transition-all flex items-center justify-center gap-2"
                  >
                    Request Upgrade <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>



          <div className="space-y-8">
            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <h4 className="text-sm font-medium text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Quick Actions
              </h4>
              <div className="space-y-3">
                <button onClick={() => handleUpgrade('Enterprise / Custom')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Request Custom Upgrade</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Contact Support</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Available Plans</h2>
              <span className="px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-semibold uppercase tracking-widest rounded-full">Upgrade Now</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`relative p-6 rounded-3xl border flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.recommended ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-900 hover:border-slate-200'}`}>
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
                      Recommended
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                    <div className="flex items-baseline mt-2">
                       <span className={`text-2xl font-semibold ${plan.recommended ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                       {plan.period && <span className={`text-sm font-medium ${plan.recommended ? 'text-slate-400' : 'text-slate-400'}`}>{plan.period}</span>}
                    </div>
                  </div>
                  
                  <div className={`h-px w-full my-4 ${plan.recommended ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs font-medium leading-relaxed">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.recommended ? 'text-emerald-400' : 'text-emerald-500'}`} />
                        <span className={plan.recommended ? 'text-slate-300' : 'text-slate-500'}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handleUpgrade(plan.name)}
                    className={`w-full py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all ${
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
    </DashboardLayout>
  );
}
