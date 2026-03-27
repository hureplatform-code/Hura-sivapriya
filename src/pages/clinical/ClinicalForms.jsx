import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, 
  ClipboardCheck, 
  Printer, 
  Search, 
  ArrowRight,
  User,
  History,
  CheckCircle2,
  FileSearch,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import patientService from '../../services/patientService';
import firestoreService from '../../services/firestoreService';
import { 
  ConsentFormTemplate, 
  AdmissionFormTemplate, 
  DischargeSummaryTemplate, 
  ReferralLetterTemplate 
} from './FormTemplates';

const formTemplates = [
  { id: 'intake', label: 'Patient Intake Form', description: 'Secure digital questionnaire & health history.' },
  { id: 'consent', label: 'Patient Consent Form', description: 'General surgical and treatment consent.' },
  { id: 'admission', label: 'Admission Form', description: 'Internal ward admission request.' },
  { id: 'discharge', label: 'Discharge Summary', description: 'Final clinical summary for home care.' },
  { id: 'referral', label: 'Referral & Claims Pack', description: 'External specialist referral and insurance claim documentation.' }
];

export default function ClinicalForms() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [selectedForm, setSelectedForm] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [intakes, setIntakes] = useState([]);
  const [reviewingIntake, setReviewingIntake] = useState(null);

  React.useEffect(() => {
    fetchPatients();
    fetchIntakes();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await patientService.getAllPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIntakes = async () => {
    try {
      const data = await firestoreService.query('intake_forms', ['status', '==', 'Pending Review']);
      setIntakes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatientSearch = (e) => {
    const term = e.target.value;
    setPatientSearch(term);
    if (!term) {
       setFilteredPatients([]);
       return;
    }
    const queryLower = term.toLowerCase();
    const cleanQuery = queryLower.replace(/[^a-z0-9]/g, '');
    const queryDigits = term.replace(/[^0-9]/g, '');

    const filtered = patients.filter(p => {
       const cleanId1 = (p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
       const cleanId2 = (p.patientId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
       const mobileDigits = (p.mobile || '').replace(/[^0-9]/g, '');
       const contactDigits = (p.contact || '').replace(/[^0-9]/g, '');

       const nameMatch = p.name?.toLowerCase().includes(queryLower);
       const idMatch = cleanQuery && (cleanId1.includes(cleanQuery) || cleanId2.includes(cleanQuery));
       const phoneMatch = queryDigits && (mobileDigits.includes(queryDigits) || contactDigits.includes(queryDigits));

       return nameMatch || idMatch || phoneMatch;
    });
    setFilteredPatients(filtered);
  };

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setPatientSearch(p.name);
    setFilteredPatients([]);
    setGeneratedLink(null);
  };

  const generateLink = () => {
     if(!selectedPatient) return;
     const token = Math.random().toString(36).substring(2, 9).toUpperCase();
     // Normally we would save this token to db with an expiry, but for frontend demo, we pass it via url
     const baseUrl = window.location.origin;
     setGeneratedLink(`${baseUrl}/intake?token=${token}&pid=${selectedPatient.id}`);
  };

  const handleAcceptIntake = async () => {
      try {
          if (!reviewingIntake) return;
          
          // Update patient demographics
          const patientUpdate = {
             age: reviewingIntake.data.age || '',
             gender: reviewingIntake.data.gender || '',
             address: reviewingIntake.data.address || '',
             nextOfKin: reviewingIntake.data.nextOfKin || '',
             kinPhone: reviewingIntake.data.kinPhone || '',
             allergies: reviewingIntake.data.allergies || '',
             chronicConditions: reviewingIntake.data.chronicConditions || '',
             insuranceScheme: reviewingIntake.data.insuranceScheme || '',
             insuranceMemberNo: reviewingIntake.data.insuranceMemberNo || ''
          };
          
          await firestoreService.update('patients', reviewingIntake.patientId, patientUpdate);
          
          // Close intake
          await firestoreService.update('intake_forms', reviewingIntake.id, { status: 'Accepted', acceptedAt: new Date().toISOString() });
          
          setReviewingIntake(null);
          fetchIntakes();
      } catch (err) {
          console.error("Failed to accept intake", err);
      }
  };

  const handleRejectIntake = async () => {
      try {
          if (!reviewingIntake) return;
          await firestoreService.update('intake_forms', reviewingIntake.id, { status: 'Rejected' });
          setReviewingIntake(null);
          fetchIntakes();
      } catch (err) {
          console.error("Failed to reject intake", err);
      }
  };

  if (userData?.role === 'superadmin') {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
           <div className="h-20 w-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-inner">
              <FileText className="h-10 w-10" />
           </div>
           <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Access Restricted</h2>
           <p className="text-slate-500 max-w-md mt-2 font-medium">
             Clinical documentation and form generation are restricted to facility clinical staff. Platform governance access is restricted to global audit and revenue analytics.
           </p>
           <button 
             onClick={() => navigate('/dashboard')}
             className="mt-8 px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
           >
             Return to Dashboard
           </button>
        </div>
      </DashboardLayout>
    );
  }

  const handlePrint = (formId) => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Clinical Forms</h1>
            <p className="text-slate-500 mt-1">Generate professional, pre-filled medical documentation.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl font-medium text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
               <History className="h-5 w-5" /> Recent Forms
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Templates Grid */}
          <div className="lg:col-span-1 space-y-4">
             <div className="px-4 py-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Select Template</span>
             </div>
             {formTemplates.map((form) => (
                <motion.button
                  whileHover={{ x: 5 }}
                  key={form.id}
                  onClick={() => setSelectedForm(form)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all ${selectedForm?.id === form.id ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-200' : 'bg-white border-slate-100 hover:bg-slate-50 shadow-sm'}`}
                >
                  <div className="flex items-start gap-4">
                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${selectedForm?.id === form.id ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-600'}`}>
                        <FileText className="h-6 w-6" />
                     </div>
                     <div className="flex-1">
                        <p className={`font-medium text-lg ${selectedForm?.id === form.id ? 'text-white' : 'text-slate-900'}`}>{form.label}</p>
                        <p className={`text-xs font-medium leading-relaxed ${selectedForm?.id === form.id ? 'text-slate-400' : 'text-slate-500'}`}>{form.description}</p>
                     </div>
                  </div>
                </motion.button>
             ))}
          </div>

          {/* Form Generation Workspace */}
          <div className="lg:col-span-2">
             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col print:border-none print:shadow-none">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 print:hidden">
                    <div className="flex items-center gap-3">
                       <ClipboardCheck className="h-6 w-6 text-emerald-500" />
                       <h3 className="font-medium text-slate-900 uppercase tracking-tight">Form Generation Workspace</h3>
                    </div>
                    {selectedForm && selectedForm.id !== 'intake' && selectedPatient && (
                       <button 
                        onClick={() => handlePrint(selectedForm.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all active:scale-95"
                       >
                          <Printer className="h-4 w-4" /> Print Form
                       </button>
                    )}
                </div>

                <div className="flex-1 p-12 print:p-0">
                    {selectedForm ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-2xl mx-auto print:max-w-none print:w-full print:p-0 print:m-0">
                         <div className="space-y-4 print:hidden">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Step 1: Link to Patient Record</label>
                            <div className="relative group">
                               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                               <input 
                                type="text"
                                value={patientSearch}
                                onChange={handlePatientSearch}
                                placeholder="Search by Patient Name or Hospital No..."
                                className="w-full bg-slate-50/50 border-2 border-slate-100 focus:border-primary-500 rounded-2xl py-6 pl-16 pr-8 text-lg font-semibold transition-all outline-none"
                               />
                               {filteredPatients.length > 0 && (
                                   <div className="absolute top-[80px] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl z-10 max-h-48 overflow-y-auto">
                                      {filteredPatients.map(p => (
                                         <button key={p.id} type="button" onClick={() => handleSelectPatient(p)} className="w-full text-left p-4 hover:bg-slate-50 transition-all font-medium text-sm border-b border-slate-50 last:border-0 block">
                                             {p.name} <span className="text-slate-400">({p.id})</span>
                                         </button>
                                      ))}
                                   </div>
                                )}
                            </div>
                         </div>

                          {selectedPatient && selectedForm.id !== 'intake' ? (
                             <div className="bg-slate-100/50 p-2 md:p-8 rounded-2xl border border-slate-100 overflow-x-auto relative print:p-0 print:border-none print:m-0 print:bg-white print:overflow-visible">
                                <div className="absolute top-4 right-8 px-4 py-2 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-full print:hidden">
                                   Print Preview
                                </div>
                                <div className="print:w-full min-w-[800px] scale-[0.85] origin-top md:scale-100 transition-all">
                                   {selectedForm.id === 'consent' && <ConsentFormTemplate patient={selectedPatient} doctor={userData} />}
                                   {selectedForm.id === 'admission' && <AdmissionFormTemplate patient={selectedPatient} doctor={userData} />}
                                   {selectedForm.id === 'discharge' && <DischargeSummaryTemplate patient={selectedPatient} doctor={userData} />}
                                   {selectedForm.id === 'referral' && <ReferralLetterTemplate patient={selectedPatient} doctor={userData} />}
                                </div>
                             </div>
                          ) : (
                             <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-4 border-dashed relative print:hidden">
                                 <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-300">
                                    {selectedPatient ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> : <User className="h-8 w-8" />}
                                 </div>
                                 <p className="text-sm font-medium text-slate-400">
                                   {selectedPatient ? `Linked to ${selectedPatient.name}` : `Search for a patient to ${selectedForm.id === 'intake' ? 'generate a secure intake link' : 'auto-populate the form'}.`}
                                 </p>
                                 
                                 {selectedForm.id === 'intake' && selectedPatient && (
                                    <button 
                                      onClick={generateLink}
                                      className="mt-4 px-6 py-3 bg-primary-600 text-white font-medium text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition"
                                    >
                                      Generate Secure Link for Patient
                                    </button>
                                 )}
                             </div>
                          )}

                         {generatedLink && selectedForm.id === 'intake' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                               <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
                                  <CheckCircle2 className="h-5 w-5" /> 
                                  Link Generated Successfully!
                               </div>
                               <p className="text-sm text-slate-600 font-medium">The patient has received an SMS with the secure Intake Form link and OTP instruction.</p>
                               <div className="p-4 bg-white rounded-xl border border-emerald-100 font-mono text-xs text-slate-500 flex items-center justify-between mt-2">
                                  {generatedLink}
                                  <button onClick={() => navigator.clipboard.writeText(generatedLink)} className="text-primary-600 font-medium hover:underline">Copy Link</button>
                               </div>
                            </motion.div>
                         )}

                         {selectedForm.id === 'intake' && (
                            <div className="mt-8 space-y-4 pt-8 border-t border-slate-100">
                               <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest pl-2">Pending Intakes Queue</h4>
                               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                  <table className="w-full text-left">
                                     <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold uppercase text-slate-400">
                                        <tr><th className="p-4">Submission ID</th><th className="p-4">Linked Patient ID</th><th className="p-4">Time</th><th className="p-4 text-right">Action</th></tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                                        {intakes.length === 0 ? (
                                             <tr><td colSpan="4" className="p-8 text-center text-slate-400">No pending intake forms.</td></tr>
                                         ) : (
                                        intakes.map(item => (
                                           <tr key={item.id} className="hover:bg-slate-50/50">
                                              <td className="p-4 text-slate-900">{item.id.slice(0, 8)}</td>
                                              <td className="p-4 text-slate-500">{item.patientId}</td>
                                              <td className="p-4 text-xs">{new Date(item.submittedAt || Date.now()).toLocaleTimeString()}</td>
                                              <td className="p-4 text-right">
                                                 <button onClick={() => setReviewingIntake(item)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">Review</button>
                                              </td>
                                           </tr>
                                        )))}
                                     </tbody>
                                  </table>
                               </div>
                            </div>
                         )}

                         <div className="pt-12 border-t border-slate-50 flex items-start gap-4 text-slate-400">
                            <FileSearch className="h-6 w-6 mt-1" />
                            <div className="space-y-1">
                               <p className="font-medium text-sm">Automated Data Mapping</p>
                               <p className="text-xs">Connecting patient vitals, diagnosis, and demographic data. This recreates the functionality of legacy `form_cnt.php` for professional documentation.</p>
                            </div>
                         </div>
                      </motion.div>
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                         <div className="h-24 w-24 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200">
                            <FileText className="h-12 w-12" />
                         </div>
                         <div className="space-y-2">
                           <h4 className="font-medium text-slate-900 text-xl tracking-tight">No Template Selected</h4>
                           <p className="text-slate-500 font-medium max-w-sm mx-auto">Please select a specialized clinical form template from the left panel to begin generation.</p>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
      {/* Review Modal */}
      <AnimatePresence>
         {reviewingIntake && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <motion.div initial={{scale: 0.95, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.95, opacity: 0}} className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="text-lg font-bold text-slate-900">Review Patient Intake</h3>
                     <button onClick={() => setReviewingIntake(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X className="h-5 w-5"/></button>
                  </div>
                  <div className="p-8 overflow-y-auto space-y-6">
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 text-sm font-medium">
                         Please review the patient-submitted details below. Accepting this form will directly update the patient's demographic file.
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                         <div className="col-span-2 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</span>
                            <p className="font-semibold text-slate-900">{reviewingIntake.data.name}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age</span>
                            <p className="font-semibold text-slate-900">{reviewingIntake.data.age}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</span>
                            <p className="font-semibold text-slate-900">{reviewingIntake.data.gender}</p>
                         </div>
                         <div className="col-span-2 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allergies</span>
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1 text-slate-600 font-medium">{reviewingIntake.data.allergies || 'N/A'}</div>
                         </div>
                         <div className="col-span-2 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chronic Conditions</span>
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mt-1 text-slate-600 font-medium">{reviewingIntake.data.chronicConditions || 'N/A'}</div>
                         </div>
                      </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                     <button onClick={handleRejectIntake} className="px-6 py-3 font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors">Reject Form</button>
                     <button onClick={handleAcceptIntake} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Accept & Update Record
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
