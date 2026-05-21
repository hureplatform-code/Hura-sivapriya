import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Zap, CheckCircle2, ArrowUpRight, Shield, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import facilityService from '../../services/facilityService';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_PLANS = [
  { 
    name: 'Essential', 
    price: 10000, 
    features: ['Up to 10 Staff Members', '1 Location', 'Basic Reporting', 'Email Support'],
    recommended: false,
    color: 'slate',
    maxStaff: 10,
    maxLocations: 1
  },
  { 
    name: 'Professional', 
    price: 18000, 
    features: ['Up to 30 Staff Members', '2 Locations', 'Advanced Analytics', 'Priority Support'],
    recommended: true,
    color: 'primary',
    maxStaff: 30,
    maxLocations: 2
  },
  { 
    name: 'Enterprise', 
    price: 30000, 
    features: ['Up to 75 Staff Members', '5 Locations', 'Dedicated Account Manager', 'White-label Options'],
    recommended: false,
    color: 'indigo',
    maxStaff: 75,
    maxLocations: 5
  }
];

export default function ChangePlan() {
  const { userData, facilityData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
    
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoadingPlans(true);
      const plansSnap = await getDocs(query(collection(db, 'subscription_plans'), orderBy('price', 'asc')));
      const plansList = plansSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map back consistent colors/features for the UI
        color: doc.data().name === 'Enterprise' ? 'indigo' : doc.data().name === 'Professional' ? 'primary' : 'slate',
        recommended: doc.data().name === 'Professional',
        features: doc.data().features || (DEFAULT_PLANS.find(p => p.name === doc.data().name)?.features || [])
      }));

      setPlans(plansList.length > 0 ? plansList : DEFAULT_PLANS);
      
      if (facilityData?.subscription?.planName) {
        setCurrentPlan(facilityData.subscription.planName);
      }
    } catch (e) {
      console.error("Fetch plans error:", e);
      setPlans(DEFAULT_PLANS);
    } finally {
      setLoadingPlans(false);
    }
  };

  const initializePayment = (plan) => {
    setLoading(true);
    const handler = window.PaystackPop.setup({
      key: 'pk_test_d9ad39cd6fd776742957c7d8732fb048ba246998', 
      email: userData?.email || 'admin@hurecare.com',
      amount: plan.price * 100, 
      currency: 'KES',
      ref: '' + Math.floor((Math.random() * 1000000000) + 1), 
      metadata: {
        custom_fields: [
          {
            display_name: "Facility ID",
            variable_name: "facility_id",
            value: userData?.facilityId
          },
          {
            display_name: "Plan Name",
            variable_name: "plan_name",
            value: plan.name
          }
        ]
      },
      callback: async (response) => {
        try {
          const subscriptionData = {
            planId: plan.name.toLowerCase(),
            planName: plan.name,
            maxStaff: plan.maxStaff || plan.limits?.staff,
            maxLocations: plan.maxLocations || plan.limits?.locations,
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            paymentReference: response.reference,
            lastPaymentAmount: plan.price,
            lastPaymentDate: new Date().toISOString()
          };
          
          await facilityService.updateSubscription(userData?.facilityId, subscriptionData);
          setCurrentPlan(plan.name);
          setNotification({ type: 'success', message: `Successfully upgraded to ${plan.name} plan!` });
        } catch (error) {
          console.error("Error updating subscription:", error);
          setNotification({ type: 'error', message: 'Payment successful but failed to update subscription. Please contact support.' });
        } finally {
          setLoading(false);
          setTimeout(() => setNotification(null), 5000);
        }
      },
      onClose: () => {
        setLoading(false);
        setNotification({ type: 'error', message: 'Payment window closed. Subscription not updated.' });
        setTimeout(() => setNotification(null), 3000);
      }
    });
    
    handler.openIframe();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Change Plan</h1>
          <p className="text-slate-500 mt-1">Upgrade your clinic operations by choosing a plan that fits your needs.</p>
        </div>

        {notification && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loadingPlans ? (
            <div className="col-span-3 py-20 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Fetching Available Plans...</p>
            </div>
          ) : plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-white p-8 rounded-[2.5rem] border ${plan.recommended ? 'border-blue-500 shadow-xl shadow-blue-100' : 'border-slate-100 shadow-sm'} overflow-hidden group`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-medium px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">
                  Popular
                </div>
              )}
              
              <div className={`h-14 w-14 rounded-2xl ${plan.color === 'primary' ? 'bg-blue-50 text-blue-600' : plan.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'} flex items-center justify-center mb-8`}>
                <Zap className="h-8 w-8" />
              </div>

              <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-900">KES {plan.price.toLocaleString()}</span>
                <span className="text-sm font-medium text-slate-400">/mo</span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 ${plan.recommended ? 'text-blue-500' : 'text-slate-300'}`} />
                  <span className="text-sm font-medium text-slate-600">{plan.maxLocations === 1 ? 'Single location' : `Up to ${plan.maxLocations} locations`}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 ${plan.recommended ? 'text-blue-500' : 'text-slate-300'}`} />
                  <span className="text-sm font-medium text-slate-600">{`Up to ${plan.maxStaff || plan.limits?.staff} staff users`}</span>
                </div>
                {plan.features.map(feat => (
                  <div key={feat} className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 ${plan.recommended ? 'text-blue-500' : 'text-slate-300'}`} />
                    <span className="text-sm font-medium text-slate-600">{feat}</span>
                  </div>
                ))}
              </div>

              <button 
                disabled={loading || plan.name === currentPlan}
                onClick={() => initializePayment(plan)}
                className={`w-full mt-10 py-4 rounded-2xl font-medium text-xs uppercase tracking-widest transition-all flex items-center justify-center 
                  ${plan.name === currentPlan 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 disabled:opacity-50'}`}
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
            <h3 className="text-2xl font-semibold">Need a custom enterprise solution?</h3>
            <p className="text-slate-400 mt-2 font-medium">For large hospital networks with over 10 branches, we offer tailored infrastructure and dedicated support.</p>
          </div>
          <button className="px-8 py-4 bg-white text-slate-900 font-medium text-xs uppercase tracking-widest rounded-2xl whitespace-nowrap hover:bg-slate-50 transition-all flex items-center gap-2">
            Contact Sales
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
