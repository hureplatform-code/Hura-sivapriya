import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Building2, 
  TrendingUp, 
  ArrowDownRight, 
  DollarSign, 
  PlusCircle, 
  ArrowUpRight, 
  Filter, 
  Search,
  Wallet,
  Users,
  FileText,
  PieChart,
  History,
  X,
  CreditCard,
  Briefcase,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import { useCurrency } from '../../contexts/CurrencyContext';
import accountingService from '../../services/accountingService';
import billingService from '../../services/billingService';
import auditService from '../../services/auditService';
import facilityService from '../../services/facilityService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

export default function Accounting() {
  const { currency } = useCurrency();
  const { userData } = useAuth();
  const isPlatform = userData?.role === 'superadmin';
  
  // Data States
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null); // For view modal

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [accStats, setAccStats] = useState({
    expenses: 0,
    vendorBalance: 0,
    netProfit: 0,
    revenue: 0,
    isPlatform: false,
    activeSubscribers: 0,
    clinicsCount: 0
  });

  const categories = [
    'Subscription',
    'Operating Expense',
    'Administrative',
    'Payroll',
    'Taxes & Fees',
    'Capital Purchase',
    'Platform Infrastructure',
    'R&D / Development'
  ];

  useEffect(() => {
    if (userData) {
      fetchAccountingData();
    }
  }, [userData]);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      
      if (userData?.role === 'superadmin') {
         // PLATFORM LEVEL OVERVIEW
         const [allFacilities, allUsers, allLedgers] = await Promise.all([
           facilityService.getAllFacilities(),
           userService.getAllUsers(),
           accountingService.getAllEntries()
         ]);

         const clinicsCount = allFacilities.length;
         const activeSubscribers = allFacilities.filter(f => f.subscription?.status === 'active').length;
         
         // Calculate Subscription Revenue (Estimate based on active subscription levels)
         const globalRevenue = allFacilities.reduce((sum, f) => {
            const plan = (f.subscription?.planName || 'Essential').toLowerCase();
            const monthly = plan === 'professional' ? 5000 : plan === 'enterprise' ? 15000 : 2500;
            return sum + monthly;
         }, 0);

         // Fetch Platform Expenses (Any entry not tied to a specific facility, or marked as platform)
         const platformExpenses = allLedgers
           .filter(e => e.type === 'PLATFORM_COST' || e.createdByRole === 'superadmin')
           .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

         setAccStats({
           expenses: platformExpenses,
           vendorBalance: clinicsCount, // Represents Clinics count on the metric widget
           netProfit: globalRevenue - platformExpenses,
           revenue: globalRevenue,
           isPlatform: true,
           activeSubscribers,
           clinicsCount
         });
         
         // Map facility subscriptions as "Revenue / Income" ledger rows
         const platformEntries = allFacilities.map((f, i) => {
            const plan = (f.subscription?.planName || 'Essential').toLowerCase();
            const monthly = plan === 'professional' ? 5000 : plan === 'enterprise' ? 15000 : 2500;
            return {
               id: f.id || `fac-${i}`,
               name: f.name || 'Unnamed Clinic',
               vendor: plan.toUpperCase() + ' PLAN',
               category: 'Subscription',
               amount: monthly,
               status: f.subscription?.status === 'active' ? 'Paid' : 'Pending',
               date: f.subscription?.expiryDate || new Date().toISOString(),
               isRevenue: true
            };
         });
         
         // Map recorded platform expenses
         const platformCostEntries = allLedgers
           .filter(e => e.type === 'PLATFORM_COST' || e.createdByRole === 'superadmin')
           .map(e => ({
              ...e,
              isRevenue: false
           }));

         // Combine subscriptions (Revenue) and server/dev costs (Expenses)
         const combined = [...platformEntries, ...platformCostEntries];
         combined.sort((a, b) => new Date(b.date) - new Date(a.date));

         setLedgers(combined);
      } else {
         // CLINIC LEVEL OVERVIEW
         const [billingStats, ledgerEntries] = await Promise.all([
           billingService.getFinancialStats(userData?.facilityId),
           accountingService.getAllEntries(userData?.facilityId)
         ]);

         const revenue = billingStats.revenue;
         const stats = await accountingService.getAccountingStats(revenue);
         
         // Treat clinic ledger entries as expense rows
         const mappedClinicEntries = (ledgerEntries || []).map(e => ({
            ...e,
            isRevenue: false
         }));
         
         setLedgers(mappedClinicEntries);
         setAccStats({ 
           expenses: stats.expenses, 
           vendorBalance: stats.vendorBalance,
           netProfit: stats.netProfit,
           revenue, 
           isPlatform: false 
         });
      }

    } catch (error) {
      console.error('Error fetching accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostEntry = async (data) => {
    try {
      const isPlatform = data.category.includes('Platform') || data.category.includes('R&D');
      const result = await accountingService.createEntry({
        ...data,
        type: isPlatform || userData?.role === 'superadmin' ? 'PLATFORM_COST' : 'CLINIC_COST',
        facilityId: userData?.facilityId || 'PLATFORM',
        createdByRole: userData?.role
      });
      
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Accountant',
        action: 'POST_LEDGER_ENTRY',
        module: 'FINANCIAL',
        description: `Posted ${data.category} entry: ${data.name} for ${currency} ${data.amount}`,
        metadata: { entryId: result.id, category: data.category, amount: data.amount, role: userData?.role }
      });

      setIsAdding(false);
      fetchAccountingData();
    } catch (error) {
       console.error('Error posting entry:', error);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this ledger entry? This action is permanent.")) return;
    
    try {
      await accountingService.deleteEntry(entryId);
      
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Accountant',
        action: 'DELETE_LEDGER_ENTRY',
        module: 'FINANCIAL',
        description: `Deleted ledger transaction record ${entryId}`,
        metadata: { entryId }
      });

      fetchAccountingData();
    } catch (error) {
      console.error("Error deleting ledger entry:", error);
    }
  };

  // Filters logic
  const filteredLedgers = ledgers.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Reset pagination to page 1 on filter adjustment
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterStatus]);

  // Pagination bounds & slice calculation
  const totalItems = filteredLedgers.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = filteredLedgers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber === '...') return;
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPageButtons = 5;
    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  // Expenditures Allocation Calculator (Live Data-Driven)
  const expenseEntries = ledgers.filter(e => !e.isRevenue);
  const totalExpenseAmount = expenseEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const groupedExpenses = expenseEntries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (parseFloat(e.amount) || 0);
    return acc;
  }, {});

  const allocationsBase = [
    { label: 'Payroll', color: 'bg-blue-500', matchKeys: ['Payroll'] },
    { label: 'Platform & Infra', color: 'bg-indigo-500', matchKeys: ['Platform Infrastructure'] },
    { label: 'R&D', color: 'bg-pink-500', matchKeys: ['R&D / Development'] },
    { label: 'Operational', color: 'bg-emerald-500', matchKeys: ['Operating Expense', 'Capital Purchase'] },
    { label: 'Administrative', color: 'bg-amber-500', matchKeys: ['Administrative', 'Taxes & Fees'] }
  ];

  const allocations = allocationsBase.map(alloc => {
    const sum = alloc.matchKeys.reduce((accSum, key) => accSum + (groupedExpenses[key] || 0), 0);
    const percentage = totalExpenseAmount > 0 ? Math.round((sum / totalExpenseAmount) * 100) : 0;
    return {
      label: alloc.label,
      value: percentage,
      amount: sum,
      color: alloc.color
    };
  }).filter(alloc => alloc.amount > 0 || alloc.label === 'Payroll' || alloc.label === 'Administrative');

  // KPI display widgets
  const stats = isPlatform ? [
    { label: 'Platform Revenue', value: accStats.revenue, change: '+12.5% vs last month', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Platform Expenses', value: accStats.expenses, change: '-5.2% vs last month', icon: ArrowDownRight, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Total Clinics', value: accStats.clinicsCount, suffix: 'Active Orgs', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', noCurrency: true },
    { label: 'Platform Profit', value: accStats.netProfit, change: '+20% vs last month', icon: DollarSign, color: 'text-slate-900', bg: 'bg-slate-50' },
  ] : [
    { label: 'Monthly Revenue', value: accStats.revenue, change: '+12% vs last month', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Expenses', value: accStats.expenses, change: '-5.2% vs last month', icon: ArrowDownRight, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Vendor Balance', value: accStats.vendorBalance, suffix: 'Active Vendors', icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Net Profit', value: accStats.netProfit, change: '+20% vs last month', icon: DollarSign, color: 'text-slate-900', bg: 'bg-slate-50' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-16">
        
        {/* Main Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isPlatform ? 'Platform Ledger & Revenue' : 'Expenses & General Ledger'}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {isPlatform 
                ? 'Global subscription analytics, cloud infrastructure expenses, and profitability metrics.' 
                : 'Manage clinic-level general ledgers, operational expenses, and supplier balances.'}
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-widest rounded-3xl transition-all shadow-2xl shadow-slate-200 active:scale-95 self-start md:self-auto shrink-0"
          >
            <PlusCircle className="h-5 w-5" />
            {isPlatform ? 'Post Platform Expense' : 'Record Clinic Expense'}
          </button>
        </div>

        {/* 4-Column KPI Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
             const isUp = stat.change?.startsWith('+');
             const isDown = stat.change?.startsWith('-');
             const trendColor = isUp ? 'text-emerald-500' : isDown ? 'text-rose-500' : 'text-slate-400';

             return (
               <motion.div 
                 key={stat.label}
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all duration-300"
               >
                 <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                   <stat.icon className="h-6 w-6" />
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-400 truncate leading-none">{stat.label}</span>
                    <div className="flex items-baseline gap-1 mt-2 leading-none">
                       {!stat.noCurrency && <span className="text-sm font-semibold opacity-70 text-slate-900">{currency}</span>}
                       <span className="text-2xl font-bold text-slate-900 tracking-tight">
                         {stat.noCurrency ? stat.value : parseFloat(stat.value || 0).toLocaleString()}
                       </span>
                    </div>
                    {stat.change ? (
                       <span className={`text-[10px] font-bold mt-2 flex items-center gap-0.5 leading-none ${trendColor}`}>
                          {isUp ? '↑ ' : isDown ? '↓ ' : ''}{stat.change}
                       </span>
                    ) : stat.suffix ? (
                       <span className="text-[10px] font-bold mt-2 text-slate-400 leading-none">
                         {stat.suffix}
                       </span>
                    ) : null}
                 </div>
               </motion.div>
             );
          })}
        </div>

        {/* Filter bar - Matches exactly the inline design sitting on the gray background */}
        <div className="flex flex-wrap gap-4 items-center justify-between pt-2">
          {/* Header Left */}
          <h2 className="text-xl font-bold text-slate-900 tracking-tight shrink-0">
            {isPlatform ? 'Global Ledger Transactions' : 'Ledger Entries & Balances'}
          </h2>

          {/* Actionable Filters Grid */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input Container */}
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                 type="text"
                 placeholder="Search by payee, clinic, item..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-slate-300 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
              />
            </div>

            {/* Category Select */}
            <div className="relative shrink-0">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none bg-white border border-slate-200 focus:border-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-slate-600 outline-none cursor-pointer shadow-sm min-w-[130px]"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Select */}
            <div className="relative shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-white border border-slate-200 focus:border-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold text-slate-600 outline-none cursor-pointer shadow-sm min-w-[120px]"
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Advance Filters Button */}
            <button 
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('All');
                setFilterStatus('All');
              }}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold text-xs py-3.5 px-4 rounded-xl shadow-sm transition-all active:scale-95"
              title="Reset Filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Unified Table & Allocation Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Ledger Table Container */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                 
                 <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] border-collapse">
                       <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-100">
                             <th className="pb-4 font-semibold text-xs px-4">Ledger Item</th>
                             <th className="pb-4 font-semibold text-xs px-4">Payee/Vendor</th>
                             <th className="pb-4 font-semibold text-xs px-4">Category</th>
                             <th className="pb-4 font-semibold text-xs px-4 text-right">Amount</th>
                             <th className="pb-4 font-semibold text-xs px-4 text-center">Status</th>
                             <th className="pb-4 font-semibold text-xs px-4 text-center">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {currentItems.length > 0 ? currentItems.map((entry) => (
                             <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4">
                                   <div className="flex items-center gap-3">
                                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                                        entry.isRevenue 
                                          ? 'bg-emerald-50 text-emerald-500' 
                                          : 'bg-red-50 text-red-500'
                                      }`}>
                                         <FileText className="h-4.5 w-4.5" />
                                      </div>
                                      <div>
                                         <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{entry.name}</p>
                                         <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight mt-0.5">
                                           {entry.date ? new Date(entry.date).toLocaleDateString('en-GB') : '—'}
                                         </p>
                                      </div>
                                   </div>
                                </td>
                                
                                <td className="py-4 px-4 text-xs font-semibold text-slate-600 truncate max-w-[140px]">
                                  {entry.vendor || '—'}
                                </td>

                                <td className="py-4 px-4">
                                   <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                                     entry.category === 'Subscription' 
                                       ? 'bg-blue-50 text-blue-600 border-blue-100'
                                       : entry.category === 'Payroll'
                                       ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                       : entry.category === 'Platform Infrastructure' || entry.category === 'R&D / Development'
                                       ? 'bg-purple-50 text-purple-600 border-purple-100'
                                       : 'bg-slate-50 text-slate-500 border-slate-100'
                                   }`}>
                                      {entry.category}
                                   </span>
                                </td>

                                <td className={`py-4 px-4 text-right text-sm font-bold tracking-tight ${
                                  entry.isRevenue ? 'text-emerald-600' : 'text-slate-900'
                                }`}>
                                  {entry.isRevenue ? '+' : '-'} {currency} {parseFloat(entry.amount || 0).toLocaleString()}
                                </td>

                                <td className="py-4 px-4 text-center">
                                   <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                                      entry.status === 'Paid' 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                        : 'bg-orange-50 text-orange-600 border-orange-100'
                                   }`}>
                                      {entry.status}
                                   </span>
                                </td>

                                <td className="py-4 px-4">
                                   <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => setSelectedEntry(entry)}
                                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      {!entry.isRevenue && (
                                        <button 
                                          onClick={() => handleDeleteEntry(entry.id)}
                                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                          title="Delete Entry"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                   </div>
                                </td>
                             </tr>
                          )) : (
                              <tr>
                                <td colSpan="6" className="py-24 text-center">
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                      <FileText className="h-8 w-8" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 tracking-tight">No Transactions Registered</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adjust filters or record a new transaction.</p>
                                  </div>
                                </td>
                              </tr>
                          )}
                       </tbody>
                    </table>
                 </div>

                 {/* Pagination - Matching exactly the HURE Premium Guidelines */}
                 {totalPages > 0 && (
                   <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
                     <span className="text-sm text-slate-500 font-semibold">
                       Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} transactions
                     </span>

                     <div className="flex items-center gap-1.5">
                       {/* Prev Button */}
                       <button
                         onClick={() => handlePageChange(currentPage - 1)}
                         disabled={currentPage === 1}
                         className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                       >
                         <ChevronLeft className="h-4 w-4" />
                       </button>

                       {/* Page numbers with Ellipses */}
                       {getPageNumbers().map((page, index) => (
                         <button
                           key={index}
                           onClick={() => handlePageChange(page)}
                           className={`h-9 min-w-[36px] px-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                             currentPage === page
                               ? 'bg-slate-900 text-white shadow-md'
                               : page === '...'
                               ? 'text-slate-400 cursor-default'
                               : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                           }`}
                         >
                           {page}
                         </button>
                       ))}

                       {/* Next Button */}
                       <button
                         onClick={() => handlePageChange(currentPage + 1)}
                         disabled={currentPage === totalPages}
                         className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95"
                       >
                         <ChevronRight className="h-4 w-4" />
                       </button>
                     </div>

                     <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rows per page</span>
                       <div className="relative">
                         <select
                           value={rowsPerPage}
                           onChange={(e) => {
                             setRowsPerPage(Number(e.target.value));
                             setCurrentPage(1);
                           }}
                           className="appearance-none bg-white border border-slate-200 focus:border-slate-300 rounded-xl pl-4 pr-8 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer shadow-sm"
                         >
                           {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                         </select>
                         <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                       </div>
                     </div>
                   </div>
                 )}

              </div>
           </div>

           {/* Sidebar Component: Allocation Widget */}
           <div className="space-y-6">
              
              {/* Expenditure Allocation Meter */}
              <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[360px]">
                 <div className="relative z-10 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold tracking-tight mb-1 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-indigo-400" />
                        Expense Distribution
                      </h3>
                      <p className="text-slate-400 text-xs font-medium">Allocation profile derived from active ledger records.</p>
                    </div>

                    <div className="space-y-5">
                       {allocations.length > 0 ? allocations.map(item => (
                          <div key={item.label} className="space-y-2">
                             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <span>{item.label}</span>
                                <div className="flex items-center gap-1.5">
                                  <span>{currency} {item.amount.toLocaleString()}</span>
                                  <span className="text-white">({item.value}%)</span>
                                </div>
                             </div>
                             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.value}%` }}
                                  className={`h-full ${item.color}`}
                                />
                             </div>
                          </div>
                       )) : (
                         <div className="py-12 text-center text-slate-500 font-medium text-xs uppercase tracking-wider">
                           No recorded expenses to allocate
                         </div>
                       )}
                    </div>
                 </div>
                 
                 <div className="relative z-10 pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-semibold">
                   <span>Total Gross Expenses:</span>
                   <span className="text-white text-sm font-bold">{currency} {totalExpenseAmount.toLocaleString()}</span>
                 </div>

                 <div className="absolute -bottom-6 -right-6 p-8 opacity-5">
                    <PieChart className="h-44 w-44 text-white" />
                 </div>
              </div>

              {/* Audit Log Hint */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                 <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <History className="h-5 w-5" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Activity Governance</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      All transaction mutations (posts, modifications, deletes) are fully bound to the facility audit trail. 
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Post/Record Modal */}
      <AnimatePresence>
         {isAdding && (
            <LedgerModal 
              onClose={() => setIsAdding(false)} 
              onSave={handlePostEntry} 
              categories={categories}
            />
         )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
         {selectedEntry && (
            <ViewModal 
              entry={selectedEntry} 
              onClose={() => setSelectedEntry(null)} 
              currency={currency}
            />
         )}
      </AnimatePresence>

    </DashboardLayout>
  );
}

// Uniform Add Modal
function LedgerModal({ onClose, onSave, categories }) {
  const { currency } = useCurrency();
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
    onSave({
      ...formData,
      amount: parseFloat(formData.amount) || 0
    });
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
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white"
      >
        <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-950 rounded-[1rem] flex items-center justify-center text-white shadow-xl">
                 <PlusCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Post Ledger Transaction</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">HURE Care Audit Protocol</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
             <X className="h-5 w-5" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
           <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Transaction Subject</label>
             <input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-semibold outline-none text-slate-800 transition-all placeholder:text-slate-300"
                placeholder="e.g. Server Renewal Lease, Staff Salaries..."
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Category</label>
                <div className="relative">
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer text-slate-700"
                  >
                     {categories.filter(c => c !== 'Subscription').map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Amount ({currency})</label>
                <input 
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  min="0.01"
                  step="any"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-semibold outline-none text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="0.00"
                />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Payee / Vendor</label>
                <input 
                  value={formData.vendor}
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-semibold outline-none text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="Vendor name..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Transaction Date</label>
                <input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-semibold outline-none text-slate-700 transition-all"
                />
              </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Settlement Status</label>
             <div className="flex gap-3">
               {['Paid', 'Pending'].map(status => (
                 <button
                   key={status}
                   type="button"
                   onClick={() => setFormData({...formData, status})}
                   className={`flex-1 py-3 px-5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border ${
                     formData.status === status
                       ? 'bg-slate-900 text-white border-slate-950 shadow-sm'
                       : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   {status}
                 </button>
               ))}
             </div>
           </div>

           <div className="flex gap-4 pt-6 border-t border-slate-50">
             <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
             <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Commit Transaction</button>
           </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Details View Modal
function ViewModal({ entry, onClose, currency }) {
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
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-3.5">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                entry.isRevenue ? 'bg-emerald-500 shadow-emerald-100' : 'bg-red-500 shadow-red-100'
              }`}>
                 <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Transaction Details</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Audit Record Info</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
             <X className="h-5 w-5" />
           </button>
        </div>

        <div className="p-8 space-y-6 text-sm">
           <div className="grid grid-cols-2 gap-y-5 gap-x-4 border-b border-slate-50 pb-6">
             <div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ledger Item</span>
               <span className="font-bold text-slate-900 mt-1 block">{entry.name}</span>
             </div>
             <div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payee/Vendor</span>
               <span className="font-semibold text-slate-700 mt-1 block">{entry.vendor || '—'}</span>
             </div>
             <div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Transaction Category</span>
               <span className="font-semibold text-slate-700 mt-1 block">{entry.category}</span>
             </div>
             <div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Reference Type</span>
               <span className="font-bold text-slate-700 mt-1 block text-xs">
                 {entry.isRevenue ? 'Platform Revenue (Plan)' : entry.type || 'Clinic Expenditure'}
               </span>
             </div>
             <div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Transaction Date</span>
               <span className="font-semibold text-slate-700 mt-1 block">
                 {entry.date ? new Date(entry.date).toLocaleDateString('en-GB') : '—'}
               </span>
             </div>
             <div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Settlement Status</span>
               <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border inline-block mt-1 ${
                  entry.status === 'Paid' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-orange-50 text-orange-600 border-orange-100'
               }`}>
                  {entry.status}
               </span>
             </div>
           </div>

           <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Transaction Amount:</span>
             <span className={`text-xl font-black ${entry.isRevenue ? 'text-emerald-600' : 'text-slate-900'}`}>
               {entry.isRevenue ? '+' : '-'} {currency} {parseFloat(entry.amount || 0).toLocaleString()}
             </span>
           </div>

           <div className="pt-2">
             <button 
               onClick={onClose} 
               className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
             >
               Close Audit View
             </button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
