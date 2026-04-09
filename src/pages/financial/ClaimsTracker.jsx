import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Download, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  X,
  FileText,
  Activity,
  History,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import claimService from '../../services/claimService';
import { useAuth } from '../../contexts/AuthContext';

export default function ClaimsTracker() {
  const { userData } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    fetchClaims();
  }, [userData?.facilityId]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await claimService.getAllClaims(userData?.facilityId);
      setClaims(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (claimId, newStatus) => {
    try {
      await claimService.updateClaimStatus(claimId, newStatus, userData);
      fetchClaims();
      setActiveMenu(null);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredClaims = claims.filter(c => 
    (filterStatus === 'All' || c.status === filterStatus) &&
    (c.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100';
      case 'Submitted Manual': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Ready': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <DashboardLayout title="Insurance Claims Tracker">
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <StatusCard label="Total Claims" value={claims.length} icon={<Briefcase className="h-5 w-5" />} color="text-slate-900" bg="bg-white" />
           <StatusCard label="Pending Submission" value={claims.filter(c => c.status === 'Ready').length} icon={<Clock className="h-5 w-5" />} color="text-indigo-600" bg="bg-indigo-50/50" />
           <StatusCard label="Active Claims" value={claims.filter(c => c.status === 'Submitted Manual').length} icon={<Activity className="h-5 w-5" />} color="text-blue-600" bg="bg-blue-50/50" />
           <StatusCard label="Paid Claims" value={claims.filter(c => c.status === 'Paid').length} icon={<CheckCircle2 className="h-5 w-5" />} color="text-emerald-600" bg="bg-emerald-50/50" />
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by Patient or Invoice #" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-xs font-bold outline-none transition-all shadow-inner"
                />
            </div>
            <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                {['All', 'Ready', 'Submitted Manual', 'Paid', 'Rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                            ${filterStatus === status ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-left">
                            <th className="py-6 px-8">Claim Info</th>
                            <th className="py-6 px-4">Patient</th>
                            <th className="py-6 px-4">Provider</th>
                            <th className="py-6 px-4">Amount</th>
                            <th className="py-6 px-4">Status</th>
                            <th className="py-6 px-8 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="py-8 px-8"><div className="h-4 bg-slate-100 rounded-full w-2/3 mx-auto" /></td>
                                </tr>
                            ))
                        ) : filteredClaims.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <Briefcase className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">No Claims Found</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Start by preparing a claim from the Billing screen.</p>
                                </td>
                            </tr>
                        ) : filteredClaims.map(claim => (
                            <tr key={claim.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-6 px-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-primary-600 transition-all shadow-inner">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">#{claim.invoiceNo}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                Added {new Date(claim.createdAt?.seconds * 1000).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-6 px-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{claim.patientName}</p>
                                        <p className="text-[10px] font-medium text-slate-400 uppercase">ID: {claim.patientId?.slice(0,8)}</p>
                                    </div>
                                </td>
                                <td className="py-6 px-4">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                        {claim.insuranceProvider}
                                    </span>
                                </td>
                                <td className="py-6 px-4">
                                    <p className="text-sm font-black text-slate-900">{claim.currency || 'KES'} {parseFloat(claim.totalAmount).toLocaleString()}</p>
                                </td>
                                <td className="py-6 px-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(claim.status)}`}>
                                        {claim.status}
                                    </span>
                                </td>
                                <td className="py-6 px-8 text-right">
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveMenu(activeMenu === claim.id ? null : claim.id)}
                                            className="p-2.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-slate-100"
                                        >
                                            <MoreVertical className="h-4.5 w-4.5" />
                                        </button>

                                        <AnimatePresence>
                                            {activeMenu === claim.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 overflow-hidden"
                                                    >
                                                        <p className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 mb-1">Update Claim Status</p>
                                                        
                                                        <StatusButton label="Mark as Submitted" status="Submitted Manual" current={claim.status} icon={<History className="h-4 w-4" />} color="text-blue-600" onClick={() => handleUpdateStatus(claim.id, 'Submitted Manual')} />
                                                        <StatusButton label="Mark as Paid" status="Paid" current={claim.status} icon={<CheckCircle2 className="h-4 w-4" />} color="text-emerald-600" onClick={() => handleUpdateStatus(claim.id, 'Paid')} />
                                                        <StatusButton label="Mark as Rejected" status="Rejected" current={claim.status} icon={<X className="h-4 w-4" />} color="text-red-600" onClick={() => handleUpdateStatus(claim.id, 'Rejected')} />
                                                        
                                                        <div className="h-px bg-slate-50 my-1"></div>
                                                        <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest">
                                                            <Download className="h-4 w-4" /> Download Pack
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusCard({ label, value, icon, color, bg }) {
    return (
        <div className={`${bg} p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4`}>
            <div className={`h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className={`text-3xl font-black ${color} tracking-tight mt-1`}>{value}</p>
            </div>
        </div>
    );
}

function StatusButton({ label, status, current, icon, color, onClick }) {
    if (status === current) return null;
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold ${color} hover:bg-slate-50 transition-colors uppercase tracking-widest`}
        >
            {icon} {label}
        </button>
    );
}
