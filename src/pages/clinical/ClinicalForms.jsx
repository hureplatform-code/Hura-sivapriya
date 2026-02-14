import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
  { id: 'consent', label: 'Patient Consent Form', description: 'General surgical and treatment consent.' },
  { id: 'admission', label: 'Admission Form', description: 'Internal ward admission request.' },
  { id: 'discharge', label: 'Discharge Summary', description: 'Final clinical summary for home care.' },
  { id: 'referral', label: 'Referral Letter', description: 'External specialist referral documentation.' }
];

export default function ClinicalForms() {
  const [selectedForm, setSelectedForm] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePrint = (formId) => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Forms</h1>
            <p className="text-slate-500 mt-1">Generate professional, pre-filled medical documentation.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
               <History className="h-5 w-5" /> Recent Forms
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Templates Grid */}
          <div className="lg:col-span-1 space-y-4">
             <div className="px-4 py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Template</span>
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
                        <p className={`font-black text-lg ${selectedForm?.id === form.id ? 'text-white' : 'text-slate-900'}`}>{form.label}</p>
                        <p className={`text-xs font-bold leading-relaxed ${selectedForm?.id === form.id ? 'text-slate-400' : 'text-slate-500'}`}>{form.description}</p>
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
                       <h3 className="font-black text-slate-900 uppercase tracking-tight">Form Generation Workspace</h3>
                    </div>
                    {selectedForm && (
                       <button 
                        onClick={() => handlePrint(selectedForm.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95"
                       >
                          <Printer className="h-4 w-4" /> Print Form
                       </button>
                    )}
                </div>

                <div className="flex-1 p-12">
                   {selectedForm ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 max-w-2xl mx-auto">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Step 1: Link to Patient Record</label>
                            <div className="relative group">
                               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                               <input 
                                type="text"
                                placeholder="Search by Patient Name or Hospital No..."
                                className="w-full bg-slate-50/50 border-2 border-slate-100 focus:border-primary-500 rounded-3xl py-6 pl-16 pr-8 text-lg font-bold transition-all outline-none"
                               />
                            </div>
                         </div>

                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center space-y-4 border-dashed">
                             <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-300">
                                <User className="h-8 w-8" />
                             </div>
                             <p className="text-sm font-bold text-slate-400">Search for a patient to auto-populate the <span className="text-slate-900">{selectedForm.label}</span>.</p>
                         </div>

                         <div className="pt-12 border-t border-slate-50 flex items-start gap-4 text-slate-400">
                            <FileSearch className="h-6 w-6 mt-1" />
                            <div className="space-y-1">
                               <p className="font-bold text-sm">Automated Data Mapping</p>
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
                           <h4 className="font-black text-slate-900 text-xl tracking-tight">No Template Selected</h4>
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
