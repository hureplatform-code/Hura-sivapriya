import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
    FileText, CheckCircle2, AlertTriangle, Clock, RefreshCw, XCircle, Users 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import smsSettingsService from '../../services/smsSettingsService';
import { motion } from 'framer-motion';

export default function SmsLogs() {
  const { userData } = useAuth();
  const facilityId = userData?.facilityId || null;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [facilityId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await smsSettingsService.getLogs(facilityId, 100);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load SMS logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status, retried) => {
    if (status === 'Success' || status === 'Sent' || status === 'Delivered') {
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    if (status === 'Failed') {
        return retried 
            ? <RefreshCw className="h-4 w-4 text-amber-500" /> 
            : <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-slate-400" />;
  };

  const getStatusBadge = (status, retried) => {
    if (status === 'Success' || status === 'Sent' || status === 'Delivered') {
        return <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">{status}</span>;
    }
    if (status === 'Failed') {
        return (
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${retried ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                {retried ? 'Failed (Retried)' : 'Failed'}
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
          <button 
             onClick={fetchLogs}
             className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
          >
             <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-2">
            <div className="overflow-x-auto min-h-[60vh]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest rounded-tl-[2rem]">Date & Time</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Type</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direction</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/3">Content</th>
                            <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest rounded-tr-[2rem]">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="py-12 text-center text-slate-400 text-sm font-medium italic">
                                    Loading SMS logs...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-12 text-center">
                                    <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium text-sm">No SMS records found.</p>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const dateObj = log.sentAt?.toDate?.() || log.receivedAt?.toDate?.() || new Date();
                                const isIncoming = log.type === 'incoming';

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
                                    <td className="py-4 px-6">
                                        <span className="text-xs font-semibold text-slate-600 capitalize">
                                            {log.type?.replace('_', ' ') || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {isIncoming ? (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                                Inbound Reply
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                Outbound
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-xs text-slate-600 line-clamp-2 max-w-sm group-hover:line-clamp-none transition-all">
                                            {log.body}
                                        </p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            {isIncoming ? (
                                                 <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border border-indigo-100">Received</span>
                                            ) : (
                                                <>
                                                    {getStatusIcon(log.delivery_status, log.retried)}
                                                    {getStatusBadge(log.delivery_status, log.retried)}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
