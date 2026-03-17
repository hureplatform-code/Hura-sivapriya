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
  Stethoscope, 
  ChevronRight, 
  Pill, 
  FileText,
  User,
  ActivityIcon,
  ShoppingBag,
  HeartPulse,
  RotateCcw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PharmacyQueue() {
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [statusFilter, setStatusFilter] = useState('Pending');
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalRecord, setClinicalRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [userData]);

  const fetchQueue = async () => {
    if (!userData?.facilityId) return;
    try {
      setLoading(true);
      const data = await appointmentService.getPharmacyQueue(userData.facilityId);
      setQueue(data);
    } catch (err) {
      console.error(err);
      toastError('Failed to load pharmacy queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (appointment) => {
    setSelectedPatient(appointment);
    setClinicalRecord(null);
    setLoadingRecord(true);
    try {
      const record = await medicalRecordService.getRecordByAppointment(appointment.id);
      setClinicalRecord(record);
    } catch (err) {
      console.error(err);
      toastError('Failed to load prescription data.');
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleDispense = async (status) => {
    if (!selectedPatient) return;
    try {
      await appointmentService.updateAppointmentStatus(selectedPatient.id, status);
      
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Pharmacist',
        action: 'DISPENSE_MEDICATION',
        module: 'PHARMACY',
        description: `Dispensed medication for ${selectedPatient.patient} and routed to ${status}`,
        metadata: {
          appointmentId: selectedPatient.id,
          patientId: selectedPatient.patientId,
          facilityId: userData?.facilityId
        }
      });
      
      success(`Patient successfully routed to ${status.replace('-', ' ')}`);
      setSelectedPatient(null);
      setClinicalRecord(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
      toastError('Failed to route patient.');
    }
  };

  const filteredQueue = queue.filter(apt => {
    const searchLow = searchTerm.toLowerCase();
    if (searchLow) {
      return (
        apt.patient?.toLowerCase().includes(searchLow) || 
        apt.patientId?.toLowerCase().includes(searchLow) ||
        apt.patientPhone?.includes(searchTerm)
      );
    }

    const isPending = apt.status === 'awaiting-pharmacy' || apt.status === 'awaiting-billing';
    const isCompleted = apt.status === 'completed' || apt.status === 'paid';
    
    if (statusFilter === 'Pending' && !isPending) return false;
    if (statusFilter === 'Dispensed' && !isCompleted) return false;

    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pharmacy Registry</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Dispense medication & track pharmacological orders</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 p-1 rounded-xl">
                {['Pending', 'Dispensed'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      statusFilter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
                placeholder="Search by Patient, ID or Phone..."
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
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity & OP#</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrival</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescribing Dr.</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest animate-pulse">Synchronizing Queue...</td>
                </tr>
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-300">
                    <CheckCircle2 className="h-10 w-10 mx-auto opacity-20 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">All Caught Up</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map(apt => (
                  <tr key={apt.id} onClick={() => handleSelectPatient(apt)} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{apt.patient}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{apt.patientId}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-bold text-slate-600 text-xs">
                      {apt.date?.split('-').reverse().join('-')} <span className="text-[9px] text-slate-300 ml-1">{apt.time || 'W.IN'}</span>
                    </td>
                    <td className="py-5 px-6 font-semibold text-slate-600 text-xs text-primary-600">
                      Dr. {apt.providerName || apt.doctor || 'N/A'}
                    </td>
                    <td className="py-5 px-6">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        apt.status === 'awaiting-pharmacy' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                        apt.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {apt.status === 'awaiting-pharmacy' ? 'Awaiting' : apt.status}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <button className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-primary-500 group-hover:border-primary-100 transition-all shadow-sm">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispensing Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedPatient.patient}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Prescription Details & Dispensing Order</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-10 max-h-[70vh] overflow-y-auto">
                {loadingRecord ? (
                   <div className="py-20 text-center space-y-4">
                      <Activity className="h-8 w-8 text-primary-500 animate-spin mx-auto" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Acquiring Clinical Record...</p>
                   </div>
                ) : clinicalRecord ? (
                   <div className="space-y-8">
                      <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100/50">
                        <div className="flex items-center gap-3 mb-6">
                           <Pill className="h-6 w-6 text-amber-600" />
                           <h3 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Medication Orders</h3>
                        </div>
                        <p className="text-amber-900 leading-relaxed font-bold whitespace-pre-wrap text-base">
                           {clinicalRecord.plan || "No specific medication orders recorded."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 rounded-[2rem] p-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Diagnosis</h4>
                           <p className="text-xs font-bold text-slate-600 leading-relaxed">{clinicalRecord.assessment || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-[2rem] p-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Vitals Reference</h4>
                           <div className="grid grid-cols-3 gap-2">
                              {['temp', 'bp', 'weight'].map(k => (
                                <div key={k} className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                                   <p className="text-[8px] font-bold text-slate-300 uppercase">{k}</p>
                                   <p className="text-xs font-bold text-slate-700">{selectedPatient.vitals?.[k] || '—'}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                   </div>
                ) : (
                  <div className="py-20 text-center opacity-40">
                    <FileText className="h-10 w-10 mx-auto mb-4" />
                    <p className="text-xs font-bold uppercase">No prescription found</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-4">
                  <button 
                    onClick={() => handleDispense('completed')}
                    className="px-8 py-4 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                  >
                     Dispense & Discharge
                  </button>
                  <button 
                    onClick={() => handleDispense('awaiting-billing')}
                    className="px-8 py-4 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                     Dispense & Route to Billing
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
