import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  ArrowDownRight, 
  DollarSign, 
  PlusCircle, 
  Filter, 
  Search,
  FileText,
  PieChart,
  History,
  TrendingDown,
  Activity,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../contexts/CurrencyContext';
import accountingService from '../../services/accountingService';
import auditService from '../../services/auditService';
import { useAuth } from '../../contexts/AuthContext';

export default function Expenses() {
  const { currency } = useCurrency();
  const { userData } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalExpenses: 0,
    monthlyBurn: 0,
    topCategory: 'N/A'
  });

  const categories = [
    'Operating Expense',
    'Administrative',
    'Payroll',
    'Taxes & Fees',
    'Capital Purchase',
    'Platform Infrastructure',
    'R&D / Development'
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const allEntries = await accountingService.getAllEntries(userData?.role === 'superadmin' ? null : userData?.facilityId);
      
      // Filter for expenses: Platform costs for superadmins, or clinic-specific entries for others
      // In this system, almost all entries in 'ledgers' are expenses except for maybe 'Paid' status invoices if they were in the same bucket.
      // But typically we treat everything in the ledger as a transaction, and we filter by category/type.
      
      let filtered = allEntries;
      if (userData?.role !== 'superadmin') {
         // If we had facilityId on entries, we'd filter here. 
         // For now, assuming current multi-tenant logic or filtering by creator/role if needed.
         // Based on Accounting.jsx, superadmin sees everything, others see what's from accountingService.getAllEntries()
      }

      // Calculate stats
      const total = filtered.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
      // Group by category for top category
      const grouped = filtered.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + (parseFloat(e.amount) || 0);
        return acc;
      }, {});
      
      const topCat = Object.entries(grouped).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

      setExpenses(filtered);
      setStats({
        totalExpenses: total,
        monthlyBurn: total / (new Date().getMonth() + 1), // Simplistic average
        topCategory: topCat
      });

    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostExpense = async (data) => {
    try {
      const isPlatform = data.category.includes('Platform') || data.category.includes('R&D');
      const result = await accountingService.createEntry({
        ...data,
        type: isPlatform ? 'PLATFORM_COST' : 'CLINIC_COST',
        facilityId: userData?.facilityId,
        createdByRole: userData?.role
      });
      
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'User',
        action: 'POST_EXPENSE',
        module: 'FINANCIAL',
        description: `Logged expense: ${data.name} for ${currency} ${data.amount}`,
        metadata: { entryId: result.id, category: data.category, amount: data.amount }
      });

      setIsAdding(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error posting expense:', error);
    }
  };

  const filteredList = expenses.filter(e => {
    const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center bg-slate-50 font-medium text-slate-500">Loading Expense Analytics...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Expense Tracking</h1>
            <p className="text-slate-500 font-medium mt-1">Detailed breakdown of operational and capital expenditures.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-semibold text-xs uppercase tracking-widest rounded-3xl hover:bg-red-700 transition-all shadow-2xl shadow-red-100 active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            Record New Expense
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: 'Total Expenditure', value: stats.totalExpenses.toLocaleString(), icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
             { label: 'Avg Monthly Burn', value: stats.monthlyBurn.toLocaleString(), icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
             { label: 'Top Cost Center', value: stats.topCategory, icon: PieChart, color: 'text-blue-600', bg: 'bg-blue-50' },
           ].map((s, i) => (
             <motion.div 
               key={s.label}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
             >
               <div className={`h-12 w-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6`}>
                 <s.icon className="h-6 w-6" />
               </div>
               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
               <p className={`text-2xl font-semibold tracking-tight ${s.color}`}>
                 {s.label.includes('Center') ? s.value : `${currency} ${s.value}`}
               </p>
             </motion.div>
           ))}
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                 type="text"
                 placeholder="Search by payee or subject..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-100 rounded-2xl text-sm font-medium outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
               <Filter className="h-4 w-4 text-slate-400 shrink-0" />
               {['All', ...categories.slice(0, 4)].map(cat => (
                 <button 
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all shrink-0
                       ${filterCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}
                    `}
                 >
                    {cat}
                 </button>
               ))}
            </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full">
                <thead>
                   <tr className="text-left border-b border-slate-50 text-slate-400">
                      <th className="pb-6 text-[10px] font-semibold uppercase tracking-[0.2em] px-4">Expense Item</th>
                      <th className="pb-6 text-[10px] font-semibold uppercase tracking-[0.2em] px-4">Payee/Vendor</th>
                      <th className="pb-6 text-[10px] font-semibold uppercase tracking-[0.2em] px-4">Category</th>
                      <th className="pb-6 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 text-right">Amount</th>
                      <th className="pb-6 text-[10px] font-semibold uppercase tracking-[0.2em] px-4 text-center">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredList.map((item, i) => (
                      <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                         <td className="py-5 px-4">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                  <FileText className="h-5 w-5" />
                               </div>
                               <div>
                                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{new Date(item.date || Date.now()).toLocaleDateString('en-GB')}</p>
                               </div>
                            </div>
                         </td>
                         <td className="py-5 px-4 text-xs font-semibold text-slate-600">{item.vendor}</td>
                         <td className="py-5 px-4">
                            <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-bold uppercase tracking-widest">
                               {item.category}
                            </span>
                         </td>
                         <td className="py-5 px-4 text-right text-sm font-bold text-slate-900">{currency} {parseFloat(item.amount).toLocaleString()}</td>
                         <td className="py-5 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest
                               ${item.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
                            `}>
                               {item.status}
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
         {isAdding && (
            <ExpenseModal 
              onClose={() => setIsAdding(false)} 
              onSave={handlePostExpense} 
              categories={categories}
            />
         )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function ExpenseModal({ onClose, onSave, categories }) {
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
        className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-100">
                 <Activity className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Record Expense</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Asset Requisition Protocol</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
             <X className="h-6 w-6" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-8">
           <div className="space-y-4">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Expense Description</label>
             <input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-red-100 rounded-[2.5rem] text-sm font-medium outline-none transition-all"
                placeholder="e.g. Office Stationery, Server Lease..."
             />
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-red-100 rounded-[2.5rem] text-sm font-medium outline-none appearance-none cursor-pointer"
                >
                   {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Amount</label>
                <input 
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-red-100 rounded-[2.5rem] text-sm font-medium outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
           </div>

           <div className="space-y-4">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Payee / Vendor</label>
             <input 
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                required
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-red-100 rounded-[2.5rem] text-sm font-medium outline-none transition-all"
                placeholder="Who are we paying?"
             />
           </div>

           <div className="flex gap-4 pt-6">
             <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-3xl hover:bg-slate-100 transition-all">Cancel</button>
             <button type="submit" className="flex-1 px-8 py-5 bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-3xl hover:bg-red-700 transition-all shadow-2xl shadow-red-100">Commit Expense</button>
           </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
