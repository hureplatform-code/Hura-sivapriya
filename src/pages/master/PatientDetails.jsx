import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Save,
  Activity,
  CreditCard,
  Heart,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import patientService from '../../services/patientService';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatientById(id);
      setPatient(data);
      setFormData(data || {});
    } catch (error) {
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await patientService.updatePatient(id, formData);
      setPatient(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  if (loading) return <DashboardLayout><div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">Decompressing patient record...</div></DashboardLayout>;
  if (!patient) return <DashboardLayout><div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Biometric Record Not Found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/master/patients')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors group"
          >
            <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-50 shadow-sm transition-all group-active:scale-95">
              <ArrowLeft className="h-5 w-5" />
            </div>
            Back to Registry
          </button>
          
          <div className="flex gap-4">
             <button
               onClick={() => setIsEditing(!isEditing)}
               className={`px-8 py-4 ${isEditing ? 'bg-slate-100 text-slate-600' : 'bg-primary-600 text-white shadow-lg shadow-primary-200'} font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95`}
             >
               {isEditing ? 'Discard Changes' : 'Modify Bio-Data'}
             </button>
             <AnimatePresence>
               {isEditing && (
                 <motion.button 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   onClick={handleUpdate}
                   className="px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 flex items-center gap-2 active:scale-95 transition-all"
                 >
                   <Save className="h-4 w-4" />
                   Commit Updates
                 </motion.button>
               )}
             </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="relative z-10 space-y-12">
                 <div className="flex items-center gap-10">
                    <div className="relative">
                      <div className="h-28 w-28 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400 text-5xl font-black uppercase border-4 border-white shadow-2xl transition-transform group-hover:scale-105">
                        {patient.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 cursor-help">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">{patient.name}</h1>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">Patient ID: {patient.id}</span>
                        <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Registered: Jan 2026</span>
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-4 border-b border-slate-50 flex items-center gap-2">
                         <User className="h-4 w-4 text-primary-500" /> Bio-Demographics
                       </h3>
                       <div className="space-y-5">
                          {isEditing ? (
                            <>
                              <EditableField label="Full Name" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
                              <EditableField label="Date of Birth" value={formData.dob} onChange={(v) => setFormData({...formData, dob: v})} type="date" />
                              <EditableField label="Gender" value={formData.gender} onChange={(v) => setFormData({...formData, gender: v})} isSelect options={['Male', 'Female', 'Other']} />
                              <EditableField label="Email Address" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                            </>
                          ) : (
                            <>
                              <DetailRow label="Date of Birth" value={patient.dob || 'Not Record'} />
                              <DetailRow label="Gender" value={patient.gender || 'Not Record'} />
                              <DetailRow label="Age" value={patient.age || 'Calc...'} />
                              <DetailRow label="Primary Mobile" value={patient.contact || patient.mobile || 'Not Record'} />
                              <DetailRow label="Email Identity" value={patient.email || 'Anonymous'} />
                            </>
                          )}
                       </div>
                    </div>
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-4 border-b border-slate-50 flex items-center gap-2">
                         <Heart className="h-4 w-4 text-red-500" /> Emergency & Next of Kin
                       </h3>
                       <div className="space-y-5">
                          {isEditing ? (
                            <>
                              <EditableField label="Next of Kin Name" value={formData.nextOfKinName} onChange={(v) => setFormData({...formData, nextOfKinName: v})} />
                              <EditableField label="Relationship" value={formData.nextOfKinRelation} onChange={(v) => setFormData({...formData, nextOfKinRelation: v})} />
                              <EditableField label="Emergency Phone" value={formData.nextOfKinPhone} onChange={(v) => setFormData({...formData, nextOfKinPhone: v})} />
                              <EditableField label="Residential Address" value={formData.address} onChange={(v) => setFormData({...formData, address: v})} isTextArea />
                            </>
                          ) : (
                            <>
                              <DetailRow label="Contact Person" value={patient.nextOfKinName || 'Standard'} />
                              <DetailRow label="Relationship" value={patient.nextOfKinRelation || 'Standard'} />
                              <DetailRow label="Emergency Line" value={patient.nextOfKinPhone || 'Standard'} />
                              <DetailRow label="Home Address" value={patient.address || 'Standard'} />
                            </>
                          )}
                       </div>
                    </div>
                 </div>
               </div>
               <div className="absolute -right-24 -top-24 h-96 w-96 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />
               <div className="absolute -left-24 -bottom-24 h-96 w-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
            </section>

            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 group">
               <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-emerald-500" /> Insurance & Financial Eligibility
                 </h3>
                 <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${patient.paymentMode === 'Insurance' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white'}`}>
                    {patient.paymentMode || 'Cash Payer'}
                 </span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Primary Payer</p>
                     <p className="text-xl font-black text-slate-900 flex items-center gap-3">
                       <CreditCard className="h-6 w-6 text-primary-500" />
                       {isEditing ? (
                         <select className="bg-transparent border-none outline-none font-black" value={formData.paymentMode} onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}>
                            <option value="Cash">Cash / Private</option>
                            <option value="Insurance">Insurance Provider</option>
                         </select>
                       ) : (
                         patient.paymentMode || 'Cash / Private'
                       )}
                     </p>
                  </div>
                  
                  { (patient.paymentMode === 'Insurance' || formData.paymentMode === 'Insurance') && (
                    <>
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Provider Name</p>
                         <div className="text-lg font-black text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-black w-full" value={formData.insName} onChange={(e) => setFormData({...formData, insName: e.target.value})} /> : (patient.insName || 'SHA / NHIF')}
                         </div>
                      </div>
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Member Identifier</p>
                         <div className="text-lg font-black text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-black w-full" value={formData.insMemberNo} onChange={(e) => setFormData({...formData, insMemberNo: e.target.value})} /> : (patient.insMemberNo || 'POL-998877')}
                         </div>
                      </div>
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Policy Benefit / Plan</p>
                         <div className="text-lg font-black text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-black w-full" value={formData.insPlan} onChange={(e) => setFormData({...formData, insPlan: e.target.value})} /> : (patient.insPlan || 'Outpatient Gold')}
                         </div>
                      </div>
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rel. to Principal</p>
                         <div className="text-lg font-black text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-black w-full" value={formData.insRelation} onChange={(e) => setFormData({...formData, insRelation: e.target.value})} /> : (patient.insRelation || 'Self')}
                         </div>
                      </div>
                    </>
                  )}
               </div>
            </section>
          </div>

          {/* Clinical Sidebar */}
          <div className="space-y-8">
             <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl group">
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-10">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.20em]">Clinical Snapshot</h4>
                    <Activity className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                 </div>
                 <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Visit</p>
                     <p className="text-2xl font-black">Feb 10, 26</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Visit</p>
                     <p className="text-2xl font-black">18 Instances</p>
                   </div>
                 </div>
                 <div className="mt-12 pt-10 border-t border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Info className="h-3 w-3" /> Reoccurring Diagnoses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Hypertension', 'LBP', 'Flu'].map(d => (
                        <span key={d} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-tight border border-white/5 transition-all cursor-default">
                          {d}
                        </span>
                      ))}
                    </div>
                 </div>
               </div>
               <div className="absolute -right-24 -top-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
             </div>

             <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Activity Log</h4>
                  <button className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="relative pl-10 group cursor-pointer active:scale-[0.98] transition-all">
                      <div className="absolute left-0 top-1 h-6 w-6 bg-white rounded-lg border-2 border-slate-100 flex items-center justify-center z-10 group-hover:border-primary-500 transition-colors shadow-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-primary-500 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 leading-none group-hover:text-primary-600 transition-colors">OPD Consultation Note</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">Feb {10-i}, 2026 • Dr. Dolly Smith</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center group/row py-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover/row:text-slate-900 transition-colors">{label}</span>
      <span className="text-sm font-black text-slate-900 group-hover/row:translate-x-[-2px] transition-transform">{value}</span>
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text", isSelect = false, options = [], isTextArea = false }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      {isSelect ? (
        <select 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all"
        >
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : isTextArea ? (
        <textarea 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all min-h-[100px] resize-none"
        />
      ) : (
        <input 
          type={type} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold outline-none transition-all"
        />
      )}
    </div>
  );
}
