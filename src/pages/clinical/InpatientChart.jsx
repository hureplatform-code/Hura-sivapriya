import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import wardService from '../../services/wardService';
import { 
  ArrowLeft, Activity, FileText, Pill, LogOut, CheckSquare, Plus, CheckCircle2, AlertTriangle, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function InpatientChart() {
  const { wardId, bedId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [bedDetails, setBedDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('vitals');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  // Forms
  const [vitalForm, setVitalForm] = useState({ bp: '', temp: '', pulse: '', spO2: '' });
  const [noteForm, setNoteForm] = useState('');
  const [marOrderForm, setMarOrderForm] = useState({ medication: '', dose: '', route: '', frequency: '' });

  useEffect(() => {
    fetchData();
  }, [wardId, bedId]);

  const fetchData = async () => {
    setLoading(true);
    const details = await wardService.getBedDetails(wardId, bedId);
    if (!details || details.status !== 'occupied') {
        setLoading(false);
        return;
    }
    setBedDetails(details);
    if(details.patientId) {
       const charData = await wardService.getChartRecords(details.patientId);
       setRecords(charData || []);
    }
    setLoading(false);
  };

  const saveVital = async (e) => {
    e.preventDefault();
    if(!bedDetails.patientId) return;
    try {
      await wardService.addChartRecord(bedDetails.patientId, bedDetails.admissionId, 'vital', vitalForm, userData);
      setVitalForm({ bp: '', temp: '', pulse: '', spO2: '' });
      success('Vitals recorded successfully.');
      fetchData();
    } catch (error) {
      toastError('Failed to record vitals.');
    }
  };

  const saveNote = async (e) => {
    e.preventDefault();
    if(!bedDetails.patientId || !noteForm) return;
    try {
      await wardService.addChartRecord(bedDetails.patientId, bedDetails.admissionId, 'note', { content: noteForm }, userData);
      setNoteForm('');
      success('Clinical note saved.');
      fetchData();
    } catch (error) {
      toastError('Failed to save clinical note.');
    }
  };

  const saveMarOrder = async (e) => {
     e.preventDefault();
     if(!bedDetails.patientId) return;
     try {
       await wardService.addChartRecord(bedDetails.patientId, bedDetails.admissionId, 'mar_order', marOrderForm, userData);
       setMarOrderForm({ medication: '', dose: '', route: '', frequency: '' });
       success('Medication order prescribed.');
       fetchData();
     } catch (error) {
       toastError('Failed to prescribe medication.');
     }
  };

  const administerMed = async (orderId) => {
      // Find order to copy details
      const order = records.find(r => r.id === orderId);
      if(!order || !bedDetails.patientId) return;
      
      try {
        await wardService.addChartRecord(bedDetails.patientId, bedDetails.admissionId, 'mar_given', { 
           medication: order.data.medication,
           orderId: order.id 
        }, userData);
        success(`Administered: ${order.data.medication}`);
        fetchData();
      } catch (error) {
        toastError('Failed to log administration.');
      }
  };

  const handleDischarge = async () => {
      const isConfirmed = await confirm({
        title: 'Discharge Patient',
        message: `Are you sure you want to discharge patient ${bedDetails.patient} and free this bed?`,
        confirmText: 'Process Discharge',
        cancelText: 'Cancel',
        isDestructive: true
      });
      
      if (isConfirmed) {
        try {
          await wardService.dischargePatient(wardId, bedId);
          success('Patient discharged successfully.');
          navigate('/ward');
        } catch (error) {
          toastError('Failed to discharge patient.');
        }
      }
  };

  if(!bedDetails) {
     return (
         <DashboardLayout>
            <div className="p-12 text-center text-slate-500 font-medium">Bed vacant or invalid selection. <button onClick={()=>navigate(-1)} className="text-blue-500 hover:underline">Go Back</button></div>
         </DashboardLayout>
     )
  }

  const vitalsLog = records.filter(r => r.type === 'vital');
  const notesLog = records.filter(r => r.type === 'note');
  const marOrders = records.filter(r => r.type === 'mar_order');
  const marGivenLog = records.filter(r => r.type === 'mar_given');

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <button onClick={() => navigate('/ward')} className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
                <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{bedDetails.patient}</h1>
                   <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100">
                      IN-PATIENT
                   </span>
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                   Admitted: {bedDetails.admittedAt} | {bedDetails.name} | Dr. {bedDetails.doctor || 'Assigned'}
                </div>
            </div>
            
            <button onClick={handleDischarge} className="px-6 py-3 bg-red-50 text-red-600 font-semibold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all flex items-center gap-2 border border-red-100">
                <LogOut className="h-4 w-4" /> Finalize Discharge
            </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100">
            {[
                { id: 'vitals', icon: Activity, label: 'Vitals Flowsheet' },
                { id: 'notes', icon: FileText, label: 'Ward Progress Notes' },
                { id: 'mar', icon: Pill, label: 'MAR (Medications)' },
                { id: 'discharge', icon: CheckSquare, label: 'Discharge Summary' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        flex items-center gap-2 px-6 py-4 text-xs font-semibold uppercase tracking-widest border-b-2 transition-all
                        ${activeTab === tab.id 
                            ? 'text-primary-600 border-primary-500 bg-primary-50/20' 
                            : 'text-slate-400 border-transparent hover:text-slate-800'
                        }
                    `}
                >
                    <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
            ))}
        </div>

        {/* Tab Content */}
        <div className="">
            <AnimatePresence mode="wait">
                {activeTab === 'vitals' && (
                    <motion.div key="vitals" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="grid lg:grid-cols-3 gap-8 items-start">
                        {/* Entry form */}
                        <form onSubmit={saveVital} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Record New Vitals</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                     <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">BP (mmHg)</label>
                                     <input type="text" placeholder="e.g. 120/80" required value={vitalForm.bp} onChange={e=>setVitalForm({...vitalForm, bp: e.target.value})} className="w-full bg-white border outline-none focus:border-emerald-300 p-3 rounded-xl text-sm font-medium" />
                                   </div>
                                   <div>
                                     <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Temp (°C)</label>
                                     <input type="text" placeholder="e.g. 36.8" required value={vitalForm.temp} onChange={e=>setVitalForm({...vitalForm, temp: e.target.value})} className="w-full bg-white border outline-none focus:border-emerald-300 p-3 rounded-xl text-sm font-medium" />
                                   </div>
                                   <div>
                                     <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">Pulse (bpm)</label>
                                     <input type="text" required value={vitalForm.pulse} onChange={e=>setVitalForm({...vitalForm, pulse: e.target.value})} className="w-full bg-white border outline-none focus:border-emerald-300 p-3 rounded-xl text-sm font-medium" />
                                   </div>
                                   <div>
                                     <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1 block">SpO2 (%)</label>
                                     <input type="text" value={vitalForm.spO2} onChange={e=>setVitalForm({...vitalForm, spO2: e.target.value})} className="w-full bg-white border outline-none focus:border-emerald-300 p-3 rounded-xl text-sm font-medium" />
                                   </div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                                    <Plus className="h-4 w-4" /> Save Vitals
                                </button>
                            </div>
                        </form>
                        {/* Flowsheet table */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                           <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                 <tr>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">BP</th>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pulse</th>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temp</th>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">SpO2</th>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recorded By</th>
                                 </tr>
                              </thead>
                              <tbody>
                                  {vitalsLog.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-sm font-medium text-slate-400">No vitals recorded</td></tr>}
                                  {vitalsLog.map(v => (
                                     <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-xs font-semibold text-slate-600">{new Date(v.timestamp).toLocaleString([], {month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</td>
                                        <td className="p-4 text-sm font-mono text-slate-900">{v.data.bp}</td>
                                        <td className="p-4 text-sm font-mono text-slate-900">{v.data.pulse}</td>
                                        <td className="p-4 text-sm font-mono text-slate-900">{v.data.temp}</td>
                                        <td className="p-4 text-sm font-mono text-slate-900">{v.data.spO2 || '-'}</td>
                                        <td className="p-4 text-xs text-slate-500 font-medium">{v.recordedBy} <span className="opacity-50 border p-0.5 rounded text-[8px] uppercase">{v.role}</span></td>
                                     </tr>
                                  ))}
                              </tbody>
                           </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'notes' && (
                    <motion.div key="notes" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="grid lg:grid-cols-2 gap-8 items-start">
                        {/* Writing notes */}
                        <form onSubmit={saveNote} className="space-y-4">
                            <textarea 
                               required rows={8}
                               placeholder="Write progress note (SOAP) or nurse observation here..." 
                               value={noteForm} 
                               onChange={e=>setNoteForm(e.target.value)}
                               className="w-full bg-slate-50 border border-transparent outline-none focus:bg-white focus:border-blue-200 resize-none p-6 rounded-2xl text-sm font-medium text-slate-800 shadow-inner leading-relaxed" 
                            />
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 shadow-xl flex items-center justify-center gap-2">
                                <Plus className="h-4 w-4" /> Save Clinical Note
                            </button>
                        </form>
                        {/* Notes history */}
                        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                            {notesLog.length === 0 && <div className="text-sm font-medium text-slate-400 p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center">No progress notes yet.</div>}
                            {notesLog.map(n => (
                                <div key={n.id} className="bg-white border text-left p-6 rounded-2xl shadow-sm space-y-3">
                                   <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                         <User className="h-4 w-4 text-slate-300" /> {n.recordedBy} <span className="text-[9px] uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">{n.role}</span>
                                      </div>
                                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(n.timestamp).toLocaleString([], {month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</div>
                                   </div>
                                   <div className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{n.data.content}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'mar' && (
                    <motion.div key="mar" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-8">
                       {['doctor', 'superadmin', 'clinic_owner'].includes(userData?.role) && (
                       <form onSubmit={saveMarOrder} className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl flex items-end gap-4 shadow-sm">
                           <div className="flex-1">
                               <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Prescribe Medication (MAR Order)</label>
                               <input type="text" placeholder="e.g. Paracetamol" required value={marOrderForm.medication} onChange={e=>setMarOrderForm({...marOrderForm, medication: e.target.value})} className="w-full bg-white border border-blue-50 focus:border-blue-200 p-3 rounded-xl outline-none text-sm font-medium" />
                           </div>
                           <div className="w-32">
                               <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Dose</label>
                               <input type="text" placeholder="500mg" required value={marOrderForm.dose} onChange={e=>setMarOrderForm({...marOrderForm, dose: e.target.value})} className="w-full bg-white border border-blue-50 focus:border-blue-200 p-3 rounded-xl outline-none text-sm font-medium" />
                           </div>
                           <div className="w-32">
                               <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Route</label>
                               <select required value={marOrderForm.route} onChange={e=>setMarOrderForm({...marOrderForm, route: e.target.value})} className="w-full bg-white border border-blue-50 focus:border-blue-200 p-3 rounded-xl outline-none text-sm font-medium">
                                   <option value="">...</option>
                                   <option value="PO (Oral)">PO</option>
                                   <option value="IV">IV</option>
                                   <option value="IM">IM</option>
                               </select>
                           </div>
                           <div className="w-48">
                               <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Frequency</label>
                               <select required value={marOrderForm.frequency} onChange={e=>setMarOrderForm({...marOrderForm, frequency: e.target.value})} className="w-full bg-white border border-blue-50 focus:border-blue-200 p-3 rounded-xl outline-none text-sm font-medium">
                                   <option value="">...</option>
                                   <option value="TDS (Every 8h)">TDS (Every 8h)</option>
                                   <option value="BD (Every 12h)">BD (Every 12h)</option>
                                   <option value="OD (Once daily)">OD (Once daily)</option>
                                   <option value="STAT (Immediately)">STAT (Immediately)</option>
                               </select>
                           </div>
                           <button type="submit" className="h-12 px-6 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-md">Add Order</button>
                       </form>
                       )}

                       <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                          {marOrders.length === 0 ? (
                              <div className="p-12 text-center text-slate-400 font-medium text-sm">No active MAR orders. Clinician needs to prescribe.</div>
                          ) : (
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                  <tr>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medication Order</th>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dosing</th>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ordered By</th>
                                     <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/3">Administration Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {marOrders.map(order => {
                                      // Find all given instances
                                      const given = marGivenLog.filter(g => g.data.orderId === order.id);
                                      return (
                                      <tr key={order.id} className="border-b border-slate-50">
                                         <td className="p-4">
                                            <p className="font-bold text-slate-900">{order.data.medication}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">{new Date(order.timestamp).toLocaleString([], {month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                                         </td>
                                         <td className="p-4">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold text-xs block inline-block mb-1">{order.data.dose}</span>
                                            <p className="text-xs font-medium text-slate-500">{order.data.route} — {order.data.frequency}</p>
                                         </td>
                                         <td className="p-4 text-xs font-semibold text-slate-600">{order.recordedBy}</td>
                                         <td className="p-4 bg-slate-50/50">
                                             <div className="flex flex-col gap-2">
                                                 <button onClick={() => administerMed(order.id)} className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                                     <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Administer Dose Now
                                                 </button>
                                                 {given.length > 0 && (
                                                     <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-t border-slate-200 pt-2 mt-2">
                                                         Recent Doses:
                                                         {given.map((g, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-slate-500 mt-1 bg-white px-2 py-1 rounded border">
                                                                <span>{new Date(g.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                                <span className="text-[9px]">{g.recordedBy}</span>
                                                            </div>
                                                         ))}
                                                     </div>
                                                 )}
                                             </div>
                                         </td>
                                      </tr>
                                  )})}
                              </tbody>
                          </table>
                          )}
                       </div>
                    </motion.div>
                )}

                {activeTab === 'discharge' && (
                    <motion.div key="discharge" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="max-w-2xl mx-auto text-center space-y-6 pt-8">
                       <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
                       <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Initiate Routine Discharge</h2>
                       <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm mx-auto">
                           Ensure all clinical summaries have been recorded under Ward Notes. Discharging will release the bed and mark the in-patient episode as complete.
                       </p>
                       <button onClick={handleDischarge} className="h-14 px-10 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 shadow-xl transition-all shadow-slate-200">
                           Process Discharge
                       </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
