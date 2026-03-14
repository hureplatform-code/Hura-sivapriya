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
  Receipt
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BillingQueue() {
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      const data = await appointmentService.getBillingQueue(userData.facilityId);
      setQueue(data);
    } catch (err) {
      console.error(err);
      toastError('Failed to load billing queue.');
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
      toastError('Failed to load patient records.');
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleDischarge = async () => {
    if (!selectedPatient) return;
    try {
      await appointmentService.updateAppointmentStatus(selectedPatient.id, 'completed');
      
      // Log audit
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Cashier',
        action: 'PAYMENT_COLLECTED_DISCHARGED',
        module: 'FINANCIAL',
        description: `Collected dues and discharged ${selectedPatient.patient}.`,
        metadata: {
          appointmentId: selectedPatient.id,
          patientId: selectedPatient.patientId,
          facilityId: userData?.facilityId
        }
      });
      
      success(`Payment settled. Patient successfully discharged.`);
      setSelectedPatient(null);
      setClinicalRecord(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
      toastError('Failed to complete billing.');
    }
  };

  const ArrayEmpty = queue.length === 0;
  const filteredQueue = queue.filter(apt => 
    apt.patient?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    apt.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-emerald-500" /> Billing Queue
            </h1>
            <p className="text-slate-500 font-medium mt-1">Settle invoices, collect payments, and finalize documentation.</p>
          </div>
          <button 
            onClick={fetchQueue}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Activity className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Billing Queue List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search by patient..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-white border-none shadow-sm focus:ring-2 focus:ring-emerald-100 rounded-[2rem] text-sm font-medium transition-all outline-none"
               />
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {loading ? (
                 <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm border-dashed">
                    <Activity className="h-8 w-8 text-slate-300 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Scanning Queue...</p>
                 </div>
              ) : filteredQueue.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm border-dashed">
                    <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-600">All cleared!</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">No patients are awaiting billing.</p>
                 </div>
              ) : (
                 filteredQueue.map((apt) => (
                    <motion.button
                       key={apt.id}
                       whileHover={{ x: 4 }}
                       onClick={() => handleSelectPatient(apt)}
                       className={`w-full text-left p-6 rounded-3xl border transition-all ${selectedPatient?.id === apt.id ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-200' : 'bg-white border-slate-100 hover:bg-slate-50 shadow-sm'}`}
                    >
                       <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                             <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${selectedPatient?.id === apt.id ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                <User className="h-6 w-6" />
                             </div>
                             <div>
                                <p className={`font-medium text-base ${selectedPatient?.id === apt.id ? 'text-white' : 'text-slate-900'}`}>{apt.patient}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${selectedPatient?.id === apt.id ? 'text-slate-400' : 'text-slate-500'}`}>{apt.patientId}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-orange-500 uppercase tracking-widest"><Clock className="h-3 w-3" /> Waiting</span>
                                </div>
                             </div>
                          </div>
                          <div className={`p-2 rounded-xl flex items-center justify-center ${selectedPatient?.id === apt.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                             <DollarSign className="h-5 w-5" />
                          </div>
                       </div>
                    </motion.button>
                 ))
              )}
            </div>
          </div>

          {/* Billing Workspace */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm min-h-[600px] flex flex-col overflow-hidden">
               {selectedPatient ? (
                  <>
                     <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div>
                           <h2 className="text-xl font-bold text-slate-900">{selectedPatient.patient}</h2>
                           <p className="text-sm font-medium text-slate-500 mt-1">
                              Consulted by Dr. {selectedPatient.providerName || 'Unknown'} • {selectedPatient.date}
                           </p>
                        </div>
                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-emerald-500">
                           <Receipt className="h-6 w-6" />
                        </div>
                     </div>
                     <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                               
                               <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100/50 relative overflow-hidden">
                                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-100/50 to-transparent pointer-events-none" />
                                  <div className="flex items-center gap-3 mb-6">
                                     <DollarSign className="h-6 w-6 text-emerald-600" />
                                     <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-widest">Generate Patient Invoice</h3>
                                  </div>
                                  <div className="prose prose-emerald prose-sm max-w-none">
                                     <p className="text-emerald-900 font-medium leading-relaxed mb-6">
                                        Use the main <span className="font-bold underline">Billing / Invoices</span> menu on the sidebar to create line items for this patient's consultation, pharmacy drugs, and lab testing. Once they have successfully paid, you may clear them from this queue.
                                     </p>
                                  </div>
                               </div>

                               {clinicalRecord && (
                                  <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                    <div className="flex items-center gap-3 mb-4 text-slate-400">
                                       <FileText className="h-5 w-5" />
                                       <h4 className="text-xs font-bold uppercase tracking-widest">Clinical Note Reference</h4>
                                    </div>
                                    <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                       <span className="font-semibold text-slate-900 text-sm">Doctor's Assessment:</span><br/>
                                       {clinicalRecord.assessment || 'N/A'}
                                    </p>
                                    <div className="h-px bg-slate-200 my-4" />
                                    <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                       <span className="font-semibold text-slate-900 text-sm">Doctor's Orders (Plan):</span><br/>
                                       {clinicalRecord.plan || 'N/A'}
                                    </p>
                                  </div>
                               )}
                           </motion.div>
                     </div>
                     <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 flex-wrap">
                        <button 
                          onClick={handleDischarge}
                          className="px-8 py-4 bg-emerald-600 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                        >
                           Mark as Settled & Discharge
                        </button>
                     </div>
                  </>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                     <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
                        <CreditCard className="h-10 w-10" />
                     </div>
                     <h3 className="text-xl font-medium text-slate-900">Billing Workspace</h3>
                     <p className="text-slate-500 font-medium max-w-sm">Select a patient from the queue to review their clinical itinerary before finalizing their bill.</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
