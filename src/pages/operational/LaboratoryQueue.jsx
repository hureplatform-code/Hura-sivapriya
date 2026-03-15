import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import appointmentService from '../../services/appointmentService';
import auditService from '../../services/auditService';
import { 
  Activity, 
  Search, 
  CheckCircle2, 
  Clock, 
  User,
  Beaker,
  TestTube2,
  Stethoscope,
  Microscope
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LaboratoryQueue() {
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [labResults, setLabResults] = useState('');

  useEffect(() => {
    fetchQueue();
  }, [userData]);

  const fetchQueue = async () => {
    if (!userData?.facilityId) return;
    try {
      setLoading(true);
      const data = await appointmentService.getLaboratoryQueue(userData.facilityId);
      setQueue(data);
    } catch (err) {
      console.error(err);
      toastError('Failed to load lab queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (appointment) => {
    setSelectedPatient(appointment);
    setLabResults(appointment.labResults || '');
  };

  const handleReturnToDoctor = async () => {
    if (!selectedPatient) return;
    try {
      // Returning patient to Arrived status pushes them back to the doctor's active queue
      // We also save the results to the appointment so the doctor can see them immediately
      await appointmentService.updateAppointment(selectedPatient.id, { 
        status: 'arrived',
        labResults: labResults,
        labCompletedAt: new Date().toISOString()
      });
      
      // Log audit
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Lab Tech',
        action: 'LAB_RESULTS_SENT',
        module: 'LABORATORY',
        description: `Lab tests concluded with results. Returned ${selectedPatient.patient} back to the Doctor.`,
        metadata: {
          appointmentId: selectedPatient.id,
          patientId: selectedPatient.patientId,
          facilityId: userData?.facilityId,
          resultsPreview: labResults.substring(0, 100)
        }
      });
      
      success(`Results complete. Sent back to Doctor.`);
      setSelectedPatient(null);
      setLabResults('');
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
      
      // Log audit
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Lab Tech',
        action: 'LAB_ROUTED_BILLING',
        module: 'LABORATORY',
        description: `Routed ${selectedPatient.patient} to Billing after lab work.`,
        metadata: {
          appointmentId: selectedPatient.id,
          patientId: selectedPatient.patientId,
          facilityId: userData?.facilityId
        }
      });
      
      success(`Patient safely routed to Billing.`);
      setSelectedPatient(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
      toastError('Failed to route patient.');
    }
  };

  const handleDischarge = async () => {
    if (!selectedPatient) return;
    try {
      await appointmentService.updateAppointmentStatus(selectedPatient.id, 'completed');
      
      // Log audit
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Lab Tech',
        action: 'LAB_DISCHARGED_PATIENT',
        module: 'LABORATORY',
        description: `Discharged ${selectedPatient.patient} directly from the lab.`,
        metadata: {
          appointmentId: selectedPatient.id,
          patientId: selectedPatient.patientId,
          facilityId: userData?.facilityId
        }
      });
      
      success(`Patient successfully discharged.`);
      setSelectedPatient(null);
      fetchQueue();
    } catch (err) {
      console.error(err);
      toastError('Failed to discharge patient.');
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
              <Microscope className="h-8 w-8 text-blue-500" /> Laboratory Queue
            </h1>
            <p className="text-slate-500 font-medium mt-1">Receive arriving patients, run diagnostics, and route them back.</p>
          </div>
          <button 
            onClick={fetchQueue}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Activity className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lab Queue List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search lab patients..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-16 pr-8 py-5 bg-white border-none shadow-sm focus:ring-2 focus:ring-blue-100 rounded-[2rem] text-sm font-medium transition-all outline-none"
               />
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {loading ? (
                 <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm border-dashed">
                    <Activity className="h-8 w-8 text-slate-300 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Scanning Lab Queue...</p>
                 </div>
              ) : filteredQueue.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100/50 shadow-sm border-dashed">
                    <CheckCircle2 className="h-10 w-10 text-blue-300 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">No patients are currently awaiting labs.</p>
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

          {/* Laboratory Workspace */}
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
                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-500">
                           <Beaker className="h-6 w-6" />
                        </div>
                     </div>
                     <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                               <div className="bg-blue-50 rounded-[2rem] p-8 border border-blue-100/50 relative overflow-hidden">
                                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none" />
                                  <div className="flex items-center gap-3 mb-6">
                                     <TestTube2 className="h-6 w-6 text-blue-600" />
                                     <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Proceed to Investigation Details</h3>
                                  </div>
                                  <div className="prose prose-blue prose-sm max-w-none">
                                     <p className="text-blue-900 font-medium leading-relaxed">
                                        Check the primary <span className="font-bold underline">Investigation Requests</span> tab to fill out all the specific diagnostic results and upload report documents for this patient.
                                     </p>
                                  </div>
                               </div>

                               <div className="bg-slate-50 rounded-[2rem] p-8 border border-white flex flex-col gap-6">
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <Microscope className="h-5 w-5 text-blue-500" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800">Laboratory Results & Findings</h4>
                                     </div>
                                  </div>
                                  <textarea 
                                    className="w-full h-48 p-8 bg-white border border-slate-100 rounded-[2.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 placeholder:text-slate-300 resize-none shadow-inner"
                                    placeholder="Annotate test results here (e.g. Hb: 13.5g/dL, WBC: 7.2x10^9/L)..."
                                    value={labResults}
                                    onChange={(e) => setLabResults(e.target.value)}
                                  />
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100">
                                     <div className="flex items-center gap-3 mb-4 text-slate-400">
                                        <Stethoscope className="h-5 w-5" />
                                        <h4 className="text-xs font-bold uppercase tracking-widest">Patient Vitals</h4>
                                     </div>
                                     <p className="text-xs text-slate-600 font-medium leading-loose">
                                        BP: {selectedPatient.vitals?.bloodPressure || 'N/A'}<br/>
                                        Temp: {selectedPatient.vitals?.temperature || 'N/A'} °C<br/>
                                        Weight: {selectedPatient.vitals?.weight || 'N/A'} kg
                                     </p>
                                  </div>
                               </div>
                           </motion.div>
                     </div>
                     <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 flex-wrap">
                        <button 
                          onClick={handleDischarge}
                          className="px-6 py-4 bg-white border border-slate-200 text-slate-600 font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                        >
                           Discharge
                        </button>
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
                           Results Ready (Return to Doctor)
                        </button>
                     </div>
                  </>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                     <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
                        <Beaker className="h-10 w-10" />
                     </div>
                     <h3 className="text-xl font-medium text-slate-900">Lab Workspace</h3>
                     <p className="text-slate-500 font-medium max-w-sm">Select a patient from the waiting queue to review requested tests, process samples, and route them back.</p>
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
