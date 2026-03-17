import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import appointmentService from '../../services/appointmentService';
import medicalRecordService from '../../services/medicalRecordService';
import auditService from '../../services/auditService';
import { 
  Activity, 
  Search, 
  CheckCircle2, 
  Clock, 
  User,
  CreditCard,
  FileText,
  DollarSign,
  Receipt,
  RotateCcw,
  X,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentCollectionModal from '../../components/modals/PaymentCollectionModal';

export default function BillingQueue() {
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, [userData]);

  const fetchQueue = async () => {
    if (!userData?.facilityId) return;
    try {
      setLoading(true);
      const data = await appointmentService.getBillingQueue(userData.facilityId);
      setQueue(data);
    } catch (err) {
      console.error(err);
      toastError('Failed to load billing queue.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = queue.filter(apt => {
    const searchLow = searchTerm.toLowerCase();
    if (searchLow) {
      return (
        apt.patient?.toLowerCase().includes(searchLow) || 
        apt.patientId?.toLowerCase().includes(searchLow)
      );
    }

    if (activeTab === 'Pending') {
      return apt.status === 'awaiting-billing';
    } else {
      return apt.status === 'billed' || apt.status === 'paid' || apt.status === 'completed';
    }
  });

  const handleAction = (apt) => {
    setSelectedPatient(apt);
    setIsPaymentOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Collection Registry
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Reconcile payments & finalize patient accounts</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 p-1 rounded-xl">
                {['Pending', 'History'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
          </div>
        </div>

        <div className="bg-white border-b border-slate-100 p-1 flex flex-col sm:flex-row gap-2 items-center">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="text"
                placeholder="Search by Patient Name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-transparent focus:bg-white focus:border-blue-100 rounded-xl text-sm font-medium outline-none transition-all"
              />
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-slate-50/30">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient & Account</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrival</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultant</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan="5" className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest animate-pulse">Syncing Collection Data...</td>
                </tr>
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-300">
                    <CheckCircle2 className="h-10 w-10 mx-auto opacity-20 mb-3" />
                     <p className="text-xs font-bold uppercase tracking-widest opacity-40">Account List Clear</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map(apt => (
                  <tr key={apt.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{apt.patient}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{apt.patientId}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-bold text-slate-600 text-xs">
                       {apt.date} <span className="text-[9px] text-slate-300 ml-1">{apt.time || 'W.IN'}</span>
                    </td>
                    <td className="py-5 px-6 font-semibold text-slate-600 text-xs text-primary-600">
                       Dr. {apt.providerName || apt.doctor || 'N/A'}
                    </td>
                    <td className="py-5 px-6">
                      {apt.status === 'awaiting-billing' ? (
                        <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1.5 w-fit">
                          <Clock className="h-2.5 w-2.5" /> Awaiting
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 w-fit">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Finalized
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6 text-right">
                      {activeTab === 'Pending' ? (
                        <button 
                          onClick={() => handleAction(apt)}
                          className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 float-right"
                        >
                          <DollarSign className="h-3 w-3" /> Collect & Clear
                        </button>
                      ) : (
                        <div className="flex justify-end gap-2">
                           <button className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm shadow-slate-50">
                              <Receipt className="h-4 w-4" />
                           </button>
                           <div className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-200">
                              <ChevronRight className="h-4 w-4" />
                           </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentCollectionModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        appointment={selectedPatient}
        type="consultation"
        onSuccess={() => {
          setIsPaymentOpen(false);
          fetchQueue();
          success("Payment collected and patient cleared.");
        }}
      />
    </DashboardLayout>
  );
}
