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
  HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PharmacyQueue() {
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
      
      // Log audit
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
              <Pill className="h-8 w-8 text-primary-500" /> Pharmacy Queue
            </h1>
            <p className="text-slate-500 font-medium mt-1">Review prescriptions and dispense medication.</p>
          </div>
          <button 
            onClick={fetchQueue}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Activity className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pharmacy Queue List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search waiting patients..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-white border-none shadow-sm focus:ring-2 focus:ring-primary-100 rounded-[2rem] text-sm font-medium transition-all outline-none"
               />
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {loading ? (
                 <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm border-dashed">
                    <Activity className="h-8 w-8 text-slate-300 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading Queue...</p>
                 </div>
              ) : filteredQueue.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm border-dashed">
                    <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">No patients are awaiting pharmacy.</p>
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
                             <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${selectedPatient?.id === apt.id ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-600'}`}>
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
                       </div>
                    </motion.button>
                 ))
              )}
            </div>
          </div>

          {/* Pharmacy Workspace */}
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
                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-primary-500">
                           <FileText className="h-6 w-6" />
                        </div>
                     </div>
                     <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                        {loadingRecord ? (
                           <div className="h-full flex flex-col items-center justify-center space-y-4">
                              <Activity className="h-8 w-8 text-primary-500 animate-spin" />
                              <p className="text-sm font-medium text-slate-500 tracking-widest uppercase">Fetching Prescription...</p>
                           </div>
                        ) : clinicalRecord ? (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                               <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100/50 relative overflow-hidden">
                                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-100/50 to-transparent pointer-events-none" />
                                  <div className="flex items-center gap-3 mb-6">
                                     <Pill className="h-6 w-6 text-amber-600" />
                                     <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest">Doctor's Plan / Medication Orders</h3>
                                  </div>
                                  <div className="prose prose-amber prose-sm max-w-none">
                                     {clinicalRecord.plan ? (
                                        <p className="text-amber-900 leading-relaxed font-medium whitespace-pre-wrap text-base">
                                           {clinicalRecord.plan}
                                        </p>
                                     ) : (
                                        <p className="text-amber-600/60 font-medium italic">No specific medication plan was written by the doctor.</p>
                                     )}
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-6">
                                  <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                     <div className="flex items-center gap-3 mb-4 text-slate-400">
                                        <HeartPulse className="h-5 w-5" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Diagnosis / Assessment</h4>
                                     </div>
                                     <p className="text-slate-700 font-medium leading-relaxed">
                                        {clinicalRecord.assessment || 'No specific assessment recorded.'}
                                     </p>
                                  </div>
                                  <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                     <div className="flex items-center gap-3 mb-4 text-slate-400">
                                        <Stethoscope className="h-5 w-5" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Vitals Summary (from Triage)</h4>
                                     </div>
                                     <p className="text-slate-700 font-medium leading-relaxed">
                                        BP: {selectedPatient.vitals?.bloodPressure || 'N/A'}<br/>
                                        Temp: {selectedPatient.vitals?.temperature || 'N/A'} °C<br/>
                                        Weight: {selectedPatient.vitals?.weight || 'N/A'} kg
                                     </p>
                                  </div>
                               </div>
                           </motion.div>
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center space-y-4">
                              <FileText className="h-12 w-12 text-slate-200" />
                              <p className="text-sm font-medium text-slate-500">No signed clinical record found for this session.</p>
                           </div>
                        )}
                     </div>
                     <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-4">
                        <button 
                          onClick={() => handleDispense('completed')}
                          className="px-8 py-4 bg-emerald-600 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                        >
                           Dispense & Discharge
                        </button>
                        <button 
                          onClick={() => handleDispense('awaiting-billing')}
                          className="px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                           Dispense & Route to Billing
                        </button>
                     </div>
                  </>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                     <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
                        <Pill className="h-10 w-10" />
                     </div>
                     <h3 className="text-xl font-medium text-slate-900">Pharmacy Workspace</h3>
                     <p className="text-slate-500 font-medium max-w-sm">Select a patient from the queue to view their active prescriptions and dispense medications.</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
