import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Zap, CheckCircle2, ArrowUpRight, Shield, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import facilityService from '../../services/facilityService';
import { APP_CONFIG } from '../../config';

const plans = [
  { 
    name: 'Basic Clinic', 
    price: '49', 
    features: ['Up to 500 Patients', '2 Doctors', 'Basic Reporting', 'Email Support'],
    recommended: false,
    color: 'slate'
  },
  { 
    name: 'Enterprise Growth', 
    price: '149', 
    features: ['Unlimited Patients', 'Unlimited Doctors', 'Advanced Analytics', 'Clinic Multi-branch', '24/7 Priority Support'],
    recommended: true,
    color: 'primary'
  },
  { 
    name: 'Hospital Network', 
    price: '449', 
    features: ['Multiple Facilities', 'Custom Integrations', 'Dedicated Account Manager', 'White-label Options'],
    recommended: false,
    color: 'indigo'
  }
];

export default function ChangePlan() {
  const [loading, setLoading] = React.useState(false);
  const [currentPlan, setCurrentPlan] = React.useState('');
  const [notification, setNotification] = React.useState(null);

  React.useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const profile = await facilityService.getProfile();
      if (profile?.plan) setCurrentPlan(profile.plan);
    } catch (e) {
      console.error("Fetch plan error:", e);
    }
  };

  const handlePlanSelect = async (planName) => {
    if (planName === currentPlan) return;
    
    setLoading(true);
    try {
      await facilityService.updateProfile({ plan: planName });
      setCurrentPlan(planName);
      setNotification(`Successfully switched to ${planName} plan!`);
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      console.error("Plan select error:", e);
      setNotification(`Failed to switch plan.`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Change Plan</h1>
          <p className="text-slate-500 mt-1">Scale your hospital operations by choosing a plan that fits your needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-white p-8 rounded-[2.5rem] border ${plan.recommended ? 'border-primary-500 shadow-xl shadow-primary-100' : 'border-slate-100 shadow-sm'} overflow-hidden group`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">
                  Popular
                </div>
              )}
              
              <div className={`h-14 w-14 rounded-2xl ${plan.color === 'primary' ? 'bg-primary-50 text-primary-600' : plan.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'} flex items-center justify-center mb-8`}>
                <Zap className="h-8 w-8" />
              </div>

              <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">{APP_CONFIG.CURRENCY} {plan.price}</span>
                <span className="text-sm font-bold text-slate-400">/mo</span>
              </div>

              <div className="mt-8 space-y-4">
                {plan.features.map(feat => (
                  <div key={feat} className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 ${plan.recommended ? 'text-primary-500' : 'text-slate-300'}`} />
                    <span className="text-sm font-bold text-slate-600">{feat}</span>
                  </div>
                ))}
              </div>

              <button 
                disabled={loading}
                onClick={() => handlePlanSelect(plan.name)}
                className={`w-full mt-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all 
                  ${plan.name === currentPlan 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' 
                    : 'bg-primary-600 text-white shadow-lg shadow-primary-100 hover:bg-primary-700 active:scale-95 disabled:opacity-50'}`}
              >
                {loading && plan.name !== currentPlan ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
                ) : (
                  plan.name === currentPlan ? 'Current Plan' : 'Select Plan'
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h3 className="text-2xl font-black">Need a custom enterprise solution?</h3>
            <p className="text-slate-400 mt-2 font-medium">For large hospital networks with over 10 branches, we offer tailored infrastructure and dedicated support.</p>
          </div>
          <button className="px-8 py-4 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl whitespace-nowrap hover:bg-slate-50 transition-all flex items-center gap-2">
            Contact Sales
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
