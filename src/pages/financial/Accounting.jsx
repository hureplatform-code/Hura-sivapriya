import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Building2, 
  Users, 
  FileText,
  DollarSign,
  PieChart,
  History,
  TrendingUp,
  X,
  PlusCircle,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import accountingService from '../../services/accountingService';
import billingService from '../../services/billingService';

export default function Accounting() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [accStats, setAccStats] = useState({
    expenses: 0,
    vendorBalance: 0,
    netProfit: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      const [billingStats, ledgerEntries] = await Promise.all([
        billingService.getFinancialStats(),
        accountingService.getAllEntries()
      ]);

      const revenue = billingStats.revenue;
      const stats = await accountingService.getAccountingStats(revenue);
      
      setLedgers(ledgerEntries || []);
      setAccStats({ ...stats, revenue });

    } catch (error) {
      console.error('Error fetching accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLedgers = ledgers.filter(l => {
    if (filterType === 'All') return true;
    return l.status === filterType;
  });

  const stats = [
    { label: 'Monthly Revenue', value: `${APP_CONFIG.CURRENCY} ${accStats.revenue.toLocaleString()}`, change: '+12%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Expenses', value: `${APP_CONFIG.CURRENCY} ${accStats.expenses.toLocaleString()}`, change: '-5.2%', icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Vendor Balance', value: `${APP_CONFIG.CURRENCY} ${accStats.vendorBalance.toLocaleString()}`, change: 'Active Vendors', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Net Profit', value: `${APP_CONFIG.CURRENCY} ${accStats.netProfit.toLocaleString()}`, change: '+20%', icon: DollarSign, color: 'text-slate-900', bg: 'bg-slate-50' },
  ];

  const handlePostEntry = async (data) => {
    await accountingService.createEntry(data);
    setIsAdding(false);
    fetchAccountingData();
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-center font-bold text-slate-500">Auditing Ledgers...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Ledger</h1>
            <p className="text-slate-500 font-medium mt-1">General accounting, expense tracking, and vendor management.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            Post Ledger Entry
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
             <motion.div 
               key={stat.label}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
             >
               <div className={`h-14 w-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                 <stat.icon className="h-7 w-7" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
               <div className="flex items-end justify-between">
                  <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                  <div className={`h-10 w-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
               </div>
             </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Transactions</h3>
                    <div className="flex gap-2">
                       {['All', 'Paid', 'Pending'].map(s => (
                          <button 
                            key={s}
                            onClick={() => setFilterType(s)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                              ${filterType === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                            `}
                          >
                             {s}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full">
                       <thead>
                          <tr className="text-left border-b border-slate-50 text-slate-400">
                             <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-4">Ledger Item</th>
                             <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-4">Vendor</th>
                             <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-4">Category</th>
                             <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-4 text-right">Amount</th>
                             <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-4 text-center">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredLedgers.length > 0 ? filteredLedgers.map((entry, i) => (
                             <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-5 px-4">
                                   <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                         <FileText className="h-5 w-5" />
                                      </div>
                                      <p className="text-sm font-black text-slate-900">{entry.name}</p>
                                   </div>
                                </td>
                                <td className="py-5 px-4 text-xs font-bold text-slate-500">{entry.vendor}</td>
                                <td className="py-5 px-4">
                                   <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                                      {entry.category}
                                   </span>
                                </td>
                                <td className="py-5 px-4 text-right text-sm font-black text-slate-900">{APP_CONFIG.CURRENCY} {parseFloat(entry.amount).toLocaleString()}</td>
                                <td className="py-5 px-4 text-center">
                                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                                      ${entry.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 
                                        entry.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-300'}
                                   `}>
                                      {entry.status}
                                   </span>
                                </td>
                             </tr>
                          )) : <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No ledger entries found.</td></tr>}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="relative z-10">
                    <h3 className="text-lg font-black tracking-tight mb-6">Expense Allocation</h3>
                    <div className="space-y-6">
                       {[
                         { label: 'Payroll', value: 75, color: 'bg-blue-400' },
                         { label: 'Supplies', value: 15, color: 'bg-purple-400' },
                         { label: 'Operational', value: 10, color: 'bg-emerald-400' },
                       ].map(item => (
                          <div key={item.label} className="space-y-2">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>{item.label}</span>
                                <span>{item.value}%</span>
                             </div>
                             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.value}%` }}
                                  className={`h-full ${item.color}`}
                                />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <PieChart className="h-24 w-24" />
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                 <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Quick Actions</h3>
                 <div className="grid grid-cols-1 gap-3">
                    <button className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-all">
                       <div className="flex items-center gap-3">
                          <History className="h-5 w-5 text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Fiscal History</span>
                       </div>
                       <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-all" />
                    </button>
                    <button className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-all">
                       <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Vendors</span>
                       </div>
                       <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-all" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
         {isAdding && (
            <LedgerModal 
              onClose={() => setIsAdding(false)} 
              onSave={handlePostEntry} 
            />
         )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function LedgerModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Operating Expense',
    amount: '',
    vendor: '',
    status: 'Paid',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-white"
      >
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl">
                 <PlusCircle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ledger Entry</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Fiscal Compliance Protocol</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
             <X className="h-6 w-6" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-8">
           <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Transaction Subject</label>
             <input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2.5rem] text-sm font-bold outline-none"
                placeholder="e.g. Monthly Electricity Bill..."
             />
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2.5rem] text-sm font-bold outline-none appearance-none cursor-pointer"
                >
                   <option>Operating Expense</option>
                   <option>Administrative</option>
                   <option>Payroll</option>
                   <option>Taxes & Fees</option>
                   <option>Capital Purchase</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Amount (Ksh)</label>
                <input 
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2.5rem] text-sm font-bold outline-none"
                  placeholder="0.00"
                />
              </div>
           </div>

           <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Vendor / Recipient</label>
             <input 
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                required
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2.5rem] text-sm font-bold outline-none"
                placeholder="Vendor name..."
             />
           </div>

           <div className="flex gap-4 pt-6">
             <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-slate-100 transition-all">Cancel</button>
             <button type="submit" className="flex-1 px-8 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200">Commit Transaction</button>
           </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

