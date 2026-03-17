import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import appointmentService from '../../services/appointmentService';
import { 
  Search, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  RotateCcw,
  Phone,
  Printer,
  CreditCard,
  Plus,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LabReport, PrintStyles } from '../../components/printing/PrintTemplates';
import { TEST_CATALOG } from './LabEntry';
import PaymentCollectionModal from '../../components/modals/PaymentCollectionModal';
import AppointmentModal from '../../components/modals/AppointmentModal';

export default function LaboratoryQueue() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [printApt, setPrintApt] = useState(null);
  const [selectedApt, setSelectedApt] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [userData]);

  const fetchQueue = async () => {
    if (!userData?.facilityId) return;
    try {
      setLoading(true);
      const data = await appointmentService.getLaboratoryData(userData.facilityId);
      setQueue(data);
    } catch (err) {
      console.error(err);
      toastError('Failed to load laboratory queue.');
    } finally {
      setLoading(false);
    }
  };

  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'All': return true;
      case 'Today':
        return date >= today;
      case 'Yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return date >= yesterday && date < today;
      case 'This Week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return date >= startOfWeek;
      case 'Last Week':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay());
        return date >= lastWeekStart && date < lastWeekEnd;
      case 'This Month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case 'Last Month':
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      case 'This Year':
        return date.getFullYear() === now.getFullYear();
      case 'Last Year':
        return date.getFullYear() === now.getFullYear() - 1;
      case 'Custom':
        if (!customDates.start || !customDates.end) return true;
        const start = new Date(customDates.start);
        const end = new Date(customDates.end);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      default: return true;
    }
  };

  const filteredQueue = queue.filter(apt => {
    const searchLow = searchTerm.trim().toLowerCase();
    
    // OMNI-SEARCH LOGIC: If user is typing, bypass Status Tab and Date filters
    if (searchLow !== '') {
      return (
        apt.patient?.toLowerCase().includes(searchLow) || 
        apt.patientId?.toLowerCase().includes(searchLow) ||
        apt.patientPhone?.includes(searchTerm) ||
        apt.phoneNumber?.includes(searchTerm)
      );
    }

    // REGULAR BROADCAST/TAB LOGIC (When not searching)
    const isPending = apt.status === 'awaiting-lab';
    const isCompleted = ['completed', 'arrived', 'awaiting-billing', 'billed', 'paid'].includes(apt.status) || apt.labCompletedAt;
    
    const matchesStatus = statusFilter === 'Pending' ? isPending : isCompleted;
    if (!matchesStatus) return false;

    const matchesDate = isDateInRange(apt.date);
    
    return matchesDate;
  });

  const handlePrint = (apt) => {
    setPrintApt(apt);
    // Give react time to render the hidden print content
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <DashboardLayout>
      <PrintStyles />
      {/* Hidden Print Container */}
      <div className="print-only">
        {printApt && (
          <LabReport 
            data={printApt} 
            facility={userData || {}} 
            catalog={TEST_CATALOG} 
          />
        )}
      </div>

      <div className="space-y-6 no-print">
        {/* Simplified Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Laboratory Registry
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Manage diagnostics & high-precision reporting</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 p-1 rounded-xl">
                {['Pending', 'Completed'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      statusFilter === tab 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
             </div>
             <button 
               onClick={fetchQueue}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
             >
               <RotateCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Sync Queue
             </button>
             <button 
               onClick={() => setIsApptModalOpen(true)}
               className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
             >
               <Plus className="h-3 w-3" /> New Walk-in Lab
             </button>
          </div>
        </div>

        {/* Hyper-Minimal Filters */}
        <div className="bg-white border-b border-slate-100 p-1 flex flex-col sm:flex-row gap-2 items-center">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="text"
                placeholder="Search by Patient, ID or Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-transparent focus:bg-white focus:border-blue-100 rounded-xl text-sm font-medium outline-none transition-all"
              />
           </div>
           
           <div className="flex gap-2 items-center w-full sm:w-auto">
             <div className="relative w-full sm:w-auto">
               <select 
                 value={dateFilter}
                 onChange={(e) => setDateFilter(e.target.value)}
                 className="w-full pl-4 pr-10 py-3 bg-slate-50/50 border border-transparent focus:bg-white focus:border-blue-100 rounded-xl text-xs font-bold uppercase tracking-wider appearance-none outline-none cursor-pointer"
               >
                 {['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month', 'This Year', 'Last Year', 'Custom', 'All'].map(f => (
                   <option key={f} value={f}>{f}</option>
                 ))}
               </select>
               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
             </div>

             <AnimatePresence>
               {dateFilter === 'Custom' && (
                 <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-1">
                   <input 
                     type="date"
                     value={customDates.start}
                     onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                     className="px-2 py-3 bg-slate-50/50 border border-transparent rounded-xl text-[10px] font-bold outline-none focus:bg-white focus:border-blue-100"
                   />
                   <input 
                     type="date"
                     value={customDates.end}
                     onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                     className="px-2 py-3 bg-slate-50/50 border border-transparent rounded-xl text-[10px] font-bold outline-none focus:bg-white focus:border-blue-100"
                   />
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-slate-50/30">
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Identity & OP#</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Contact</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Arrival</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Attending Dr.</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Entry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-32 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="h-8 w-8 border-2 border-slate-100 border-t-blue-500 rounded-full animate-spin" />
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.25em]">Synchronizing Registry</p>
                       </div>
                    </td>
                  </tr>
                ) : filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-32 text-center text-slate-300">
                       <CheckCircle2 className="h-10 w-10 mx-auto opacity-20 mb-3" />
                       <p className="text-xs font-bold uppercase tracking-widest opacity-40">No records found</p>
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((apt) => (
                    <motion.tr 
                      key={apt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/lab/entry/${apt.id}`)}
                    >
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-900 text-sm leading-tight">{apt.patient}</span>
                           <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{apt.patientId || 'OP-NEW'}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-slate-500">
                           <Phone className="h-3 w-3 opacity-30" />
                           <span className="text-[11px] font-semibold tabular-nums tracking-tight">{apt.patientPhone || apt.phoneNumber || '---'}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className="text-[11px] font-bold text-slate-700 tabular-nums">{apt.date?.split('-').reverse().join('-')}</span>
                        <span className="text-[8px] font-black text-slate-300 ml-2 uppercase">{apt.time || 'W.IN'}</span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-bold text-slate-600">Dr. {apt.provider || apt.doctor || 'N/A'}</span>
                      </td>
                      <td className="py-5 px-6">
                        {(() => {
                          const s = apt.status;
                          if (s === 'awaiting-lab') return <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">Pending</span>;
                          if (s === 'awaiting-billing') return <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-100 flex items-center gap-1.5 w-fit"><CreditCard className="h-2.5 w-2.5" /> Billing</span>;
                          if (s === 'billed') return <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">Billed</span>;
                          if (s === 'paid') return <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 w-fit"><CheckCircle2 className="h-2.5 w-2.5" /> Paid</span>;
                          if (s === 'completed') return <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Finalized</span>;
                          if (s === 'arrived') return <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">Clinical Queue</span>;
                          return <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">{s}</span>;
                        })()}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(['completed', 'arrived', 'awaiting-billing', 'billed', 'paid'].includes(apt.status) || apt.labCompletedAt) && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); handlePrint(apt); }}
                              title="Print Report"
                              className="h-8 w-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm active:scale-90"
                            >
                               <Printer className="h-3.5 w-3.5" />
                            </div>
                          )}
                          {apt.status === 'awaiting-lab' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedApt(apt); setIsPaymentOpen(true); }}
                              className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                            >
                               <Play className="h-3 w-3" /> Start & Collect
                            </button>
                          )}
                          <div className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:border-blue-100 transition-all shadow-sm active:scale-90">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <PaymentCollectionModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        appointment={selectedApt}
        type="investigation"
        onSuccess={() => {
          // If it was awaiting-lab, it stays awaiting-lab but now has an invoice
          // Or we move it to a status that indicates payment is done if we have one.
          // For now, let's just keep it in queue but show it's ready.
          setIsPaymentOpen(false);
          fetchQueue();
          navigate(`/lab/entry/${selectedApt.id}`);
        }}
      />

      <AppointmentModal 
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        onSave={async (data) => {
          const newApt = await appointmentService.bookAppointment({ ...data, status: 'awaiting-lab' });
          setIsApptModalOpen(false);
          setSelectedApt(newApt);
          setIsPaymentOpen(true);
        }}
      />
    </DashboardLayout>
  );
}
