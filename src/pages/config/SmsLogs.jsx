import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
    FileText, CheckCircle2, AlertTriangle, Clock, RefreshCw, XCircle, Users, Filter, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import smsSettingsService from '../../services/smsSettingsService';
import facilityService from '../../services/facilityService';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmsLogs() {
  const { userData } = useAuth();
  const isSuperadmin = userData?.role === 'superadmin';
  
  const [selectedFacilityId, setSelectedFacilityId] = useState(isSuperadmin ? 'all' : userData?.facilityId);
  const [facilities, setFacilities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isSuperadmin) fetchFacilities();
  }, [isSuperadmin]);

  useEffect(() => {
    handleRefresh();
  }, [selectedFacilityId]);

  const fetchFacilities = async () => {
    try {
      const data = await facilityService.getAllFacilities();
      setFacilities(data || []);
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  const fetchLogs = async (isLoadMore = false) => {
    // Security Check: Non-admins must have a facilityId set
    if (!isSuperadmin && (!selectedFacilityId || selectedFacilityId === 'all')) {
        setLogs([]);
        setLoading(false);
        setHasMore(false);
        return;
    }

    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const PAGE_SIZE = 20;
      const { logs: newLogs, lastDoc } = await smsSettingsService.getLogs(selectedFacilityId, PAGE_SIZE, isLoadMore ? lastVisible : null);
      
      if (isLoadMore) {
        setLogs(prev => [...prev, ...newLogs]);
      } else {
        setLogs(newLogs);
      }

      setLastVisible(lastDoc);
      setHasMore(newLogs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load SMS logs", err);
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

  const getStatusIcon = (status, retried) => {
    const s = status?.toLowerCase();
    if (s === 'success' || s === 'sent' || s === 'delivered') {
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    if (s === 'failed' || s === 'rejected' || s === 'userinblacklist' || s === 'invalidphonenumber') {
        return retried 
            ? <RefreshCw className="h-4 w-4 text-amber-500" /> 
            : <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-slate-400" />;
  };

  const getStatusBadge = (status, retried) => {
    const s = status?.toLowerCase();
    if (s === 'success' || s === 'sent' || s === 'delivered') {
        return <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">{status}</span>;
    }
    if (s === 'failed' || s === 'rejected' || s === 'userinblacklist' || s === 'invalidphonenumber') {
        return (
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${retried ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                {retried ? `${status} (Retried)` : status}
            </span>
        );
    }
    return <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">{status || 'Pending'}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary-600" />
              SMS Delivery Logs
            </h1>
            <p className="text-slate-500 mt-1">Track Africa's Talking SMS delivery statuses and patient replies.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {isSuperadmin && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <select 
                        value={selectedFacilityId}
                        onChange={(e) => setSelectedFacilityId(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-700 outline-none min-w-[150px]"
                    >
                        <option value="all">Global (All Clinics)</option>
                        {facilities.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
            )}
            <button 
                onClick={handleRefresh}
                className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                title="Refresh Logs"
            >
                <RefreshCw className={`h-5 w-5 ${loading && !loadingMore ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest rounded-tl-[2rem]">Date & Time</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient</th>
                            {isSuperadmin && <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinic</th>}
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Type</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direction</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest rounded-tr-[2rem]">Status & Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && !loadingMore ? (
                            <tr>
                                <td colSpan={isSuperadmin ? 7 : 6} className="py-12 text-center text-slate-400 text-sm font-medium italic">
                                    Loading SMS logs...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={isSuperadmin ? 7 : 6} className="py-12 text-center">
                                    <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium text-sm">No SMS records found.</p>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const dateObj = log.sentAt?.toDate?.() || log.receivedAt?.toDate?.() || new Date();
                                const isIncoming = log.type === 'incoming';
                                const facility = facilities.find(f => f.id === log.facilityId);

                                return (
                                <motion.tr 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={log.id} 
                                    className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group"
                                >
                                    <td className="py-4 px-6">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-slate-300" />
                                            <span className="text-sm font-medium text-slate-800 font-mono tracking-tight">{isIncoming ? log.from : log.to}</span>
                                        </div>
                                    </td>
                                    {isSuperadmin && (
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-semibold text-slate-500">
                                                {facility?.name || 'Platform'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="py-4 px-6 text-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                                            {log.type?.replace('_', ' ') || 'misc'}
                                        </span>
                                        {log.provider_message_id && (
                                            <p className="text-[9px] text-slate-300 font-mono mt-1 select-all" title="Provider Message ID">
                                                ID: {log.provider_message_id.substring(0, 8)}...
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        {isIncoming ? (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                                Incoming
                                            </span>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md w-fit">
                                                    Outgoing
                                                </span>
                                                {log.updatedAt && (
                                                    <span className="text-[8px] text-slate-400 font-medium">
                                                        Updated: {log.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-xs text-slate-600 line-clamp-2 max-w-sm group-hover:line-clamp-none transition-all">
                                            {log.body}
                                        </p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {isIncoming ? (
                                                     <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border border-indigo-100">Received</span>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(log.delivery_status, log.retried)}
                                                            {getStatusBadge(log.delivery_status, log.retried)}
                                                        </div>
                                                        {log.delivery_status === 'Success' && (
                                                            <span className="text-[9px] text-amber-500 font-bold italic">Carrier Pending...</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {(log.failureReason || log.error) && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-medium">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {log.failureReason || log.error}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                                )})
                        )}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div className="p-8 flex justify-center border-t border-slate-50 bg-slate-50/30">
                    <button
                        onClick={() => fetchLogs(true)}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-3 w-3" />
                                Load More Logs
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>

      </div>
    </DashboardLayout>
  );
}
