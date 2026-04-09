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
  Search,
  CheckCircle2,
  Folder,
  File,
  FileText,
  Upload,
  Trash2,
  Home,
  Printer,
  X,
  History,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import patientService from '../../services/patientService';
import medicalRecordService from '../../services/medicalRecordService';
import patientDocumentsService from '../../services/patientDocumentsService';
import auditService from '../../services/auditService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyMonthFilter, setHistoryMonthFilter] = useState('All');

  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  if (userData?.role === 'superadmin') {
     return (
       <DashboardLayout>
         <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mb-6 shadow-inner">
               <ShieldCheck className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-slate-500 max-w-md mt-2 font-medium">
              Superadmin access is limited to platform governance. Patient biometric records and clinical details are private.
            </p>
            <button 
              onClick={() => navigate('/superadmin/subscriptions')}
              className="mt-8 px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Return to Control Panel
            </button>
         </div>
       </DashboardLayout>
     );
  }

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Patient Profile First (Essential)
      const patientData = await patientService.getPatientById(id);
      if (patientData) {
        setPatient(patientData);
        setFormData(patientData);
      } else {
        setPatient(null);
      }

      // 2. Fetch non-essential data in background (don't block profile)
      if (patientData) {
        // Fetch records
        medicalRecordService.getRecordsByPatient(id)
          .then(setRecords)
          .catch(e => console.error("Records fail:", e));

        // Fetch documents
        patientDocumentsService.getDocumentsByPatient(id)
          .then(setDocuments)
          .catch(e => console.error("Docs fail:", e));

        // Log the data access
        auditService.logActivity({
          userId: userData?.uid,
          userName: userData?.name || 'Staff',
          action: 'VIEW_PATIENT_BIO',
          module: 'RECORDS',
          description: `Accessed full biometric profile for ${patientData.name}`,
          metadata: { patientId: id }
        });
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportBioCard = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('PATIENT REGISTRATION CARD', 105, 25, { align: 'center' });
    
    // Bio Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('BIO-DEMOGRAPHICS', 14, 55);
    doc.setLineWidth(0.5);
    doc.line(14, 58, 200, 58);
    
    const bioData = [
      ['Identification', patient.id],
      ['Full Name', patient.name],
      ['Birth Date', patient.dob || 'N/A'],
      ['Gender', patient.gender || 'N/A'],
      ['Phone', patient.contact || patient.mobile || 'N/A'],
      ['Email', patient.email || 'N/A'],
      ['Address', patient.address || 'N/A'],
    ];

    autoTable(doc, {
      startY: 65,
      body: bioData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    // Insurance Section
    const nextY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.text('INSURANCE & BILLING', 14, nextY);
    doc.line(14, nextY + 3, 200, nextY + 3);

    const billingData = [
      ['Payment Mode', patient.paymentMode || 'Cash'],
      ['Provider', patient.insName || 'N/A'],
      ['Member No', patient.insMemberNo || 'N/A'],
      ['Benefit Plan', patient.insPlan || 'N/A'],
    ];

    autoTable(doc, {
      startY: nextY + 10,
      body: billingData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    // Footer
    const footY = 280;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString('en-GB')} | HURA Cloud | Official Biometric Record`, 105, footY, { align: 'center' });

    doc.save(`BioCard_${patient.name.replace(/\s/g, '_')}.pdf`);
  };

  const handleUpdate = async () => {
    try {
      const normalizedData = {
        ...formData,
        mobile: (formData.mobile || '').replace(/[\s\-\(\)]/g, ''),
        contact: (formData.contact || '').replace(/[\s\-\(\)]/g, ''),
        nextOfKinPhone: (formData.nextOfKinPhone || '').replace(/[\s\-\(\)]/g, '')
      };
      await patientService.updatePatient(id, normalizedData);
      setPatient(normalizedData);
      setFormData(normalizedData);
      setIsEditing(false);
      success('Patient bio-data updated successfully.');
    } catch (error) {
      console.error('Error updating patient:', error);
      toastError('Failed to update patient data.');
    }
  };

  const handleUploadDocument = async (e) => {
     const file = e.target.files[0];
     if (!file) return;

     try {
       setIsUploading(true);
       const docData = {
         patientId: id,
         fileName: file.name,
         fileType: file.type,
         fileSize: `${(file.size / 1024).toFixed(1)} KB`,
         url: URL.createObjectURL(file), // Mock URL
         uploadedBy: userData?.name || 'Staff'
       };

       const result = await patientDocumentsService.uploadDocument(docData);
       setDocuments(prev => [result, ...prev]);

       await auditService.logActivity({
         userId: userData?.uid,
         userName: userData?.name || 'Staff',
         action: 'UPLOAD_PATIENT_DOCUMENT',
         module: 'RECORDS',
         description: `Uploaded digital archive: ${file.name} for ${patient.name}`,
         metadata: { patientId: id, fileName: file.name }
       });
       
       success('Document archived successfully.');

     } catch (error) {
       console.error('Upload error:', error);
       toastError('Failed to upload document.');
     } finally {
       setIsUploading(false);
     }
  };

  const handleDeleteDocument = async (docId, fileName) => {
    const isConfirmed = await confirm({
      title: 'Delete Document',
      message: `Are you sure you want to PERMANENTLY delete ${fileName}? This will completely remove it from the patient's archives.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      isDestructive: true
    });
    
    if (isConfirmed) {
      try {
        await patientDocumentsService.deleteDocument(docId);
        setDocuments(prev => prev.filter(d => d.id !== docId));

        await auditService.logActivity({
          userId: userData?.uid,
          userName: userData?.name || 'Staff',
          action: 'DELETE_PATIENT_DOCUMENT',
          module: 'RECORDS',
          description: `Deleted digital archive: ${fileName} from ${patient.name}'s profile`,
          metadata: { patientId: id, documentId: docId }
        });
        
        success('Document deleted successfully.');
      } catch (error) {
        console.error('Delete error:', error);
        toastError('Failed to delete document.');
      }
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12">
        <div className="relative">
          <div className="h-24 w-24 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Heart className="h-8 w-8 text-slate-100 animate-pulse" />
          </div>
        </div>
        <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Patient Data...</p>
      </div>
    </DashboardLayout>
  );

  if (!patient) return (
    <DashboardLayout>
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm mx-auto max-w-lg mt-12">
        <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6 border border-slate-100 relative overflow-hidden">
           <User className="h-12 w-12 relative z-10" />
           <div className="absolute inset-0 bg-red-100/50 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Not Found</h2>
        <p className="text-slate-500 max-w-md mt-4 font-medium leading-relaxed">
          The requested identifier <span className="text-slate-900 font-bold">{id}</span> does not resolve to any active clinical profile in your registry.
        </p>
        <button 
          onClick={() => navigate('/master/patients')}
          className="mt-10 px-10 py-4 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
        >
          Return to Registry
        </button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/master/patients')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </button>
          
          <div className="flex gap-4">
             <button
               onClick={handleExportBioCard}
               className="h-12 w-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
               title="Print Bio-Card"
             >
                <Printer className="h-5 w-5" />
             </button>
             <button
               onClick={() => setIsHistoryModalOpen(true)}
               className="px-6 py-2 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-slate-200 transition-all active:scale-95 flex items-center gap-2"
             >
               <FileText className="h-3.5 w-3.5" />
               View Records
             </button>
              {userData?.role !== 'doctor' && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-2 ${isEditing ? 'bg-slate-100 text-slate-600' : 'bg-primary-600 text-white shadow-sm'} font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all active:scale-95`}
                >
                 {isEditing ? 'Discard Changes' : 'Modify Bio-Data'}
                </button>
              )}
              <AnimatePresence>
                {isEditing && (
                  <motion.button 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={handleUpdate}
                    className="px-6 py-2 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg shadow-sm flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </motion.button>
                )}
              </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-8 pb-8 border-b border-slate-100">
                    <div className="relative">
                      <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-3xl font-bold uppercase border-2 border-slate-100 shadow-inner">
                        {patient.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-3">{patient.name}</h1>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-slate-200">Patient ID: {patient.id}</span>
                        <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-slate-100">Added: Jan 2026</span>
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50 flex items-center gap-2">
                         <User className="h-3.5 w-3.5 text-slate-400" /> Bio-Demographics
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
                               <DetailRow label="Date of Birth" value={patient.dob || '--'} />
                              <DetailRow label="Gender" value={patient.gender || '--'} />
                              <DetailRow label="Age" value={patient.age || '--'} />
                              <DetailRow label="Mobile" value={patient.contact || patient.mobile || '--'} />
                              <DetailRow label="Email" value={patient.email || '--'} />
                            </>
                          )}
                       </div>
                    </div>
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-50 flex items-center gap-2">
                         <Home className="h-3.5 w-3.5 text-slate-400" /> Contact & Next of Kin
                       </h3>
                       <div className="space-y-5">
                          {isEditing ? (
                            <>
                              <EditableField label="Next of Kin Name" value={formData.nextOfKinName} onChange={(v) => setFormData({...formData, nextOfKinName: v})} />
                              <EditableField label="Relationship" value={formData.nextOfKinRelation} onChange={(v) => setFormData({...formData, nextOfKinRelation: v})} />
                              <EditableField label="Emergency Phone" value={formData.nextOfKinPhone} onChange={(v) => setFormData({...formData, nextOfKinPhone: v})} />
                              <EditableField label="Address" value={formData.address} onChange={(v) => setFormData({...formData, address: v})} isTextArea />
                            </>
                          ) : (
                            <>
                              <DetailRow label="Contact Person" value={patient.nextOfKinName || '--'} />
                              <DetailRow label="Relationship" value={patient.nextOfKinRelation || '--'} />
                              <DetailRow label="Emergency Line" value={patient.nextOfKinPhone || '--'} />
                              <DetailRow label="Home Address" value={patient.address || '--'} />
                            </>
                          )}
                       </div>
                    </div>
                 </div>
               </div>
            </section>

            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck className="h-4 w-4 text-emerald-500" /> Insurance & Financial Eligibility
                 </h3>
                 <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${patient.paymentMode === 'Insurance' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {patient.paymentMode || 'Cash'}
                 </span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Mode</p>
                     <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                       <CreditCard className="h-4 w-4 text-slate-400" />
                       {isEditing ? (
                         <select className="bg-transparent border-none outline-none font-medium" value={formData.paymentMode} onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}>
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
                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Provider Name</p>
                         <div className="text-sm font-bold text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-bold w-full" value={formData.insName} onChange={(e) => setFormData({...formData, insName: e.target.value})} /> : (patient.insName || '--')}
                         </div>
                      </div>
                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Member Identifier</p>
                         <div className="text-sm font-bold text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-bold w-full" value={formData.insMemberNo} onChange={(e) => setFormData({...formData, insMemberNo: e.target.value})} /> : (patient.insMemberNo || '--')}
                         </div>
                      </div>
                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Plan Name</p>
                         <div className="text-sm font-bold text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-bold w-full" value={formData.insPlan} onChange={(e) => setFormData({...formData, insPlan: e.target.value})} /> : (patient.insPlan || '--')}
                         </div>
                      </div>
                    </>
                  )}
               </div>
            </section>

            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                       <Folder className="h-5 w-5" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-900 tracking-tight">Digital Archives</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clinical Scans & IDs</p>
                    </div>
                  </div>
                  {userData?.role !== 'doctor' && (
                    <div className="relative">
                      <input 
                        type="file" 
                        id="doc-upload" 
                        className="hidden" 
                        onChange={handleUploadDocument}
                      />
                      <label 
                        htmlFor="doc-upload"
                        className={`flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold text-[9px] uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all cursor-pointer shadow-sm active:scale-95 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {isUploading ? 'Processing...' : 'Upload File'}
                      </label>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.length > 0 ? documents.map((doc) => (
                    <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all flex items-center justify-between group/doc">
                       <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                             <File className="h-4 w-4" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{doc.fileName}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{doc.fileSize} • {new Date(doc.uploadedAt || Date.now()).toLocaleDateString('en-GB')}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                          <button 
                            onClick={() => window.open(doc.url, '_blank')}
                            className="p-1.5 text-slate-400 hover:text-slate-900 transition-all"
                          >
                             <ChevronRight className="h-4 w-4" />
                          </button>
                          {userData?.role !== 'doctor' && (
                            <button 
                              onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-all"
                            >
                               <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                       </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                       <Folder className="h-8 w-8 text-slate-100 mx-auto mb-3" />
                       <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">No archival assets found.</p>
                    </div>
                  )}
               </div>
            </section>
          </div>

          {/* Clinical Sidebar */}
          <div className="space-y-6">
             <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl space-y-8">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Status</h4>
                     <Activity className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-1 pb-4 border-b border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Visit</p>
                      <p className="text-lg font-bold text-slate-900">
                        {records[0]?.createdAt?.seconds 
                          ? new Date(records[0].createdAt.seconds * 1000).toLocaleDateString('en-GB') 
                          : records[0]?.createdAt 
                            ? new Date(records[0].createdAt).toLocaleDateString('en-GB')
                            : '--'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Visits</p>
                      <p className="text-lg font-bold text-slate-900">{records.length} Visits Logged</p>
                    </div>
                  </div>
               </div>
               
               <div className="space-y-4 pt-4 border-t border-slate-200">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Info className="h-3 w-3" /> Common Diagnosis
                  </p>
                  <div className="space-y-2">
                    {Array.from(new Set(records.map(r => r.diagnosis).filter(Boolean))).slice(0, 5).map(d => (
                      <div key={d} className="px-3 py-2 bg-white rounded-lg text-[10px] font-bold text-slate-600 uppercase border border-slate-100 truncate shadow-sm">
                        {d}
                      </div>
                    ))}
                    {records.filter(r => r.diagnosis).length === 0 && <p className="text-[9px] text-slate-300 italic">No historical logs.</p>}
                  </div>
               </div>
             </div>

             <div className="bg-white border border-slate-200 p-8 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Visit Timeline</h4>
                </div>
                <div className="space-y-3">
                  {records.length > 0 ? records.slice(0, 5).map((record) => (
                    <div 
                      key={record.id} 
                      className="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                           {record.createdAt?.seconds 
                             ? new Date(record.createdAt.seconds * 1000).toLocaleDateString('en-GB') 
                             : new Date(record.createdAt).toLocaleDateString('en-GB')}
                         </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">{record.title || 'Clinical Note'}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 font-medium">{record.diagnosis || record.assessment || 'Consultation summary.'}</p>
                    </div>
                  )) : (
                    <div className="py-10 text-center">
                       <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">No visit history</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isHistoryModalOpen && (
          <PatientHistoryModal 
            patient={patient}
            records={records}
            onClose={() => setIsHistoryModalOpen(false)}
            searchQuery={historySearchQuery}
            onSearchChange={setHistorySearchQuery}
            monthFilter={historyMonthFilter}
            onMonthChange={setHistoryMonthFilter}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function PatientHistoryModal({ patient, records, onClose, searchQuery, onSearchChange, monthFilter, onMonthChange }) {
  const months = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [viewingNote, setViewingNote] = useState(null);
  
  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchQuery || 
      (record.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.assessment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (monthFilter === 'All') return true;
    
    const date = record.createdAt?.seconds ? new Date(record.createdAt.seconds * 1000) : new Date(record.createdAt);
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    return month === monthFilter;
  }).sort((a,b) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-slate-200"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shrink-0">
          <div className="flex items-center gap-6">
             <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                <History className="h-7 w-7" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{patient.name}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Clinical Journey Ledger</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="h-12 w-12 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all active:scale-95 shadow-sm"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-4 shrink-0">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search diagnosis, notes or symptoms..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {months.map(m => (
              <button
                key={m}
                onClick={() => onMonthChange(m)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${monthFilter === m 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white space-y-4 relative">
          {filteredRecords.length > 0 ? filteredRecords.map((record, idx) => (
            <motion.div 
              key={record.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="group p-6 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-300 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-default"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[70px]">
                    <span className="text-lg font-black text-slate-900 leading-none mb-1">
                      {record.createdAt?.seconds 
                        ? new Date(record.createdAt.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit' })
                        : new Date(record.createdAt).toLocaleDateString('en-GB', { day: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {record.createdAt?.seconds 
                        ? new Date(record.createdAt.seconds * 1000).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
                        : new Date(record.createdAt).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">{record.title || 'Clinical Consultation'}</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase tracking-widest border border-emerald-100">Signed</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest border border-slate-200">{record.specialty || 'General'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-3畅">
                   <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attending Physician</p>
                     <p className="text-xs font-bold text-slate-900">{record.doctorName || record.staffName || 'Dr. Medical Staff'}</p>
                   </div>
                   <button 
                     onClick={() => setViewingNote(record)}
                     className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary-600 transition-all active:scale-95 shadow-sm"
                   >
                     View Details
                   </button>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Diagnosis & Assessment</p>
                   <p className="text-sm text-slate-700 font-medium leading-relaxed line-clamp-2">{record.diagnosis || record.assessment || 'No clinical data recorded.'}</p>
                </div>
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Clinical Plan / Notes</p>
                   <p className="text-sm text-slate-500 italic leading-relaxed line-clamp-2">{record.plan || record.notes || 'Routine follow-up scheduled.'}</p>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                  <Search className="h-8 w-8" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 tracking-tight">No historical entries found</h3>
               <p className="text-slate-400 max-w-xs mt-2 text-sm font-medium">Try adjusting your search query or month filter to find older clinical records.</p>
            </div>
          )}

          {/* Clinical Record Overlay Viewer */}
          <AnimatePresence>
            {viewingNote && (
              <NoteViewer 
                note={viewingNote}
                onClose={() => setViewingNote(null)}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 text-center shrink-0">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Lifecycle Entries: {records.length}</p>
        </div>
      </motion.div>
    </div>
  );
}

function NoteViewer({ note, onClose }) {
  if (!note) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
      >
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white relative">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-600 border border-slate-100 shadow-inner">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{note.title || 'Clinical Encounter'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                {note.patientName || 'Verification Successful'} • {note.createdAt?.seconds ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() : 'Historical'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-12 w-12 flex items-center justify-center bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm active:scale-95">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Physician</p>
              <p className="text-sm font-bold text-slate-900">{note.doctorName || note.staffName || 'Medical Staff'}</p>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Specialty</p>
              <p className="text-sm font-bold text-slate-900 capitalize">{note.specialties?.join(', ') || note.specialty || 'General Practice'}</p>
            </div>
            {note.diagnosis && (
              <div className="p-6 bg-slate-900 text-white rounded-[2rem] col-span-2 shadow-2xl shadow-slate-200 ring-4 ring-slate-50">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 italic px-1 opacity-60">Verified Diagnosis (ICD-10)</p>
                <p className="text-lg font-bold px-1">{note.diagnosis}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
             {note.vitals && Object.values(note.vitals).some(v => v) && (
               <div className="col-span-full bg-slate-50/50 p-10 rounded-[2rem] border border-slate-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
                 {Object.entries(note.vitals).filter(([_, v]) => v).map(([key, value]) => (
                   <div key={key} className="text-center md:text-left space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{key.replace('_', ' ')}</p>
                      <p className="text-base font-black text-slate-900">{value}</p>
                   </div>
                 ))}
               </div>
             )}

            <ViewerBox label="Subjective" icon="S" content={note.subjective || note.history} />
            <ViewerBox label="Objective" icon="O" content={note.objective || note.examination} />
            <ViewerBox label="Assessment" icon="A" content={note.assessment || note.diagnosisSummary} />
            <ViewerBox label="Plan" icon="P" content={note.plan || note.treatment} />
            
            {note.prescriptions?.length > 0 && (
               <div className="col-span-full space-y-6">
                  <div className="flex items-center gap-4 px-2">
                     <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg">Rx</div>
                     <h5 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Pharmacological Orders</h5>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-100">
                     <table className="w-full">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                           <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">
                              <th className="px-8 py-5">Medication</th>
                              <th className="px-8 py-5">Dose</th>
                              <th className="px-8 py-5">Frequency</th>
                              <th className="px-8 py-5">Duration</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium text-sm text-slate-600">
                           {note.prescriptions.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-8 py-6">
                                   <p className="font-bold text-slate-900">{p.medicineName || p.medicine}</p>
                                   <span className="text-[8px] px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md uppercase font-black tracking-widest mt-1 inline-block">{p.route || 'Oral'}</span>
                                 </td>
                                 <td className="px-8 py-6">{p.dosage}</td>
                                 <td className="px-8 py-6 font-bold text-primary-600">{p.frequency}</td>
                                 <td className="px-8 py-6 uppercase text-[10px] font-black tabular-nums">{p.duration}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {note.labRequests?.length > 0 && (
               <div className="col-span-full space-y-6">
                  <div className="flex items-center gap-4 px-2">
                     <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg">Lx</div>
                     <h5 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Diagnostics & Labs</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5畅">
                     {note.labRequests.map((l, idx) => (
                        <div key={idx} className="p-8 bg-emerald-50/30 border-2 border-dashed border-emerald-100 rounded-[2rem] flex justify-between items-center group transition-all hover:bg-emerald-50/50 hover:border-emerald-200">
                           <div className="space-y-1">
                               <p className="text-base font-black text-slate-900">{l?.test || 'Standard Investigation'}</p>
                               <div className="flex items-center gap-3 mt-2">
                                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-3 py-1 rounded-lg">
                                    {l?.priority || 'Routine'}
                                 </span>
                                 <p className="text-[10px] font-bold text-slate-400 border-l border-emerald-200 pl-3">
                                   {l?.instructions || 'Standard Protocol'}
                                 </p>
                               </div>
                            </div>
                           <Activity className="h-6 w-6 text-emerald-200 group-hover:text-emerald-500 transition-all group-hover:scale-125" />
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-6 shrink-0">
          <button onClick={onClose} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">Close Clinical Review</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ViewerBox({ label, icon, content }) {
  if (!content) return null;
  return (
    <div className="space-y-4畅">
      <div className="flex items-center gap-3 px-2">
        <div className="h-8 w-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-[10px] font-black shadow-md">{icon}</div>
        <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] opacity-80">{label} Details</h5>
      </div>
      <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] text-sm text-slate-600 leading-[1.8] whitespace-pre-wrap font-medium shadow-inner-lg min-h-[160px]">
        {content}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-1 transition-all rounded-lg">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text", isSelect = false, options = [], isTextArea = false }) {
  return (
    <div className="space-y-2畅">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      {isSelect ? (
        <select 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
        >
          <option value="">Select Option...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : isTextArea ? (
        <textarea 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all min-h-[120px] resize-none shadow-sm"
        />
      ) : (
        <input 
          type={type} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
        />
      )}
    </div>
  );
}
