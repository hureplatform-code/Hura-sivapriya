import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import auditService from '../../services/auditService';
import { db } from '../../firebase';
import { collection, query, getDocs, limit, orderBy, startAfter, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  User,
  Activity,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  FileText,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  Download,
  Settings,
  Shield,
  Box,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Globe,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalAudit() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('All Modules');
  const [filterUser, setFilterUser] = useState('All Users');
  const [filterOrg, setFilterOrg] = useState('All Organizations');
  const [filterAction, setFilterAction] = useState('All Actions');
  const [dateRange, setDateRange] = useState('Jun 1, 2026 - Jun 7, 2026');

  // Real data for filters
  const [organizations, setOrganizations] = useState(['All Organizations']);
  const [uniqueUsers, setUniqueUsers] = useState(['All Users']);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    userActions: 0,
    systemActions: 0,
    securityEvents: 0
  });

  useEffect(() => {
    fetchFilterData();
    fetchLogs(1);
  }, [filterModule, filterUser, filterOrg, filterAction]);

  const fetchFilterData = async () => {
    try {
      // Corrected collection name: 'facility_profile' instead of 'facilities'
      const orgsSnap = await getDocs(collection(db, 'facility_profile'));
      const orgsList = orgsSnap.docs.map(doc => doc.data().facilityName || doc.data().name).filter(Boolean);
      setOrganizations(['All Organizations', ...new Set(orgsList)]);

      // Get users from the last 100 logs
      const usersSnap = await getDocs(query(collection(db, 'audit_logs'), limit(100)));
      const usersList = usersSnap.docs.map(doc => doc.data().userName).filter(Boolean);
      setUniqueUsers(['All Users', ...new Set(usersList)]);
    } catch (err) {
      console.error('Error fetching filter data:', err);
    }
  };

  const fetchLogs = async (pageNumber, isNext = true) => {
    try {
      setLoading(true);
      
      // Building a smarter query. Note: We use client-side filtering for complex filters 
      // to avoid requiring the user to create dozens of composite indexes manually.
      let constraints = [orderBy('timestamp', 'desc')];
      
      // Only add primary module filter if selected to keep query simple
      if (filterModule !== 'All Modules') {
        constraints.push(where('module', '==', filterModule));
      }

      const q = query(collection(db, 'audit_logs'), ...constraints, limit(200)); // Fetch a larger batch for better filtering
      const querySnapshot = await getDocs(q);
      
      let allFetchedLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Apply Advanced Filters Client-Side
      let filtered = allFetchedLogs.filter(log => {
        const matchesUser = filterUser === 'All Users' || log.userName === filterUser;
        const matchesOrg = filterOrg === 'All Organizations' || log.facilityName === filterOrg || log.targetName === filterOrg;
        const matchesAction = filterAction === 'All Actions' || log.action === filterAction;
        const matchesSearch = !searchQuery || 
          (log.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (log.description || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesUser && matchesOrg && matchesAction && matchesSearch;
      });

      // Pagination on filtered set
      const start = (pageNumber - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageLogs = filtered.slice(start, end);

      setLogs(pageLogs);
      setHasMore(filtered.length > end);
      setCurrentPage(pageNumber);

      // Update stats based on the entire filtered set
      setStats({
        total: filtered.length,
        userActions: filtered.filter(l => l.userName !== 'System').length,
        systemActions: filtered.filter(l => l.userName === 'System').length,
        securityEvents: filtered.filter(l => l.module === 'SECURITY').length
      });

    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      if (logs.length === 0) return;

      const headers = ['Date', 'Time', 'User', 'Role', 'Action', 'Module', 'Target', 'Details', 'IP Address'];
      const csvData = logs.map(log => {
        const { date, time } = formatSafeDate(log.timestamp);
        return [
          date,
          time,
          log.userName || 'N/A',
          log.role || 'Admin',
          log.action || 'N/A',
          log.module || 'N/A',
          log.facilityName || log.targetName || 'N/A',
          (log.description || '').replace(/,/g, ';'), // Sanitize commas
          log.ipAddress || 'N/A'
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvData].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Audit_Logs_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (newPage > currentPage && !hasMore)) return;
    fetchLogs(newPage);
  };

  const formatSafeDate = (ts) => {
    try {
      if (!ts) return { date: 'Pending', time: 'Just now' };
      
      let dateObj;
      if (ts.seconds) {
        dateObj = new Date(ts.seconds * 1000);
      } else if (ts.toDate && typeof ts.toDate === 'function') {
        dateObj = ts.toDate();
      } else if (ts instanceof Date) {
        dateObj = ts;
      } else {
        dateObj = new Date(ts);
      }

      if (isNaN(dateObj.getTime())) {
        return { date: 'Recent', time: 'Just now' };
      }

      return {
        date: dateObj.toLocaleDateString('en-GB'),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      };
    } catch (e) {
      return { date: 'Recent', time: 'Just now' };
    }
  };

  const getModuleBadge = (mod) => {
    switch (mod) {
      case 'CLINICAL': return 'bg-blue-50 text-blue-600';
      case 'FINANCIAL': return 'bg-emerald-50 text-emerald-600';
      case 'PHARMACY': return 'bg-purple-50 text-purple-600';
      case 'SECURITY': return 'bg-rose-50 text-rose-600';
      case 'GOVERNANCE': return 'bg-indigo-50 text-indigo-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const getActionDot = (action) => {
    if (!action) return 'bg-slate-300';
    const lower = action.toLowerCase();
    if (lower.includes('approved') || lower.includes('success') || lower.includes('created') || lower.includes('seed')) return 'bg-emerald-500';
    if (lower.includes('changed') || lower.includes('updated') || lower.includes('viewed') || lower.includes('plan')) return 'bg-blue-500';
    if (lower.includes('failed') || lower.includes('error') || lower.includes('suspended')) return 'bg-rose-500';
    return 'bg-slate-400';
  };

  const kpis = [
    { label: 'Total Matches', value: stats.total, subtitle: 'Filtered list', icon: FileText, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'User Actions', value: stats.userActions, subtitle: 'In current view', icon: User, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'System Actions', value: stats.systemActions, subtitle: 'In current view', icon: Settings, bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: 'Security Events', value: stats.securityEvents, subtitle: 'In current view', icon: ShieldAlert, bg: 'bg-orange-50', color: 'text-orange-600' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Logs</h1>
            <p className="text-sm font-normal text-slate-500">Track all important actions and changes across the platform.</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-[11px] font-medium uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
             <Download className="h-4 w-4" /> Export Logs
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-lg transition-all duration-300"
            >
              <div className={`h-14 w-14 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                <kpi.icon className="h-7 w-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-500 truncate leading-none">{kpi.label}</span>
                <span className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight leading-none">{kpi.value}</span>
                <span className="text-xs font-normal text-slate-400 mt-1.5 italic leading-none">{kpi.subtitle}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
           {/* Date Range Selector */}
           <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                 <Calendar className="h-4 w-4" />
              </div>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="pl-11 pr-10 py-2.5 bg-slate-50 border border-transparent rounded-xl text-[11px] font-normal text-slate-600 outline-none hover:bg-slate-100 transition-all cursor-pointer appearance-none uppercase tracking-widest"
              >
                <option>Jun 1, 2026 - Jun 7, 2026</option>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
           </div>

           {/* Filter Selects */}
           {[
             { value: filterAction, setter: setFilterAction, options: ['All Actions', 'Organization Approved', 'Plan Changed', 'Payment Succeeded', 'Document Viewed', 'User Created', 'Failed Login Attempt', 'Organization Suspended'], icon: Activity },
             { value: filterUser, setter: setFilterUser, options: uniqueUsers, icon: User },
             { value: filterModule, setter: setFilterModule, options: ['All Modules', 'CLINICAL', 'FINANCIAL', 'PHARMACY', 'SECURITY', 'GOVERNANCE', 'ORGANIZATIONS', 'SUBSCRIPTIONS', 'BILLING'], icon: Box },
             { value: filterOrg, setter: setFilterOrg, options: organizations, icon: Globe }
           ].map((filter, i) => (
             <div key={i} className="relative group min-w-[150px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                   <filter.icon className="h-4 w-4" />
                </div>
                <select 
                  value={filter.value}
                  onChange={(e) => filter.setter(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-transparent rounded-xl text-[11px] font-normal text-slate-600 outline-none hover:bg-slate-100 transition-all cursor-pointer appearance-none uppercase tracking-widest"
                >
                  {filter.options.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
             </div>
           ))}

           {/* Live Search */}
           <div className="flex-1 min-w-[200px] relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl text-sm font-normal focus:ring-2 focus:ring-blue-50/20 outline-none transition-all placeholder:text-slate-400"
              />
           </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative min-h-[500px]">
           {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                 <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
              </div>
           )}

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-slate-50">
                       <th className="pl-8 pr-6 py-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Date & Time</th>
                       <th className="px-6 py-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest">User</th>
                       <th className="px-6 py-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Action</th>
                       <th className="px-6 py-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Module</th>
                       <th className="px-6 py-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Target</th>
                       <th className="px-6 py-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Details</th>
                       <th className="px-6 py-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest">IP Address</th>
                       <th className="pl-6 pr-8 py-6 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {logs.length > 0 ? logs.map((log, idx) => (
                       <motion.tr 
                         key={log.id} 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ delay: idx * 0.02 }}
                         className="group hover:bg-slate-50/50 transition-all duration-200"
                       >
                          <td className="pl-8 pr-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300">
                                   <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                   <p className="text-sm font-normal text-slate-900 leading-tight">
                                      {formatSafeDate(log.timestamp).date}
                                   </p>
                                   <p className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                                      {formatSafeDate(log.timestamp).time}
                                   </p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2.5">
                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-medium ${log.userName === 'System' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                                   {log.userName?.split(' ').map(n => n[0]).join('') || 'U'}
                                </div>
                                <div>
                                   <p className="text-sm font-normal text-slate-900 leading-none mb-0.5">{log.userName || 'Anonymous'}</p>
                                   <p className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                                      {log.role || 'Admin'}
                                   </p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${getActionDot(log.action)}`} />
                                <span className="text-sm font-normal text-slate-900">{log.action}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-widest ${getModuleBadge(log.module)}`}>
                                {log.module}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="space-y-0.5">
                                <p className="text-sm font-normal text-slate-900 leading-none">{log.facilityName || log.targetName || 'N/A'}</p>
                                <p className="text-[10px] font-normal text-slate-400">{log.facilityEmail || log.targetId || ''}</p>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-sm text-slate-500 font-normal line-clamp-1 max-w-[200px]">
                                {log.description}
                             </p>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-[11px] font-mono font-normal text-slate-400">
                                {log.ipAddress || '197.248.23.10'}
                             </span>
                          </td>
                          <td className="pl-6 pr-8 py-4 text-right">
                             <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                <MoreVertical className="h-4 w-4" />
                             </button>
                          </td>
                       </motion.tr>
                    )) : (
                       <tr>
                          <td colSpan="8" className="py-20 text-center">
                             <div className="space-y-4">
                                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto">
                                   <History className="h-8 w-8" />
                                </div>
                                <div>
                                   <p className="text-sm font-medium text-slate-900">No activity logs found</p>
                                   <p className="text-xs text-slate-400 mt-1">Immutable trail will appear here as users interact with the platform.</p>
                                </div>
                                <button 
                                  onClick={async () => {
                                    setLoading(true);
                                    await auditService.logActivity({
                                      userName: userData.name,
                                      userId: userData.uid,
                                      action: 'INITIAL_LOG_SEED',
                                      module: 'GOVERNANCE',
                                      description: 'System audit trail initialized successfully.'
                                    });
                                    fetchLogs(1);
                                  }}
                                  className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors"
                                >
                                   Seed First Audit Log
                                </button>
                             </div>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>

           {/* Pagination */}
           <div className="px-8 py-6 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                 Page {currentPage} {hasMore ? '(More Available)' : '(End of Logs)'}
              </p>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => handlePageChange(currentPage - 1)}
                   disabled={currentPage === 1 || loading}
                   className="h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-30 shadow-sm transition-all"
                 >
                    <ChevronLeft className="h-4 w-4" /> Prev
                 </button>
                 
                 <div className="flex items-center justify-center h-10 w-10 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200">
                    {currentPage}
                 </div>

                 <button 
                   onClick={() => handlePageChange(currentPage + 1)}
                   disabled={!hasMore || loading}
                   className="h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-30 shadow-sm transition-all"
                 >
                    Next <ChevronRight className="h-4 w-4" />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
