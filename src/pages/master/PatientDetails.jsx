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
  Info,
  CheckCircle2,
  Folder,
  File,
  Upload,
  Trash2
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
import { Printer } from 'lucide-react';

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
      const [patientData, recordsData, docsData] = await Promise.all([
        patientService.getPatientById(id),
        medicalRecordService.getRecordsByPatient(id),
        patientDocumentsService.getDocumentsByPatient(id)
      ]);
      setPatient(patientData);
      setFormData(patientData || {});
      setRecords(recordsData || []);
      setDocuments(docsData || []);

      // Log the data access
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Staff',
        action: 'VIEW_PATIENT_BIO',
        module: 'RECORDS',
        description: `Accessed full biometric profile and digital archives for ${patientData?.name}`,
        metadata: { patientId: id }
      });
    } catch (error) {
      console.error('Error fetching patient data:', error);
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
    doc.text(`Generated on ${new Date().toLocaleString()} | HURA Cloud | Official Biometric Record`, 105, footY, { align: 'center' });

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

  if (loading) return <DashboardLayout><div className="p-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs italic">Decompressing patient record...</div></DashboardLayout>;
  if (!patient) return <DashboardLayout><div className="p-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">Biometric Record Not Found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/master/patients')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors group"
          >
            <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-50 shadow-sm transition-all group-active:scale-95">
              <ArrowLeft className="h-5 w-5" />
            </div>
            Back to Registry
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
               onClick={() => setIsEditing(!isEditing)}
               className={`px-8 py-4 ${isEditing ? 'bg-slate-100 text-slate-600' : 'bg-primary-600 text-white shadow-lg shadow-primary-200'} font-medium text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95`}
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
                   className="px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 flex items-center gap-2 active:scale-95 transition-all"
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
                      <div className="h-28 w-28 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400 text-5xl font-semibold uppercase border-4 border-white shadow-2xl transition-transform group-hover:scale-105">
                        {patient.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 cursor-help">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-5xl font-medium text-slate-900 tracking-tight leading-none mb-4">{patient.name}</h1>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-semibold uppercase tracking-widest shadow-lg shadow-slate-200">Patient ID: {patient.id}</span>
                        <span className="px-4 py-2 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-semibold uppercase tracking-widest border border-slate-100">Registered: Jan 2026</span>
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] pb-4 border-b border-slate-50 flex items-center gap-2">
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
                       <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] pb-4 border-b border-slate-50 flex items-center gap-2">
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
                 <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-emerald-500" /> Insurance & Financial Eligibility
                 </h3>
                 <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-semibold uppercase tracking-widest ${patient.paymentMode === 'Insurance' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white'}`}>
                    {patient.paymentMode || 'Cash Payer'}
                 </span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                     <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">Primary Payer</p>
                     <p className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                       <CreditCard className="h-6 w-6 text-primary-500" />
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
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                         <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">Provider Name</p>
                         <div className="text-lg font-semibold text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-medium w-full" value={formData.insName} onChange={(e) => setFormData({...formData, insName: e.target.value})} /> : (patient.insName || 'SHA / NHIF')}
                         </div>
                      </div>
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                         <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">Member Identifier</p>
                         <div className="text-lg font-semibold text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-medium w-full" value={formData.insMemberNo} onChange={(e) => setFormData({...formData, insMemberNo: e.target.value})} /> : (patient.insMemberNo || 'POL-998877')}
                         </div>
                      </div>
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                         <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">Policy Benefit / Plan</p>
                         <div className="text-lg font-semibold text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-medium w-full" value={formData.insPlan} onChange={(e) => setFormData({...formData, insPlan: e.target.value})} /> : (patient.insPlan || 'Outpatient Gold')}
                         </div>
                      </div>
                      <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all">
                         <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">Rel. to Principal</p>
                         <div className="text-lg font-semibold text-slate-900">
                           {isEditing ? <input className="bg-transparent border-none outline-none font-medium w-full" value={formData.insRelation} onChange={(e) => setFormData({...formData, insRelation: e.target.value})} /> : (patient.insRelation || 'Self')}
                         </div>
                      </div>
                    </>
                  )}
               </div>
            </section>

            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 group">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
                       <Folder className="h-6 w-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Digital Archives</h3>
                       <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Scanned Records & IDs</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="doc-upload" 
                      className="hidden" 
                      onChange={handleUploadDocument}
                    />
                    <label 
                      htmlFor="doc-upload"
                      className={`flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-xl shadow-slate-200 active:scale-95 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Archive'}
                    </label>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.length > 0 ? documents.map((doc) => (
                    <div key={doc.id} className="p-6 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-100 transition-all flex items-center justify-between group/doc">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm transition-transform group-hover/doc:scale-110">
                             <File className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">{doc.fileName}</p>
                             <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">{doc.fileSize} • {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                          <button 
                            onClick={() => window.open(doc.url, '_blank')}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all"
                          >
                             <ChevronRight className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                          >
                             <Trash2 className="h-4 w-4" />
                          </button>
                       </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                       <Folder className="h-10 w-10 text-slate-100 mx-auto mb-4" />
                       <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest leading-loose">No digital assets archived for this profile.</p>
                    </div>
                  )}
               </div>
            </section>
          </div>

          {/* Clinical Sidebar */}
          <div className="space-y-8">
             <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl group">
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-10">
                    <h4 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.20em]">Clinical Snapshot</h4>
                    <Activity className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                 </div>
                 <div className="grid grid-cols-2 gap-10">
                   <div className="space-y-1">
                     <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Last Visit</p>
                     <p className="text-2xl font-semibold">
                       {records[0]?.createdAt?.seconds 
                         ? new Date(records[0].createdAt.seconds * 1000).toLocaleDateString() 
                         : records[0]?.createdAt 
                           ? new Date(records[0].createdAt).toLocaleDateString()
                           : 'No Visits'}
                     </p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Total Visits</p>
                     <p className="text-2xl font-semibold">{records.length} Instances</p>
                   </div>
                 </div>
                 <div className="mt-12 pt-10 border-t border-white/5">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Info className="h-3 w-3" /> Reoccurring Diagnoses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(records.map(r => r.diagnosis).filter(Boolean))).slice(0, 3).map(d => (
                        <span key={d} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-semibold uppercase tracking-tight border border-white/5 transition-all cursor-default">
                          {d}
                        </span>
                      ))}
                      {records.filter(r => r.diagnosis).length === 0 && <span className="text-[10px] text-slate-500 italic">No formal diagnoses logged.</span>}
                    </div>
                 </div>
               </div>
               <div className="absolute -right-24 -top-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
             </div>

             <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <h4 className="text-[10px] font-medium text-slate-900 uppercase tracking-[0.2em]">Activity Log</h4>
                  <button 
                    onClick={() => navigate('/notes', { state: { searchQuery: patient.name } })}
                    className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                  {records.length > 0 ? records.slice(0, 5).map((record) => (
                    <div 
                      key={record.id} 
                      className="relative pl-10 group cursor-pointer active:scale-[0.98] transition-all"
                      onClick={() => navigate('/notes')}
                    >
                      <div className="absolute left-0 top-1 h-6 w-6 bg-white rounded-lg border-2 border-slate-100 flex items-center justify-center z-10 group-hover:border-primary-500 transition-colors shadow-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-primary-500 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-900 leading-none group-hover:text-primary-600 transition-colors">
                          {record.title || 'Clinical Note'}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight">
                          {record.createdAt?.seconds 
                            ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() 
                            : 'Recent'} • {record.doctorName || 'Attending Physician'}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest text-center py-4">No activity recorded.</div>
                  )}
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
      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider group-hover/row:text-slate-900 transition-colors">{label}</span>
      <span className="text-sm font-medium text-slate-900 group-hover/row:translate-x-[-2px] transition-transform">{value}</span>
    </div>
  );
}

function EditableField({ label, value, onChange, type = "text", isSelect = false, options = [], isTextArea = false }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      {isSelect ? (
        <select 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none transition-all"
        >
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : isTextArea ? (
        <textarea 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none transition-all min-h-[100px] resize-none"
        />
      ) : (
        <input 
          type={type} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none transition-all"
        />
      )}
    </div>
  );
}
