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
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [loading, setLoading] = useState(false);
  const [showLink, setShowLink] = useState(false);

  if (userData?.role === 'superadmin') {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 shadow-inner">
              <FileText className="h-10 w-10" />
           </div>
           <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Access Restricted</h2>
           <p className="text-slate-500 max-w-md mt-2 font-medium">
             Clinical documentation and form generation are restricted to facility clinical staff. Platform governance access is restricted to global audit and revenue analytics.
           </p>
           <button 
             onClick={() => navigate('/')}
             className="mt-8 px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
           >
             Return to Dashboard
           </button>
        </div>
      </DashboardLayout>
    );
  }
  
  const mockIntakeQueue = [
     { id: 'INT-4091', patient: 'Sarah Jenkins', age: 34, phone: '+1 555-0198', status: 'Pending Review', submitted: '10 mins ago' },
     { id: 'INT-4088', patient: 'Michael Chang', age: 45, phone: '+1 555-0211', status: 'Verified', submitted: '1 hour ago' }
  ];

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
                  className={`w-full text-left p-6 rounded-3xl border transition-all ${selectedForm?.id === form.id ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-200' : 'bg-white border-slate-100 hover:bg-slate-50 shadow-sm'}`}
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
             <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                       <ClipboardCheck className="h-6 w-6 text-emerald-500" />
                       <h3 className="font-medium text-slate-900 uppercase tracking-tight">Form Generation Workspace</h3>
                    </div>
                    {selectedForm && (
                       <button 
                        onClick={() => handlePrint(selectedForm.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all active:scale-95"
                       >
                          <Printer className="h-4 w-4" /> Print Form
                       </button>
                    )}
                </div>

                <div className="flex-1 p-12">
                   {selectedForm ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-2xl mx-auto">
                         <div className="space-y-4">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Step 1: Link to Patient Record</label>
                            <div className="relative group">
                               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                               <input 
                                type="text"
                                placeholder="Search by Patient Name or Hospital No..."
                                className="w-full bg-slate-50/50 border-2 border-slate-100 focus:border-primary-500 rounded-3xl py-6 pl-16 pr-8 text-lg font-semibold transition-all outline-none"
                               />
                            </div>
                         </div>

                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-4 border-dashed">
                             <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-300">
                                <User className="h-8 w-8" />
                             </div>
                             <p className="text-sm font-medium text-slate-400">Search for a patient to {selectedForm.id === 'intake' ? 'generate a secure intake link' : 'auto-populate the form'}.</p>
                             
                             {selectedForm.id === 'intake' && (
                                <button 
                                  onClick={() => setShowLink(true)}
                                  className="mt-4 px-6 py-3 bg-primary-600 text-white font-medium text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition"
                                >
                                  Generate Secure Link for Patient
                                </button>
                             )}
                             
                             {selectedForm.id === 'referral' && (
                                <div className="mt-4 flex flex-col md:flex-row gap-4 items-center justify-center">
                                   <button 
                                     onClick={() => window.print()}
                                     className="px-6 py-3 bg-slate-900 text-white font-medium text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition"
                                   >
                                     Generate Referral Letter (PDF)
                                   </button>
                                   <button 
                                     onClick={() => window.print()}
                                     className="px-6 py-3 bg-primary-600 text-white font-medium text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition"
                                   >
                                     Generate Claims Pack (PDF)
                                   </button>
                                </div>
                             )}
                         </div>

                         {showLink && selectedForm.id === 'intake' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-3">
                               <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
                                  <CheckCircle2 className="h-5 w-5" /> 
                                  Link Generated Successfully!
                               </div>
                               <p className="text-sm text-slate-600 font-medium">The patient has received an SMS with the secure Intake Form link and OTP instruction.</p>
                               <div className="p-4 bg-white rounded-xl border border-emerald-100 font-mono text-xs text-slate-500 flex items-center justify-between mt-2">
                                  https://patient.hure.care/intake?token=X8A9B2M
                                  <button className="text-primary-600 font-medium hover:underline">Copy Link</button>
                               </div>
                            </motion.div>
                         )}

                         {selectedForm.id === 'intake' && (
                            <div className="mt-8 space-y-4 pt-8 border-t border-slate-100">
                               <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest pl-2">Pending Intakes Queue</h4>
                               <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                  <table className="w-full text-left">
                                     <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold uppercase text-slate-400">
                                        <tr><th className="p-4">Patient</th><th className="p-4">Contact</th><th className="p-4">Submitted</th><th className="p-4 text-right">Action</th></tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
                                        {mockIntakeQueue.map(item => (
                                           <tr key={item.id} className="hover:bg-slate-50/50">
                                              <td className="p-4 text-slate-900">{item.patient} <span className="text-xs text-slate-400">({item.age}y)</span></td>
                                              <td className="p-4">{item.phone}</td>
                                              <td className="p-4">{item.submitted}</td>
                                              <td className="p-4 text-right">
                                                 <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] uppercase tracking-widest hover:bg-slate-800">Review</button>
                                              </td>
                                           </tr>
                                        ))}
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
                         <div className="h-24 w-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
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
    </DashboardLayout>
  );
}
