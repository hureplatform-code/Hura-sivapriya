import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Zap,
  Download,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { APP_CONFIG } from '../../config';

const paymentHistory = [
  { id: 'INV-001', date: 'Oct 12, 2025', amount: `${APP_CONFIG.CURRENCY} 15,000`, status: 'Paid', method: 'M-Pesa' },
  { id: 'INV-002', date: 'Sep 12, 2025', amount: `${APP_CONFIG.CURRENCY} 15,000`, status: 'Paid', method: 'M-Pesa' },
  { id: 'INV-003', date: 'Aug 12, 2025', amount: `${APP_CONFIG.CURRENCY} 15,000`, status: 'Paid', method: 'Card' },
];

export default function Accounts() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Subscriptions & Billing</h1>
          <p className="text-slate-500 mt-1">Manage hospital subscription plans, payment methods, and invoices.</p>
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
                    <h3 className="text-lg font-bold text-slate-900">Enterprise Growth Plan</h3>
                    <p className="text-xs text-slate-500 font-medium">Billed monthly • Next billing date: Nov 12, 2025</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">{APP_CONFIG.CURRENCY} 15,000</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">per month</p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Includes</h4>
                  <ul className="space-y-3">
                    {['Unlimited Patients', 'Advanced Analytics', 'Clinic Multi-branch', '24/7 Support'].map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Auto-renewal is ON</p>
                    <p className="text-xs text-slate-500 mt-1">Your subscription will automatically renew using M-Pesa ending in *678.</p>
                  </div>
                  <button className="mt-4 px-4 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-900 hover:text-white transition-all">
                    Turn Off Auto-renewal
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-50">
                      <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                      <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                      <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Method</th>
                      <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paymentHistory.map((row) => (
                      <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 font-bold text-slate-900">{row.id}</td>
                        <td className="py-4 text-sm text-slate-500 font-medium">{row.date}</td>
                        <td className="py-4 font-bold text-slate-900">{row.amount}</td>
                        <td className="py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-600">
                            {row.method}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-xl transition-all">
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <ShieldCheck className="h-10 w-10 text-primary-400 mb-4" />
                <h3 className="text-xl font-bold">Secure Billing</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  All transactions are encrypted and processed via PCI-certified partners.
                </p>
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                  <CreditCard className="h-8 w-8 text-slate-500" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Method</p>
                    <p className="text-sm font-bold text-white">M-Pesa Mobile Money</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 h-40 w-40 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary-500/20 transition-all duration-700" />
            </div>

            <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Quick Actions
              </h4>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Change Plan</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Update Payment</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Billing Support</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
