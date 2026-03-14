import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import auditService from '../../services/auditService';
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
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const { logs: newLogs, lastDoc } = await auditService.getRecentLogs(20, null, isLoadMore ? lastVisible : null);
      
      if (isLoadMore) {
        setLogs(prev => [...prev, ...newLogs]);
      } else {
        setLogs(newLogs);
      }

      setLastVisible(lastDoc);
      setHasMore(newLogs.length === 20);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setLastVisible(null);
    setHasMore(true);
    fetchLogs(false);
  };

  const filteredLogs = logs.filter(log => {
     const matchesSearch = 
        log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchQuery.toLowerCase());
     
     const matchesModule = filterModule === 'All' || log.module === filterModule;
     
     return matchesSearch && matchesModule;
  });

  const getModuleColor = (mod) => {
    switch (mod) {
      case 'CLINICAL': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'FINANCIAL': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PHARMACY': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'SECURITY': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <History className="h-8 w-8 text-primary-600" />
              Global Audit Trail
            </h1>
            <p className="text-slate-500 mt-1 font-medium italic">Immutable oversight of all platform and clinic operations.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-semibold uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> System Guard Active
             </div>
             <button 
               onClick={fetchLogs}
               className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-slate-50 transition-all shadow-sm"
             >
               <Activity className="h-5 w-5" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
           {/* Filters Sidebar */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                 <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3 block">Search Events</label>
                    <div className="relative">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <input 
                         type="text"
                         placeholder="User, action, desc..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm font-medium transition-all outline-none"
                       />
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3 block">Filter by Module</label>
                    <div className="space-y-2">
                       {['All', 'CLINICAL', 'FINANCIAL', 'PHARMACY', 'SECURITY', 'GOVERNANCE'].map(mod => (
                         <button 
                           key={mod}
                           onClick={() => setFilterModule(mod)}
                           className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium transition-all
                             ${filterModule === mod ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                           `}
                         >
                           {mod}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-xl overflow-hidden relative">
                 <div className="relative z-10">
                    <h4 className="text-sm font-medium tracking-tight mb-2">Compliance Alert</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                       All audit logs are cryptographically signed and immutable. Deletion is prohibited by platform security policy.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase text-red-400">
                       <AlertCircle className="h-4 w-4" /> High Priority Only
                    </div>
                 </div>
                 <div className="absolute -right-8 -top-8 h-32 w-32 bg-primary-500/10 rounded-full blur-2xl" />
              </div>
           </div>

           {/* Logs Feed */}
           <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  {loading && !loadingMore ? 'Loading...' : `${filteredLogs.length} event${filteredLogs.length !== 1 ? 's' : ''} shown`}
                </span>
              </div>
              {loading && !loadingMore ? (
                <div className="p-20 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs italic">Parsing global event stream...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="bg-white p-20 rounded-3xl border border-slate-100 shadow-sm text-center">
                   <ShieldAlert className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                   <h3 className="text-slate-900 font-medium">No Audit Events</h3>
                   <p className="text-slate-500 text-sm mt-1 font-medium">No activity matching your criteria was found.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {filteredLogs.map((log, i) => (
                       <motion.div 
                         key={log.id}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.05 }}
                         className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-6 group"
                       >
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 border ${getModuleColor(log.module)}`}>
                            {log.module === 'SECURITY' ? <ShieldAlert className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                   <p className="text-sm font-medium text-slate-900">{log.action}</p>
                                   <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-widest border ${getModuleColor(log.module)}`}>
                                     {log.module}
                                   </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                   <Clock className="h-3 w-3" />
                                   {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Recent'}
                                </div>
                             </div>
                             <p className="text-sm text-slate-600 font-medium mb-3 line-clamp-1">{log.description}</p>
                             <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                   <User className="h-3.5 w-3.5 text-slate-300" />
                                   {log.userName} (ID: {log.userId?.slice(-6)})
                                </div>
                                {log.metadata?.patientId && (
                                   <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                      <FileText className="h-3.5 w-3.5 text-slate-300" />
                                      Subject: {log.metadata.patientId}
                                   </div>
                                )}
                             </div>
                          </div>

                          <button className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-primary-600 transition-all">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                       </motion.div>
                    ))}
                  </div>

                  {hasMore && (
                    <div className="pt-8 flex justify-center">
                      <button
                        onClick={() => fetchLogs(true)}
                        disabled={loadingMore}
                        className="px-12 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Loading Events...
                          </>
                        ) : (
                          <>
                            <Activity className="h-3 w-3" />
                            Load More Events
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
