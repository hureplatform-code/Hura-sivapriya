import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TrendingUp, Plus, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { APP_CONFIG } from '../../config';

const addOns = [
  { name: 'Laboratory Integration', price: '2,500', icon: Zap, status: 'available' },
  { name: 'Pharmacy Inventory Pro', price: '2,500', icon: TrendingUp, status: 'active' },
  { name: 'SMS Notifications', price: '1,500', icon: Zap, status: 'available' },
];

export default function Growth() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Growth & Add-ons</h1>
          <p className="text-slate-500 mt-1">Enhance your clinical operations with modular add-ons and integrations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {addOns.map((add, i) => (
            <motion.div
              key={add.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${add.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'}`}>
                  {add.status}
                </span>
              </div>

              <div className={`h-14 w-14 rounded-2xl ${add.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'} flex items-center justify-center mb-8`}>
                <add.icon className="h-8 w-8" />
              </div>

              <h3 className="text-xl font-black text-slate-900">{add.name}</h3>
              <p className="text-2xl font-black text-slate-900 mt-2">{APP_CONFIG.CURRENCY} {add.price} <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/mo</span></p>
              
              <button className={`w-full mt-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${add.status === 'active' ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-primary-600 text-white shadow-lg shadow-primary-100 hover:bg-primary-700'}`}>
                {add.status === 'active' ? 'Already Enabled' : 'Enable Add-on'}
                {add.status !== 'active' && <ArrowRight className="h-4 w-4" />}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
