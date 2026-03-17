import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import appointmentService from '../../services/appointmentService';
import auditService from '../../services/auditService';
import smsSettingsService from '../../services/smsSettingsService';
import medicalMasterService from '../../services/medicalMasterService';
import { 
  Activity, 
  Search, 
  CheckCircle2, 
  Clock, 
  User,
  Users,
  Calendar,
  Zap,
  ArrowLeft,
  SearchIcon,
  PlusCircle,
  X,
  Plus,
  FileText,
  Upload,
  FileUp,
  FlaskConical,
  Beaker,
  Thermometer,
  Weight,
  Droplet,
  Phone,
  Sparkles,
  CreditCard,
  Printer as PrinterIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LabReport, PrintStyles } from '../../components/printing/PrintTemplates';
import PaymentCollectionModal from '../../components/modals/PaymentCollectionModal';

export const TEST_CATALOG = {
  'CBC': {
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    price: 1500,
    fields: [
      { id: 'hb', label: 'Hemoglobin', unit: 'g/dL', ref: '13.0-17.0' },
      { id: 'wbc', label: 'Total WBC', unit: 'cells/cu.mm', ref: '4000-11000' },
      { id: 'rbc', label: 'RBC Count', unit: 'mill/cu.mm', ref: '4.5-5.5' },
      { id: 'platelets', label: 'Platelet Count', unit: 'lakhs/cu.mm', ref: '1.5-4.5' },
      { id: 'pcv', label: 'PCV', unit: '%', ref: '40-50' },
      { id: 'mcv', label: 'MCV', unit: 'fL', ref: '80-100' }
    ]
  },
  'LIPID': {
    name: 'Lipid Profile',
    category: 'Biochemistry',
    price: 2500,
    fields: [
      { id: 'chol', label: 'Total Cholesterol', unit: 'mg/dL', ref: '< 200' },
      { id: 'trig', label: 'Triglycerides', unit: 'mg/dL', ref: '< 150' },
      { id: 'hdl', label: 'HDL (Good) Chol.', unit: 'mg/dL', ref: '> 40' },
      { id: 'ldl', label: 'LDL (Bad) Chol.', unit: 'mg/dL', ref: '< 100' },
      { id: 'vldl', label: 'VLDL', unit: 'mg/dL', ref: '10-40' }
    ]
  },
  'LFT': {
    name: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
    fields: [
      { id: 'bil_t', label: 'Bilirubin Total', unit: 'mg/dL', ref: '0.2-1.2' },
      { id: 'bil_d', label: 'Bilirubin Direct', unit: 'mg/dL', ref: '0.0-0.3' },
      { id: 'sgot', label: 'SGOT (AST)', unit: 'U/L', ref: '5-40' },
      { id: 'sgpt', label: 'SGPT (ALT)', unit: 'U/L', ref: '7-56' },
      { id: 'alp', label: 'Alkaline Phos.', unit: 'U/L', ref: '44-147' },
      { id: 'prot_t', label: 'Total Protein', unit: 'g/dL', ref: '6.0-8.3' },
      { id: 'alb', label: 'Albumin', unit: 'g/dL', ref: '3.5-5.2' }
    ]
  },
  'RFT': {
    name: 'Renal Function Test (KFT/RFT)',
    category: 'Biochemistry',
    fields: [
      { id: 'urea', label: 'Urea', unit: 'mg/dL', ref: '15-45' },
      { id: 'creat', label: 'Creatinine', unit: 'mg/dL', ref: '0.6-1.2' },
      { id: 'uric', label: 'Uric Acid', unit: 'mg/dL', ref: '3.4-7.0' },
      { id: 'bun', label: 'BUN', unit: 'mg/dL', ref: '7-20' }
    ]
  },
  'GLUCOSE': {
    name: 'Blood Sugar Panel',
    category: 'Biochemistry',
    price: 1200,
    fields: [
      { id: 'fbs', label: 'Fasting (FBS)', unit: 'mg/dL', ref: '70-100' },
      { id: 'ppbs', label: 'Post Prandial (PPBS)', unit: 'mg/dL', ref: '70-140' },
      { id: 'rbs', label: 'Random (RBS)', unit: 'mg/dL', ref: '70-140' },
      { id: 'hba1c', label: 'HbA1c', unit: '%', ref: '4.0-5.6' }
    ]
  },
  'THYROID': {
    name: 'Thyroid Profile (T3, T4, TSH)',
    category: 'Endocrinology',
    price: 3200,
    fields: [
      { id: 't3', label: 'Total T3', unit: 'ng/dL', ref: '80-200' },
      { id: 't4', label: 'Total T4', unit: 'μg/dL', ref: '5.1-14.1' },
      { id: 'tsh', label: 'TSH', unit: 'μIU/mL', ref: '0.27-4.20' }
    ]
  },
  'ELECTROLYTES': {
    name: 'Serum Electrolytes',
    category: 'Biochemistry',
    fields: [
      { id: 'na', label: 'Sodium (Na+)', unit: 'mmol/L', ref: '135-145' },
      { id: 'k', label: 'Potassium (K+)', unit: 'mmol/L', ref: '3.5-5.1' },
      { id: 'cl', label: 'Chloride (Cl-)', unit: 'mmol/L', ref: '96-106' }
    ]
  },
  'CRP': {
    name: 'C-Reactive Protein (CRP)',
    category: 'Serology',
    fields: [
      { id: 'crp_val', label: 'CRP Quantitative', unit: 'mg/L', ref: '< 6.0' }
    ]
  },
  'WIDAL': {
    name: 'Widal Test (Typhoid)',
    category: 'Microbiology',
    fields: [
      { id: 'to', label: 'S. Typhi "O"', unit: 'Titre', ref: '< 1:80' },
      { id: 'th', label: 'S. Typhi "H"', unit: 'Titre', ref: '< 1:80' },
      { id: 'ao', label: 'S. Paratyphi "AO"', unit: 'Titre', ref: '< 1:80' },
      { id: 'ah', label: 'S. Paratyphi "AH"', unit: 'Titre', ref: '< 1:80' }
    ]
  },
  'MALARIA': {
    name: 'Malaria Parasite (MP)',
    category: 'Hematology',
    fields: [
      { id: 'mp_smear', label: 'Peripheral Smear', unit: '', ref: 'Negative' },
      { id: 'mp_ag', label: 'MP Antigen (Rapid)', unit: '', ref: 'Negative' }
    ]
  },
  'DENGUE': {
    name: 'Dengue Serology',
    category: 'Serology',
    fields: [
      { id: 'ns1', label: 'NS1 Antigen', unit: '', ref: 'Non-Reactive' },
      { id: 'igg', label: 'IgG Antibody', unit: '', ref: 'Non-Reactive' },
      { id: 'igm', label: 'IgM Antibody', unit: '', ref: 'Non-Reactive' }
    ]
  },
  'VACCINE_SCREEN': {
    name: 'Hepatitis & HIV Screen',
    category: 'Immunology',
    fields: [
      { id: 'hbsag', label: 'HBsAg (Hep B)', unit: '', ref: 'Non-Reactive' },
      { id: 'hiv', label: 'HIV I & II', unit: '', ref: 'Non-Reactive' },
      { id: 'hcv', label: 'HCV (Hep C)', unit: '', ref: 'Non-Reactive' },
      { id: 'vdrl', label: 'VDRL / RPR', unit: '', ref: 'Non-Reactive' }
    ]
  },
  'CARDIAC': {
    name: 'Cardiac Markers',
    category: 'Biochemistry',
    fields: [
      { id: 'trop_i', label: 'Troponin I', unit: 'ng/mL', ref: '< 0.04' },
      { id: 'ck_mb', label: 'CK-MB', unit: 'U/L', ref: '< 25' }
    ]
  },
  'PSA': {
    name: 'Prostate Specific Antigen',
    category: 'Tumor Markers',
    fields: [
      { id: 'psa_t', label: 'PSA (Total)', unit: 'ng/mL', ref: '0.0-4.0' }
    ]
  },
  'COAGULATION': {
    name: 'Coagulation Profile',
    category: 'Hematology',
    fields: [
      { id: 'pt', label: 'Prothrombin Time', unit: 'Sec', ref: '11-15' },
      { id: 'inr', label: 'INR', unit: 'Ratio', ref: '0.8-1.2' },
      { id: 'aptt', label: 'APTT', unit: 'Sec', ref: '25-35' }
    ]
  },
  'VITAMINS': {
    name: 'Vitamin Profile',
    category: 'Biochemistry',
    fields: [
      { id: 'vit_d', label: 'Vitamin D (25-OH)', unit: 'ng/mL', ref: '30-100' },
      { id: 'vit_b12', label: 'Vitamin B12', unit: 'pg/mL', ref: '200-900' }
    ]
  },
  'IRON': {
    name: 'Iron Profile',
    category: 'Biochemistry',
    fields: [
      { id: 'iron', label: 'Serum Iron', unit: 'μg/dL', ref: '60-170' },
      { id: 'ferritin', label: 'Ferritin', unit: 'ng/mL', ref: '30-400' },
      { id: 'tibc', label: 'TIBC', unit: 'μg/dL', ref: '240-450' }
    ]
  },
  'URINE': {
    name: 'Urine Routine & Micro.',
    category: 'Clinical Pathology',
    fields: [
      { id: 'color', label: 'Color/Appearance', unit: '', ref: 'Pale Yellow/Clear' },
      { id: 'sp_gr', label: 'Specific Gravity', unit: '', ref: '1.005-1.030' },
      { id: 'ph', label: 'pH', unit: '', ref: '4.5-8.0' },
      { id: 'sugar', label: 'Sugar', unit: '', ref: 'Nil' },
      { id: 'alb', label: 'Albumin', unit: '', ref: 'Nil' },
      { id: 'pus', label: 'Pus Cells', unit: '/hpf', ref: '0-2' },
      { id: 'rbc', label: 'RBCs', unit: '/hpf', ref: 'Nil' },
      { id: 'epit', label: 'Epithelial Cells', unit: '/hpf', ref: '1-4' }
    ]
  },
  'STOOL': {
    name: 'Stool Examination',
    category: 'Clinical Pathology',
    fields: [
      { id: 'macro', label: 'Macroscopic', unit: '', ref: 'Normal' },
      { id: 'occult', label: 'Occult Blood', unit: '', ref: 'Negative' },
      { id: 'ova', label: 'Ova/Cysts', unit: '', ref: 'Not Found' }
    ]
  }
};

export default function LabEntry() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef(null);
  
  const [appointment, setAppointment] = useState(null);
  const [structuredResults, setStructuredResults] = useState([]);
  const [reportFiles, setReportFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testSearch, setTestSearch] = useState('');
  const [dynamicCatalog, setDynamicCatalog] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  useEffect(() => {
    fetchAppointment();
    fetchDynamicCatalog();
  }, [appointmentId]);

  const fetchDynamicCatalog = async () => {
    try {
      const dbTests = await medicalMasterService.getAll('labs');
      const catalog = {};
      dbTests.forEach(test => {
        catalog[test.code || test.id] = {
          name: test.name,
          category: test.category,
          price: test.price,
          fields: test.fields || []
        };
      });
      setDynamicCatalog(catalog);
    } catch (err) {
      console.error('Error fetching lab catalog:', err);
    }
  };

  const getMergedCatalog = () => {
    return { ...TEST_CATALOG, ...dynamicCatalog };
  };

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointmentById(appointmentId);
      if (data) {
        setAppointment(data);
        setStructuredResults(data.structuredResults || []);
        setReportFiles(data.reportFiles || []);
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to load appointment details.');
    } finally {
      setLoading(false);
    }
  };

  const addTest = (testKey) => {
    const catalog = getMergedCatalog();
    const test = catalog[testKey];
    if (!test) return;
    
    const newTestEntry = {
      id: Date.now(),
      type: testKey,
      name: test.name,
      values: {},
      remarks: ''
    };
    
    setStructuredResults(prev => [...prev, newTestEntry]);
  };

  const updateTestValue = (testId, fieldId, value) => {
    setStructuredResults(prev => prev.map(t => 
      t.id === testId ? { ...t, values: { ...t.values, [fieldId]: value } } : t
    ));
  };

  const updateTestRemark = (testId, remark) => {
    setStructuredResults(prev => prev.map(t => 
      t.id === testId ? { ...t, remarks: remark } : t
    ));
  };

  const analyzeTestWithAI = (testId) => {
    const entry = structuredResults.find(t => t.id === testId);
    const catalog = getMergedCatalog();
    const schema = catalog[entry.type];
    if (!entry || !schema) return;

    // SIMULATED AI LOGIC: Analyzes values against reference ranges
    let analysis = `Diagnostic interpretation for ${schema.name}: `;
    const abnormals = [];

    schema.fields.forEach(field => {
      const val = parseFloat(entry.values[field.id]);
      if (isNaN(val)) return;

      const refParts = field.ref.split('-');
      if (refParts.length === 2) {
        const min = parseFloat(refParts[0]);
        const max = parseFloat(refParts[1]);
        if (val < min) abnormals.push(`${field.label} is slightly below reference range.`);
        if (val > max) abnormals.push(`${field.label} shows elevation above baseline.`);
      }
    });

    if (abnormals.length > 0) {
      analysis += abnormals.join(' ') + " Clinical correlation recommended.";
    } else {
      analysis += "Parameters observed are within standard biological reference intervals. No immediate abnormalities detected.";
    }

    updateTestRemark(testId, analysis);
    success("AI Analysis generated for " + schema.name);
  };

  const removeTest = (testId) => {
    setStructuredResults(prev => prev.filter(t => t.id !== testId));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    // Simple mock upload: just storing name and size for now
    const newFiles = files.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      id: Date.now() + Math.random(),
      type: f.type
    }));
    setReportFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setReportFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleComplete = async (status) => {
    if (!appointment) return;
    try {
      const isDoctorRoute = status === 'arrived';
      
      const updateData = {
        structuredResults,
        reportFiles,
        labCompletedAt: new Date().toISOString(),
        labTechnicianName: userData?.name || 'Lab Tech',
        status: status
      };

      await appointmentService.updateAppointment(appointment.id, updateData);
      
      // Send SMS for completion actions
      const phone = appointment.patientPhone || appointment.phoneNumber;
      if (status === 'arrived' || status === 'completed') {
        if (phone) {
          smsSettingsService.sendLabCompletionSms(userData.facilityId, { ...appointment, phoneNumber: phone }, isDoctorRoute)
            .catch(err => console.error("Completion SMS failed:", err));
        }
      }

      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Lab Tech',
        action: isDoctorRoute ? 'LAB_RETURNED_DOCTOR' : (status === 'completed' ? 'LAB_INVESTIGATION_COMPLETED' : 'LAB_SENT_BILLING'),
        module: 'LABORATORY',
        description: isDoctorRoute 
          ? `Completed lab and returned ${appointment.patient} to Doctor.`
          : `Completed lab actions for ${appointment.patient}.`,
        metadata: { appointmentId: appointment.id, targetStatus: status }
      });
      
      if (isDoctorRoute) {
        success(`Results sent to Doctor.`);
        navigate('/lab/queue');
      } else if (status === 'awaiting-billing') {
        success(`Investigation finalized. Sent to Billing Queue.`);
        setShowCompleteConfirm(true);
      } else {
        success(`Data updated successfully.`);
        navigate('/lab/queue');
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to update investigation.');
    }
  };

  const handleSaveOnly = async () => {
    if (!appointment) return;
    try {
      await appointmentService.updateAppointment(appointment.id, {
        structuredResults,
        reportFiles,
        labTechnicianName: userData?.name || 'Lab Tech'
      });
      success('Work saved.');
    } catch (err) {
      toastError('Failed to save.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <Activity className="h-10 w-10 text-slate-200 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) return null;

  return (
    <DashboardLayout>
      <PrintStyles />
      {/* Hidden Print Container */}
      <div className="print-only">
        <LabReport 
          data={appointment} 
          facility={userData || {}} 
          catalog={getMergedCatalog()} 
        />
      </div>

      <div className="space-y-6 max-w-[1500px] mx-auto overflow-hidden no-print">
        {/* Navigation & Core Patient Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-6">
             <button 
               onClick={() => navigate('/lab/queue')}
               className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
             >
               <ArrowLeft className="h-4 w-4" />
             </button>
             <div>
                <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{appointment.patient}</h2>
                   <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase tracking-widest border border-blue-100">
                      {appointment.patientId || 'OP-NEW'}
                   </span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-3">
                   <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Dr. {appointment.provider || appointment.doctor || 'N/A'}</span>
                   <span className="h-1 w-1 rounded-full bg-slate-200" />
                   <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {appointment.date?.split('-').reverse().join('-')}</span>
                   <span className="h-1 w-1 rounded-full bg-slate-200" />
                   <span className="flex items-center gap-1 text-slate-500 font-bold"><Phone className="h-3 w-3 opacity-40" /> {appointment.patientPhone || appointment.phoneNumber || 'N/A'}</span>
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-2 no-print">
             <button 
                onClick={() => window.print()}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
             >
                <PrinterIcon className="h-3.5 w-3.5" /> Print Report
             </button>
             {appointment?.status?.toLowerCase() === 'paid' ? (
               <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-sm">
                 <CheckCircle2 className="h-3.5 w-3.5" /> Paid
               </div>
             ) : (
               <button 
                  onClick={() => handleComplete("awaiting-billing")}
                  className="px-6 py-3 bg-violet-50 border border-violet-100 text-violet-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-violet-100 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                   <CreditCard className="h-3.5 w-3.5" /> Billing
                </button>
             )}
             {(appointment.provider || appointment.doctor) ? (
               <button 
                 onClick={() => handleComplete('arrived')}
                 className="px-8 py-3 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
               >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete & Return
               </button>
             ) : (
               <button 
                 onClick={() => handleComplete('completed')}
                 className="px-8 py-3 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
               >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete Investigation
               </button>
             )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
           {/* Left Pane: Test Selection Catalog */}
           <div className="w-full lg:w-80 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-50 bg-slate-50/10 text-center">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Investigations Catalog</h3>
              </div>
              
              <div className="p-4 border-b border-slate-50">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Search tests..."
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-blue-100 transition-all"
                    />
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                 {Object.entries(getMergedCatalog())
                   .filter(([key, test]) => test.name.toLowerCase().includes(testSearch.toLowerCase()) || key.toLowerCase().includes(testSearch.toLowerCase()))
                   .map(([key, test]) => (
                     <button 
                       key={key}
                       onClick={() => addTest(key)}
                       className="w-full px-4 py-3 text-left hover:bg-blue-50/50 rounded-xl group transition-all flex items-center justify-between border border-transparent hover:border-blue-100"
                     >
                        <div className="flex-1 min-w-0">
                           <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700 leading-tight block truncate">{test.name}</span>
                           <span className="text-[8px] font-medium text-slate-400 group-hover:text-blue-400 mt-1 uppercase tracking-wider">{test.category}</span>
                        </div>
                        <Plus className="h-3 w-3 text-slate-300 group-hover:text-blue-500 flex-shrink-0 ml-2" />
                     </button>
                   ))}
              </div>

              {/* Quick Document Upload Area at Bottom of Catalog */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-50">
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 group"
                 >
                    <FileUp className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Upload Reports</span>
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   multiple 
                   onChange={handleFileUpload}
                 />
              </div>
           </div>

           {/* Main Workspace: Diagnostic Entry & Data Input */}
           <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
              {/* Report Stats Header */}
              <div className="p-4 bg-slate-50/20 border-b border-slate-50 flex items-center justify-between px-8">
                 <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none">Status</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">{appointment.status.replace('-', ' ')}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-100" />
                    <div className="flex gap-6">
                       <div className="flex items-center gap-2">
                          <Thermometer className="h-3 w-3 text-rose-300" />
                          <div>
                             <span className="text-[8px] font-bold text-slate-300 uppercase block leading-none">Temp</span>
                             <span className="text-[10px] font-bold text-slate-600 tabular-nums">{appointment.vitals?.temperature || '---'} °C</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <Droplet className="h-3 w-3 text-blue-300" />
                          <div>
                             <span className="text-[8px] font-bold text-slate-300 uppercase block leading-none">BP</span>
                             <span className="text-[10px] font-bold text-slate-600 tabular-nums">{appointment.vitals?.bloodPressure || '---'}</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <span className="text-[9px] font-medium text-slate-400 italic">Technician: {userData?.name || 'Lab User'}</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                 <AnimatePresence>
                    {structuredResults.length === 0 && reportFiles.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                         <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center">
                            <FlaskConical className="h-10 w-10 text-slate-200" />
                         </div>
                         <div className="text-center">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ready for Investigation</p>
                            <p className="text-[10px] text-slate-300 mt-1 font-medium">Select a test or upload a record to initiate data entry.</p>
                         </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-10 max-w-5xl mx-auto">
                         
                         {/* Structured Results Forms */}
                         <div className="space-y-6">
                            {structuredResults.map((entry) => {
                              const catalog = getMergedCatalog(); const schema = catalog[entry.type]; if (!schema) return null;
                              return (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  key={entry.id} 
                                  className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative group transition-all hover:border-blue-100"
                                >
                                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                      <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                            <FlaskConical className="h-4 w-4" />
                                         </div>
                                         <div className="flex flex-col">
                                            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest leading-none">{schema.name}</h3>
                                            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest mt-1">{schema.category}</span>
                                         </div>
                                      </div>
                                      <button 
                                        onClick={() => removeTest(entry.id)}
                                        className="h-7 w-7 rounded-lg hover:bg-red-50 text-slate-200 hover:text-red-500 transition-all flex items-center justify-center active:scale-90"
                                      >
                                         <X className="h-3.5 w-3.5" />
                                      </button>
                                   </div>
                                   
                                   <div className="flex flex-col gap-6 max-w-4xl">
                                      { (schema.fields || []).map(field => (
                                        <div key={field.id} className="space-y-2">
                                           <div className="flex items-center justify-between px-0.5">
                                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{field.label}</label>
                                              <span className="text-[8px] font-bold text-slate-200 tracking-tighter tabular-nums">REF: {field.ref}</span>
                                           </div>
                                           <div className="relative group/input">
                                              <input 
                                                type="text"
                                                placeholder="..."
                                                value={entry.values[field.id] || ''}
                                                onChange={(e) => updateTestValue(entry.id, field.id, e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50/50 border border-transparent border-b-slate-100 rounded text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-200 transition-all text-center"
                                              />
                                              <span className="absolute right-0 bottom-0 text-[7px] font-black text-slate-300 uppercase mr-1 mb-1">{field.unit}</span>
                                           </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* AI Remark Section */}
                                    <div className="mt-8 pt-6 border-t border-slate-50 space-y-3">
                                       <div className="flex items-center justify-between">
                                          <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Authorized Clinical Remark (Per Test)</h4>
                                          <button 
                                            onClick={() => analyzeTestWithAI(entry.id)}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95"
                                          >
                                             <Sparkles className="h-2.5 w-2.5" /> AI Auto-Remark
                                          </button>
                                       </div>
                                       <textarea 
                                          value={entry.remarks || ''}
                                          onChange={(e) => updateTestRemark(entry.id, e.target.value)}
                                          placeholder="Enter specific observations for this investigation..."
                                          className="w-full h-20 p-4 bg-slate-50/50 border border-transparent rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-blue-100 transition-all resize-none shadow-inner"
                                       />
                                    </div>
                                 </motion.div>
                              );
                            })}
                         </div>

                         {/* Uploaded Documents List */}
                         {reportFiles.length > 0 && (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                              <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Attached Documentation</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 {reportFiles.map(file => (
                                   <div key={file.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group transition-all hover:bg-white">
                                      <div className="flex items-center gap-3">
                                         <div className="h-8 w-8 bg-white border border-slate-100 rounded flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <FileText className="h-4 w-4" />
                                         </div>
                                         <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[150px] leading-tight">{file.name}</span>
                                            <span className="text-[8px] font-bold text-slate-300 tabular-nums">{file.size}</span>
                                         </div>
                                      </div>
                                      <button 
                                        onClick={() => removeFile(file.id)}
                                        className="h-6 w-6 rounded-md hover:bg-red-50 text-slate-200 hover:text-red-400 transition-all flex items-center justify-center"
                                      >
                                         <X className="h-3 w-3" />
                                      </button>
                                   </div>
                                 ))}
                              </div>
                           </motion.div>
                         )}

                      </div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
        </div>
      </div>
      <PaymentCollectionModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          navigate('/lab/queue');
        }}
        appointment={appointment}
        type="investigation"
        onSuccess={() => {
          setShowPaymentModal(false);
          navigate('/lab/queue');
        }}
      />

      <AnimatePresence>
        {showCompleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-10 text-center space-y-6"
            >
              <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                <CreditCard className="h-8 w-8" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Collect Payment?</h3>
                <p className="text-slate-500 font-medium mt-2 leading-relaxed px-4">
                  Investigations for <span className="text-slate-900 font-bold">{appointment?.patient}</span> are complete. Would you like to collect the payment now?
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/lab/queue')}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Send to Queue
                </button>
                <button 
                  onClick={() => {
                    setShowCompleteConfirm(false);
                    setShowPaymentModal(true);
                  }}
                  className="flex-[1.5] py-4 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Initialize Collection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
