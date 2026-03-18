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
  Activity as ActivityIcon,
  FileText,
  Syringe,
  Thermometer,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TriageModal from '../../components/modals/TriageModal';

export default function NursingQueue() {
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalRecord, setClinicalRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [isTriageOpen, setIsTriageOpen] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [userData]);

  const fetchQueue = async () => {
    if (!userData?.facilityId) return;
    try {
      setLoading(true);
      const data = await appointmentService.getNursingQueue(userData.facilityId);
      setQueue(data);
    } catch (err) {
      console.error(err);
      toastError('Failed to load nursing queue.');
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

  const handlePerformTriage = () => {
    setIsTriageOpen(true);
  };

  const handleSaveTriage = async (vitals) => {
    try {
      // 1. Update Appointment Status to 'triage' (ready for doctor)
      await appointmentService.updateAppointmentStatus(selectedPatient.id, 'triage');
      
      // 2. Save Vitals to Medical Records (Type: triage)
      await medicalRecordService.createRecord({
        patientId: selectedPatient.patientId,
        patientName: selectedPatient.patient,
        appointmentId: selectedPatient.id,
        facilityId: userData?.facilityId,
        doctorName: userData?.name || 'Nurse',
        type: 'triage',
        specialty: 'general',
        title: 'Triage Assessment',
        status: 'signed',
        vitals
      }, { id: userData?.uid, name: userData?.name });

      success('Triage data recorded and patient queued for doctor.');
      setIsTriageOpen(false);
      setSelectedPatient(null);
      fetchQueue();
    } catch (error) {
      console.error('Error saving triage:', error);
      toastError('Failed to save triage data.');
    }
  };

  const handleReturnToDoctor = async () => {
    if (!selectedPatient) return;
    try {
      // Returning patient to 'triage' or 'arrived' status pushes them back to the doctor's active queue
      await appointmentService.updateAppointmentStatus(selectedPatient.id, 'arrived');
      
      // Log audit
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Nurse',
        action: 'NURSING_ORDERS_COMPLETED',
        module: 'NURSING',
        description: `Completed nursing orders and returned ${selectedPatient.patient} to Doctor.`,
        metadata: {
          appointmentId: selectedPatient.id,
          patientId: selectedPatient.patientId,
          facilityId: userData?.facilityId
        }
      });
      
      success(`Orders complete. Patient sent back to Doctor.`);
      setSelectedPatient(null);
      setClinicalRecord(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
      toastError('Failed to route patient.');
    }
  };

  const handleRouteToBilling = async () => {
    if (!selectedPatient) return;
    try {
      await appointmentService.updateAppointmentStatus(selectedPatient.id, 'awaiting-billing');
      
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Nurse',
        action: 'NURSE_ROUTED_BILLING',
        module: 'NURSING',
        description: `Routed ${selectedPatient.patient} to Billing after nursing care.`,
        metadata: {
          appointmentId: selectedPatient.id,
          patientId: selectedPatient.patientId,
          facilityId: userData?.facilityId
        }
      });
      
      success(`Patient safely routed to Billing.`);
      setSelectedPatient(null);
      setClinicalRecord(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
      toastError('Failed to route patient.');
    }
  };

  const filteredQueue = queue.filter(apt => 
    (apt.patient?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    apt.patientId?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    apt.status !== 'cancelled'
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <Syringe className="h-8 w-8 text-blue-500" /> Nursing Orders & Triage
            </h1>
            <p className="text-slate-500 font-medium mt-1">Record vitals or execute clinical orders requested by doctors.</p>
          </div>
          <button 
            onClick={fetchQueue}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <ActivityIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Nursing Queue List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search nursing queue..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-white border-none shadow-sm focus:ring-2 focus:ring-blue-100 rounded-[2rem] text-sm font-medium transition-all outline-none"
               />
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {loading ? (
                 <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm border-dashed">
                    <ActivityIcon className="h-8 w-8 text-slate-300 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Scanning Queue...</p>
                 </div>
              ) : filteredQueue.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm border-dashed">
                    <CheckCircle2 className="h-10 w-10 text-blue-300 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">No pending nursing orders or triage.</p>
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
                             <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${selectedPatient?.id === apt.id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
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

          {/* Nursing Workspace */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm min-h-[600px] flex flex-col overflow-hidden">
               {selectedPatient ? (
                  <>
                     <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div>
                           <h2 className="text-xl font-bold text-slate-900">{selectedPatient.patient}</h2>
                           <p className="text-sm font-medium text-slate-500 mt-1">
                              {selectedPatient.status === 'awaiting-nurse' && !clinicalRecord ? 'New Arrival - Pending Triage' : `Sent by Dr. ${selectedPatient.providerName || selectedPatient.provider || selectedPatient.doctor || 'Unknown'} • ${selectedPatient.date}`}
                           </p>
                        </div>
                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-500">
                           <ListTodo className="h-6 w-6" />
                        </div>
                     </div>
                     <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                           {loadingRecord ? (
                             <div className="flex items-center justify-center h-full">
                               <Activity className="h-8 w-8 text-blue-500 animate-spin" />
                             </div>
                           ) : clinicalRecord ? (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                 <div className="bg-blue-50 rounded-[2rem] p-8 border border-blue-100/50 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none" />
                                    <div className="flex items-center gap-3 mb-6">
                                       <ActivityIcon className="h-6 w-6 text-blue-600" />
                                       <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Nursing Instructions</h3>
                                    </div>
                                    <div className="prose prose-blue prose-sm max-w-none">
                                       <p className="font-medium text-blue-900 text-lg leading-relaxed whitespace-pre-wrap">
                                          {clinicalRecord.nursingOrders || 'No specific nursing orders provided. Please verify with the doctor.'}
                                       </p>
                                    </div>
                                 </div>
  
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                       <div className="flex items-center gap-3 mb-4 text-slate-400">
                                          <Thermometer className="h-5 w-5" />
                                          <h4 className="text-xs font-bold uppercase tracking-widest">Triage Info</h4>
                                       </div>
                                       <p className="text-slate-700 font-medium leading-relaxed">
                                          BP: {selectedPatient.vitals?.bp_sys}/{selectedPatient.vitals?.bp_dia || 'N/A'}<br/>
                                          Temp: {selectedPatient.vitals?.temp || 'N/A'} °C<br/>
                                          Weight: {selectedPatient.vitals?.weight || 'N/A'} kg
                                       </p>
                                    </div>
                                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                                       <div className="flex items-center gap-3 mb-4 text-slate-400">
                                          <FileText className="h-5 w-5" />
                                          <h4 className="text-xs font-bold uppercase tracking-widest">Doctor's Plan</h4>
                                       </div>
                                       <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                          {clinicalRecord.plan || 'No general plan provided.'}
                                       </p>
                                    </div>
                                 </div>
                             </motion.div>
                           ) : (
                              <div className="text-center p-12 text-slate-500 font-medium h-full flex flex-col items-center justify-center space-y-4">
                                 <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                    <Thermometer className="h-8 w-8" />
                                 </div>
                                 <div>
                                   <p className="text-sm text-slate-600 font-bold uppercase tracking-widest">Pending Initial Triage</p>
                                   <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">This patient has arrived and is waiting for initial vitals collection before seeing the doctor.</p>
                                 </div>
                                 <button 
                                   onClick={handlePerformTriage}
                                   className="px-8 py-4 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
                                 >
                                    Start Triage Now
                                 </button>
                              </div>
                           )}
                     </div>
                     {clinicalRecord && (
                        <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 flex-wrap">
                           <button 
                             onClick={handleRouteToBilling}
                             className="px-6 py-4 bg-white border border-slate-200 text-slate-600 font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                           >
                              Route to Billing
                           </button>
                           <button 
                             onClick={handleReturnToDoctor}
                             className="px-8 py-4 bg-blue-600 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                           >
                              Tasks Complete (Return to Doctor)
                           </button>
                        </div>
                     )}
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                     <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                        <User className="h-10 w-10 opacity-20" />
                     </div>
                     <p className="text-sm font-semibold uppercase tracking-widest">Select a patient to begin</p>
                     <p className="text-xs font-medium mt-2 max-w-xs leading-relaxed">Select a patient from the queue to view clinical orders or perform initial triage.</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isTriageOpen && (
          <TriageModal 
            appointment={selectedPatient}
            onClose={() => setIsTriageOpen(false)}
            onSave={handleSaveTriage}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
