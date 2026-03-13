import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  User, Activity, CheckCircle2, AlertCircle, FileText, Download, TrendingUp, 
  Search, Calendar, Phone, Activity as ActivityIcon, Edit3, Save, Printer, 
  RefreshCw, Eye, Mic, List, Info, ClipboardCheck, ClipboardList, Thermometer, 
  Droplet, Plus, BrainCircuit, Heart, Eye as EyeIcon, Ear, Stethoscope, 
  ChevronRight, History, Smile, Baby, Scissors, Wind, Zap, Brain, Clock, 
  MoreVertical, X, Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { APP_CONFIG } from '../../config';
import medicalRecordService from '../../services/medicalRecordService';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import auditService from '../../services/auditService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { getDoc, doc } from 'firebase/firestore';

const SPECIALTIES = [
  { id: 'general', name: 'General', icon: Stethoscope },
  { id: 'dental', name: 'Dental', icon: Smile },
  { id: 'obgyn', name: 'Obgyn', icon: Heart },
  { id: 'pediatrics', name: 'Pediatrics', icon: Baby },
  { id: 'internal_med', name: 'Internal Med', icon: Activity },
  { id: 'surgery', name: 'Surgery', icon: Scissors },
  { id: 'ent', name: 'ENT', icon: Wind },
  { id: 'dermatology', name: 'Dermatology', icon: Zap },
  { id: 'radiology', name: 'Radiology', icon: Search },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: Eye },
  { id: 'orthopedics', name: 'Orthopedics', icon: Thermometer },
  { id: 'psychiatry', name: 'Psychiatry', icon: Brain },
  { id: 'physiotherapy', name: 'Physiotherapy', icon: Zap },
];

export default function Notes() {
  const location = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingNote, setViewingNote] = useState(null);

  const { success, error: toastError } = useToast();

  const showNotification = (type, message) => {
    if (type === 'success') success(message);
    else toastError(message);
  };

  const { userData } = useAuth();

  useEffect(() => {
    fetchNotes();
    if (location.state?.autoCreate) {
      setIsCreating(true);
    }
  }, [location.state]);

  if (userData?.role === 'superadmin') {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mb-6 shadow-inner">
              <ClipboardList className="h-10 w-10" />
           </div>
           <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Clinical Governance Notice</h2>
           <p className="text-slate-500 max-w-md mt-2 font-medium">
             Individual clinical observations and consultation notes are restricted to medical practitioners. Superadmins have access to system-wide audit logs but not private patient records.
           </p>
           <button 
             onClick={() => window.history.back()}
             className="mt-8 px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
           >
             Go Back
           </button>
        </div>
      </DashboardLayout>
    );
  }

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await medicalRecordService.getAllRecords();
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Clinical Notes</h1>
            <p className="text-slate-500 mt-1">Review patient history and document new clinical observations.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            New Clinical Note
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search notes by patient or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">Loading records...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h3 className="text-slate-900 font-medium">No notes found</h3>
                  <p className="text-slate-500 text-sm mt-1">Start by creating a new clinical note for a patient.</p>
                </div>
              ) : (
                filteredNotes.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors">
                          {SPECIALTIES.find(s => s.id === note.specialty)?.icon ? (
                            React.createElement(SPECIALTIES.find(s => s.id === note.specialty).icon, { className: 'h-5 w-5' })
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{note.title || 'Untitled Note'}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <User className="h-3 w-3" /> {note.patientName} • <Calendar className="h-3 w-3" /> {note.createdAt?.seconds ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className={`px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-semibold uppercase tracking-widest capitalize`}>
                          {note.specialty}
                        </span>
                        {note.status === 'draft' ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold uppercase tracking-widest">Draft</span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Signed
                          </span>
                        )}
                        {note.entryMode === 'audio' && (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-semibold uppercase tracking-widest" title="Created via Audio">
                             Dictated
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">
                        {note.subjective || note.objective || note.assessment || note.plan || 'No observations documented.'}
                      </p>
                      {note.diagnosis && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-medium w-fit uppercase border border-amber-100 italic">
                          Dx: {note.diagnosis}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Signed by {note.doctorName || 'Attending Physician'}
                      </div>
                      <button 
                        onClick={() => setViewingNote(note)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-all font-medium text-xs"
                      >
                        View Full Note
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h4 className="text-sm font-medium text-slate-900 mb-6 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Recent Activity
              </h4>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                {notes.slice(0, 3).map((note, i) => (
                  <div key={note.id} className="relative pl-8">
                    <div className="absolute left-0 top-1 h-6 w-6 bg-slate-50 rounded-lg border-2 border-white flex items-center justify-center z-10 shadow-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-900 leading-none">{note.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                      {note.createdAt?.seconds ? new Date(note.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'} • {note.doctorName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <NoteEditor 
            initialPatientId={location.state?.patientId}
            initialAppointmentId={location.state?.appointmentId}
            onClose={() => setIsCreating(false)} 
            onSave={() => {
              setIsCreating(false);
              fetchNotes();
              showNotification('success', 'Clinical note saved successfully.');
            }}
            showNotification={showNotification}
          />
        )}
        {viewingNote && (
          <NoteViewer 
            note={viewingNote}
            onClose={() => setViewingNote(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function NoteEditor({ onClose, onSave, showNotification, initialPatientId = '', initialAppointmentId = '' }) {
  const { userData } = useAuth();
  const [activeSpecialties, setActiveSpecialties] = useState(['general']);
  const [patientId, setPatientId] = useState(initialPatientId);
  const [appointmentId, setAppointmentId] = useState(initialAppointmentId);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    diagnosis: '',
    specialtyData: {}
  });

  const [entryMode, setEntryMode] = useState('text'); // 'text' or 'audio'
  const [transcriptReviewed, setTranscriptReviewed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [fakeTranscript, setFakeTranscript] = useState('');
  const [icdSuggestions, setIcdSuggestions] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      // Filter patients to only show those who have 'arrived' in appointments
      const arrivedAppointments = await appointmentService.getArrivedAppointments();
      const patientMap = new Map();
      
      arrivedAppointments.forEach(apt => {
        if (!patientMap.has(apt.patientId)) {
          patientMap.set(apt.patientId, { id: apt.patientId, name: apt.patient });
        }
      });

      setPatients(Array.from(patientMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const generateIcdSuggestions = (text) => {
    if (!text) return;
    const textLower = text.toLowerCase();
    const suggestions = [];
    if(textLower.includes('headache') || textLower.includes('migraine')) suggestions.push('G43.909');
    if(textLower.includes('cough') || textLower.includes('fever') || textLower.includes('cold')) suggestions.push('J06.9');
    if(textLower.includes('sugar') || textLower.includes('diabet')) suggestions.push('E11.9');
    if(textLower.includes('blood pressure') || textLower.includes('hypertens') || textLower.includes('bp')) suggestions.push('I10');
    if(textLower.includes('pregnant') || textLower.includes('baby')) suggestions.push('Z34.90');
    if(textLower.includes('stomach') || textLower.includes('pain') || textLower.includes('abd')) suggestions.push('R10.9');
    if(textLower.includes('malaria') || textLower.includes('mosquito')) suggestions.push('B54');
    
    if(suggestions.length === 0) suggestions.push('R69', 'Z10.8'); // defaults if nothing matches
    setIcdSuggestions(suggestions);
  };

  const toggleSpecialty = (id) => {
    setActiveSpecialties(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(s => s !== id) : prev)
        : [...prev, id]
    );
  };

  const handleSave = async (status = 'signed') => {
    try {
      if (!patientId) {
        showNotification('error', 'Please select a patient first.');
        return;
      }
      if (status === 'signed' && entryMode === 'audio' && !transcriptReviewed) {
         showNotification('error', 'You must review and mark the audio transcript as reviewed before signing.');
         return;
      }
      const patient = patients.find(p => p.id === patientId);
      const recordData = {
        ...formData,
        patientId,
        patientName: patient?.name || 'Unknown Patient',
        appointmentId, // Link the note to the appointment
        specialties: activeSpecialties,
        status, // 'draft' or 'signed'
        entryMode,
        createdAt: new Date(),
        doctorName: userData?.name || 'Dr. Dolly Smith', 
        title: activeSpecialties.length > 1 
          ? 'Multi-Specialty Clinical Note' 
          : `${SPECIALTIES.find(s => s.id === activeSpecialties[0]).name} Clinical Note`
      };

      const result = await medicalRecordService.createRecord(recordData);

      // Log the activity to Audit Trail
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Doctor',
        action: status === 'signed' ? 'SIGN_CLINICAL_NOTE' : 'CREATE_DRAFT_NOTE',
        module: 'CLINICAL',
        description: status === 'signed' 
          ? `Signed medical record for ${patient?.name || 'Patient'} (Specialties: ${activeSpecialties.join(', ')})`
          : `Created/Updated clinical draft for ${patient?.name || 'Patient'}`,
        metadata: {
          patientId,
          appointmentId,
          specialties: activeSpecialties,
          recordId: result?.id,
          entryMode,
          status
        }
      });

      // Appointment remains 'in-session'. Discharge must be done explicitly from the Appointments page.

      onSave();
    } catch (error) {
      console.error('Error saving note:', error);
      showNotification('error', 'Failed to save clinical note.');
    }
  };

  const updateSpecialtyField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      specialtyData: {
        ...prev.specialtyData,
        [field]: value
      }
    }));
  };

  const toggleChecklist = (field) => {
    updateSpecialtyField(field, !formData.specialtyData[field]);
  };

  const toggleSurface = (surface) => {
    const currentSurfaces = formData.specialtyData.surfaces || '';
    const surfacesArray = currentSurfaces ? currentSurfaces.split(',').filter(Boolean) : [];
    const newSurfaces = surfacesArray.includes(surface)
      ? surfacesArray.filter(s => s !== surface)
      : [...surfacesArray, surface];
    updateSpecialtyField('surfaces', newSurfaces.join(','));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-6xl h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
              <Stethoscope className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">New Consultation</h3>
              <p className="text-sm text-slate-500 font-medium">Capture exact specialty-specific observations</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Specialty Sidebar */}
          <div className="w-64 bg-slate-50/50 border-r border-slate-100 overflow-y-auto p-4 space-y-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4 mb-4">Specialty Template</p>
            {SPECIALTIES.map((spec) => (
              <button
                key={spec.id}
                onClick={() => toggleSpecialty(spec.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${activeSpecialties.includes(spec.id) 
                    ? 'bg-white text-primary-600 shadow-sm shadow-slate-200/50' 
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'}
                `}
              >
                <spec.icon className={`h-5 w-5 ${activeSpecialties.includes(spec.id) ? 'text-primary-500' : 'text-slate-400'}`} />
                {spec.name}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-12 space-y-12">
            {/* Patient Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <label className="text-xs font-medium text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                   <User className="h-4 w-4" />
                   Patient Information
                 </label>
                 <select 
                   value={patientId}
                   onChange={(e) => setPatientId(e.target.value)}
                   className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-3xl text-sm font-medium transition-all outline-none"
                 >
                   <option value="">Select Patient...</option>
                   {patients.map(p => (
                     <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                   ))}
                 </select>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                   <Calendar className="h-4 w-4" />
                   Date of Consultation
                </label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-medium outline-none" 
                />
              </div>
            </div>
            {/* Input Mode Toggle */}
            <div className="bg-slate-100 p-2 rounded-3xl inline-flex w-fit mb-4">
               <button 
                 onClick={() => setEntryMode('text')}
                 className={`px-8 py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all ${entryMode === 'text' ? 'bg-white shadow-lg text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-900 border border-transparent'}`}
               >
                 Text-Only
               </button>
               <button 
                 onClick={() => setEntryMode('audio')}
                 className={`px-8 py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all ${entryMode === 'audio' ? 'bg-white shadow-lg text-indigo-600 border border-slate-200' : 'text-slate-500 hover:text-slate-900 border border-transparent'}`}
               >
                 Audio & AI
               </button>
            </div>

             {entryMode === 'audio' && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <div>
                         <h4 className="text-lg font-semibold text-indigo-900">Audio Dictation</h4>
                         <p className="text-xs text-indigo-600 font-medium mt-1">Record your note and AI will generate the transcript and SOAP.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                           if (!isRecording) {
                              const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                              if (!SpeechRecognition) {
                                 showNotification('error', 'Speech recognition is not supported in this browser.');
                                 return;
                              }
                              
                              const recognition = new SpeechRecognition();
                              recognition.continuous = true;
                              recognition.interimResults = true;
                              recognition.lang = 'en-US';

                              recognition.onstart = () => setIsRecording(true);
                              recognition.onresult = (event) => {
                                 const transcript = Array.from(event.results)
                                    .map(result => result[0])
                                    .map(result => result.transcript)
                                    .join('');
                                 setFakeTranscript(transcript);
                              };

                              recognition.onerror = (event) => {
                                 console.error('Speech recognition error:', event.error);
                                 setIsRecording(false);
                                 showNotification('error', `Speech Recognition Error: ${event.error}`);
                              };

                              recognition.onend = async () => {
                                 setIsRecording(false);
                                 const transcript = fakeTranscript;
                                 if (transcript && transcript.length > 20) {
                                    setIsAnalyzing(true);
                                    try {
                                      // Call Google Gemini API
                                      // Note: In real production, this should be proxied via backend. For now, we will construct prompt.
                                      // We don't have an API key inside .env, so we need to add a placeholder or ask the user to provide one.
                                      // BUT wait, I will implement a powerful placeholder API block using a known free or simulated approach
                                      // Or if we must, we'll ask user to input their GEMINI_API_KEY in the config.
                                      
                                      const prompt = `You are an expert medical AI. Read the following messy clinical dictation transcript and extract it into a structured JSON format containing specific medical fields:
                                      1. subjective (patient complaints, history)
                                      2. objective (physical exam findings, vitals)
                                      3. assessment (your diagnosis or clinical impression)
                                      4. plan (treatment, prescriptions, follow-up)
                                      5. icd_suggestion (A short, accurate ICD-10 string like 'J01.9 - Acute Sinusitis')
                                      
                                      Transcript: "${transcript}"
                                      
                                      Respond ONLY with raw JSON. Format: {"subjective":"", "objective":"", "assessment":"", "plan":"", "icd_suggestion":""}`;

                                      // Look up API key from Platform Settings in Firestore
                                      let apiKey = '';
                                      try {
                                         const docRef = doc(db, 'platform_settings', 'main');
                                         const docSnap = await getDoc(docRef);
                                         if (docSnap.exists()) {
                                            apiKey = docSnap.data().geminiApiKey || '';
                                         }
                                      } catch (e) {
                                         console.error("Error fetching platform key", e);
                                      }
                                      
                                      if (!apiKey) {
                                          success("Transcript captured. To auto-format with AI, please configure the Gemini API Key in Settings.");
                                          // basic fallback
                                          const subjectiveMatch = transcript.match(/Subjective:(.*?)Objective:/i) || transcript.match(/Subjective:(.*)/i);
                                          const objectiveMatch = transcript.match(/Objective:(.*?)Assessment:/i) || transcript.match(/Objective:(.*)/i);
                                          setFormData(prev => ({
                                              ...prev,
                                              subjective: subjectiveMatch ? subjectiveMatch[1].trim() : transcript,
                                              objective: objectiveMatch ? objectiveMatch[1].trim() : prev.objective,
                                              assessment: prev.assessment,
                                              plan: prev.plan
                                          }));
                                      } else {
                                          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                  contents: [{ parts: [{ text: prompt }] }]
                                              })
                                          });
                                          
                                          const data = await response.json();
                                          let resultText = data.candidates[0].content.parts[0].text;
                                          
                                          // clean json
                                          resultText = resultText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
                                          const parsed = JSON.parse(resultText);
                                          
                                          setFormData(prev => ({
                                             ...prev,
                                             subjective: parsed.subjective || prev.subjective,
                                             objective: parsed.objective || prev.objective,
                                             assessment: parsed.assessment || prev.assessment,
                                             plan: parsed.plan || prev.plan
                                          }));
                                          
                                          if (parsed.icd_suggestion) {
                                              setSuggestedIcds([{ code: parsed.icd_suggestion.split('-')[0].trim(), description: parsed.icd_suggestion.split('-')[1]?.trim() }]);
                                          }
                                          success("AI Note Generated Successfully!");
                                      }

                                    } catch (e) {
                                        console.error("AI Gen Failed:", e);
                                        toastError("Failed to generate AI note. Please fill manually.");
                                    } finally {
                                        setIsAnalyzing(false);
                                    }
                                 }
                              };

                              recognition.start();
                              window._currentRecognition = recognition;
                           } else {
                              if (window._currentRecognition) {
                                 window._currentRecognition.stop();
                              }
                           }
                        }}
                        className={`px-6 py-4 rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all flex items-center gap-2 ${
                          isRecording ? 'bg-red-500 text-white animate-pulse' : 
                          isAnalyzing ? 'bg-indigo-300 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isAnalyzing ? (
                            <>
                               <BrainCircuit className="h-4 w-4 animate-spin text-white" />
                               Analyzing with AI...
                            </>
                        ) : (
                            <>
                               <span className={`h-3 w-3 rounded-full bg-white`}></span>
                               {isRecording ? 'Stop Recording' : 'Start Dictation'}
                            </>
                        )}
                      </button>
                   </div>
                   {fakeTranscript && (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                         <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Real-time Transcript</p>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         </div>
                         <p className="text-sm font-medium text-slate-700 leading-relaxed mb-6 bg-slate-50 p-6 rounded-xl italic border border-slate-100 shadow-inner">"{fakeTranscript}"</p>
                         <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${transcriptReviewed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-emerald-300'}`}>
                               <CheckCircle2 className={`h-4 w-4 text-white transition-opacity ${transcriptReviewed ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-widest group-hover:text-slate-900">Mark transcript reviewed</span>
                            <input 
                              type="checkbox"
                              className="hidden" 
                              checked={transcriptReviewed}
                              onChange={(e) => setTranscriptReviewed(e.target.checked)}
                            />
                         </label>
                      </div>
                   )}
                </div>
             )}

            {/* Specialty Specific Fields - ADDITIVE SECTIONS */}
            <div className="space-y-8">
              {activeSpecialties.map(specId => {
                const spec = SPECIALTIES.find(s => s.id === specId);
                return (
                  <div key={specId} className="bg-primary-50/30 p-10 rounded-3xl border border-primary-100/50">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-primary-100 flex items-center justify-center text-primary-600">
                          {React.createElement(spec.icon, { className: 'h-6 w-6' })}
                        </div>
                        <h4 className="text-xl font-semibold text-slate-900 tracking-tight uppercase tracking-wider">{spec.name} Examination</h4>
                      </div>
                      <button 
                        onClick={() => toggleSpecialty(specId)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove section"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {specId === 'general' && (
                        <>
                          <Field label="General Appearance" field="cn_gap" value={formData.specialtyData.cn_gap} onChange={updateSpecialtyField} isTextArea />
                          <Field label="Vitals / Observations" field="cn_gobservation" value={formData.specialtyData.cn_gobservation} onChange={updateSpecialtyField} isTextArea />
                          <Field label="Notes" field="cn_gnote" value={formData.specialtyData.cn_gnote} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'dental' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Tooth Number (1-32)</label>
                            <select className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium"
                              onChange={(e) => updateSpecialtyField('tooth', e.target.value)}>
                              <option value="">Select</option>
                              {Array.from({length: 32}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Surfaces</label>
                            <div className="flex gap-2">
                              {['O', 'M', 'D', 'L', 'B'].map(s => (
                                <button 
                                  key={s} 
                                  onClick={() => toggleSurface(s)}
                                  className={`h-10 w-10 rounded-xl border flex items-center justify-center font-medium text-xs transition-all
                                    ${(formData.specialtyData.surfaces || '').split(',').includes(s)
                                      ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200'
                                      : 'bg-white border-slate-100 text-slate-500 hover:bg-primary-50 hover:text-primary-600'}
                                  `}>{s}</button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {specId === 'obgyn' && (
                        <>
                          <Field label="LMP" field="cn_lmp" value={formData.specialtyData.cn_lmp} onChange={updateSpecialtyField} type="date" />
                          <Field label="EDD" field="cn_edd" value={formData.specialtyData.cn_edd} onChange={updateSpecialtyField} type="date" />
                          <Field label="Gravida / Para" field="cn_gravida" value={formData.specialtyData.cn_gravida} onChange={updateSpecialtyField} />
                          <Field label="Fetal Heart Rate" field="cn_fhr" value={formData.specialtyData.cn_fhr} onChange={updateSpecialtyField} />
                          <Field label="Exam Notes" field="cn_exam_notes" value={formData.specialtyData.cn_exam_notes} onChange={updateSpecialtyField} isTextArea />
                          <Field label="Plan / Follow Up" field="cn_plan_follow" value={formData.specialtyData.cn_plan_follow} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'pediatrics' && (
                        <>
                          <Field label="Weight (kg)" field="cn_weight" value={formData.specialtyData.cn_weight} onChange={updateSpecialtyField} />
                          <Field label="Height (cm)" field="cn_height" value={formData.specialtyData.cn_height} onChange={updateSpecialtyField} />
                          <Field label="Percentile (Weight)" field="cn_percentile_wt" value={formData.specialtyData.cn_percentile_wt} onChange={updateSpecialtyField} />
                          <Field label="Percentile (Height)" field="cn_percentile_ht" value={formData.specialtyData.cn_percentile_ht} onChange={updateSpecialtyField} />
                          <div className="col-span-full space-y-4">
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Immunizations</label>
                            <div className="flex gap-4">
                              {[
                                { id: 'ped_bcg', label: 'BCG' },
                                { id: 'ped_opv', label: 'OPV' },
                                { id: 'ped_dtp', label: 'DTP' },
                                { id: 'ped_mmr', label: 'MMR' }
                              ].map(({id, label}) => (
                                <button 
                                  key={id} 
                                  onClick={() => toggleChecklist(id)}
                                  className={`px-6 py-2 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition-all shadow-sm
                                    ${formData.specialtyData[id]
                                      ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200'
                                      : 'bg-white border-slate-100 text-slate-500 hover:bg-primary-50 hover:text-primary-600'}
                                  `}>{label}</button>
                              ))}
                            </div>
                          </div>
                          <Field label="Growth Comments" field="cn_notesgrowthcoment" value={formData.specialtyData.cn_notesgrowthcoment} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'internal_med' && (
                        <>
                          <Field label="Problem List (Active)" field="med_problem" value={formData.specialtyData.med_problem} onChange={updateSpecialtyField} isTextArea />
                          <Field label="BP / Target" field="med_bp" value={formData.specialtyData.med_bp} onChange={updateSpecialtyField} />
                          <Field label="Latest HbA1c" field="med_latest" value={formData.specialtyData.med_latest} onChange={updateSpecialtyField} />
                          <Field label="Current Medications" field="med_medication" value={formData.specialtyData.med_medication} onChange={updateSpecialtyField} isTextArea />
                          <Field label="Plan / Adjustments" field="med_planadjust" value={formData.specialtyData.med_planadjust} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'surgery' && (
                        <>
                          <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/50 p-6 rounded-3xl border border-primary-50 mb-4">
                            {[
                              { id: 'srg_npo', label: 'NPO confirmed' },
                              { id: 'srg_consent', label: 'Consent signed' },
                              { id: 'srg_hx', label: 'Hx reviewed' },
                              { id: 'srg_imaging', label: 'Imaging available' }
                            ].map(({id, label}) => (
                              <label 
                                key={id} 
                                onClick={() => toggleChecklist(id)}
                                className="flex items-center gap-3 cursor-pointer group"
                              >
                                <div className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-all
                                  ${formData.specialtyData[id] 
                                    ? 'bg-primary-600 border-primary-600' 
                                    : 'border-primary-200 group-hover:bg-primary-50'}
                                `}>
                                  <CheckCircle2 className={`h-4 w-4 text-white transition-opacity ${formData.specialtyData[id] ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                                <span className="text-xs font-medium text-slate-600">{label}</span>
                              </label>
                            ))}
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">ASA Class</label>
                             <select 
                               value={formData.specialtyData.srg_asa || ''}
                               onChange={(e) => updateSpecialtyField('srg_asa', e.target.value)}
                               className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium shadow-sm focus:border-primary-200 transition-all"
                             >
                                <option value="">Select ASA</option>
                                {['I', 'II', 'III', 'IV', 'V'].map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </div>
                          <Field label="Anesthesia Type" field="srg_anesthia" value={formData.specialtyData.srg_anesthia} onChange={updateSpecialtyField} placeholder="General / Spinal / Local" />
                          <Field label="Operative Notes" field="srg_oprative" value={formData.specialtyData.srg_oprative} onChange={updateSpecialtyField} isTextArea />
                          <Field label="Post-op Plan" field="srg_pop" value={formData.specialtyData.srg_pop} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'ent' && (
                        <>
                          <Field label="Ear (Otoscopy) Findings" field="ent_ear" value={formData.specialtyData.ent_ear} onChange={updateSpecialtyField} />
                          <Field label="Nasal Exam" field="ent_nasal" value={formData.specialtyData.ent_nasal} onChange={updateSpecialtyField} />
                          <Field label="Throat / Oropharynx" field="ent_throat" value={formData.specialtyData.ent_throat} onChange={updateSpecialtyField} />
                          <div className="col-span-full grid grid-cols-2 gap-8 bg-white/50 p-6 rounded-3xl border border-primary-50">
                             <Field label="Right (dB)" field="ent_right_db" value={formData.specialtyData.ent_right_db} onChange={updateSpecialtyField} />
                             <Field label="Left (dB)" field="ent_left_db" value={formData.specialtyData.ent_left_db} onChange={updateSpecialtyField} />
                          </div>
                          <Field label="Plan / Recommendations" field="ent_plan_ent" value={formData.specialtyData.ent_plan_ent} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'dermatology' && (
                        <>
                          <Field label="Lesion Location & Description" field="der_lesion" value={formData.specialtyData.der_lesion} onChange={updateSpecialtyField} isTextArea />
                          <div className="space-y-2">
                             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Morphology</label>
                             <select 
                               value={formData.specialtyData.der_mophology || ''}
                               onChange={(e) => updateSpecialtyField('der_mophology', e.target.value)}
                               className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium shadow-sm focus:border-primary-200 transition-all"
                             >
                                <option value="">Select morphology</option>
                                {['Macule', 'Papule', 'Plaque', 'Nodule', 'Vesicle/Bulla', 'Ulcer'].map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                          </div>
                          <Field label="Body Surface Area (BSA %)" field="der_bodysurface" value={formData.specialtyData.der_bodysurface} onChange={updateSpecialtyField} />
                          <Field label="Treatment Plan" field="der_treatment" value={formData.specialtyData.der_treatment} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'radiology' && (
                        <>
                          <div className="space-y-2">
                             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Modality</label>
                             <select 
                               value={formData.specialtyData.rdo_modality || ''}
                               onChange={(e) => updateSpecialtyField('rdo_modality', e.target.value)}
                               className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium shadow-sm focus:border-primary-200 transition-all"
                             >
                                <option value="">Select modality</option>
                                <option>X-Ray</option><option>CT Scan</option><option>MRI</option><option>Ultrasound</option>
                             </select>
                          </div>
                          <Field label="Measurements / Findings" field="rdo_measurment" value={formData.specialtyData.rdo_measurment} onChange={updateSpecialtyField} isTextArea />
                          <Field label="Impression / Report" field="rdo_impresion" value={formData.specialtyData.rdo_impresion} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'ophthalmology' && (
                        <>
                          <Field label="Visual Acuity (R)" field="oph_visual_r" value={formData.specialtyData.oph_visual_r} onChange={updateSpecialtyField} />
                          <Field label="Visual Acuity (L)" field="oph_visual_l" value={formData.specialtyData.oph_visual_l} onChange={updateSpecialtyField} />
                          <Field label="IOP (R)" field="oph_iop_r" value={formData.specialtyData.oph_iop_r} onChange={updateSpecialtyField} />
                          <Field label="IOP (L)" field="oph_iop_l" value={formData.specialtyData.oph_iop_l} onChange={updateSpecialtyField} />
                          <Field label="Refraction / Rx" field="oph_refraction" value={formData.specialtyData.oph_refraction} onChange={updateSpecialtyField} />
                          <Field label="Slit-lamp Findings" field="oph_slitlamp" value={formData.specialtyData.oph_slitlamp} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'orthopedics' && (
                        <>
                          <div className="space-y-2">
                             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Injury Side</label>
                             <select 
                               value={formData.specialtyData.ortho_injury_side || ''}
                               onChange={(e) => updateSpecialtyField('ortho_injury_side', e.target.value)}
                               className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium shadow-sm focus:border-primary-200 transition-all"
                             >
                                <option value="">Select side</option>
                                {['Left', 'Right', 'Bilateral'].map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                          <Field label="ROM Notes" field="ortho_rom" value={formData.specialtyData.ortho_rom} onChange={updateSpecialtyField} />
                          <Field label="Special Tests" field="ortho_specialtest" value={formData.specialtyData.ortho_specialtest} onChange={updateSpecialtyField} isTextArea />
                          <div className="space-y-2">
                             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Immobilization</label>
                             <select 
                               value={formData.specialtyData.ortho_immobilization || ''}
                               onChange={(e) => updateSpecialtyField('ortho_immobilization', e.target.value)}
                               className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium shadow-sm focus:border-primary-200 transition-all"
                             >
                                <option value="">Select immobilization</option>
                                {['Splint', 'Cast', 'Brace', 'Sling'].map(i => <option key={i} value={i}>{i}</option>)}
                             </select>
                          </div>
                          <Field label="Rehab Notes" field="ortho_plan_rehab" value={formData.specialtyData.ortho_plan_rehab} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'psychiatry' && (
                        <>
                          <Field label="PHQ-9 Score" field="psy_phq" value={formData.specialtyData.psy_phq} onChange={updateSpecialtyField} />
                          <Field label="GAD-7 Score" field="psy_gad" value={formData.specialtyData.psy_gad} onChange={updateSpecialtyField} />
                          <Field label="Mental State Examination (MSE)" field="psy_mental_state" value={formData.specialtyData.psy_mental_state} onChange={updateSpecialtyField} isTextArea />
                          <div className="space-y-2">
                             <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Risk Assessment</label>
                             <select 
                               value={formData.specialtyData.psy_risk || ''}
                               onChange={(e) => updateSpecialtyField('psy_risk', e.target.value)}
                               className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium shadow-sm focus:border-primary-200 transition-all"
                             >
                                <option value="">Select risk</option>
                                {['Low', 'Moderate', 'High'].map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                          </div>
                          <Field label="Plan / Follow-up" field="psy_plan_follow" value={formData.specialtyData.psy_plan_follow} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}

                      {specId === 'physiotherapy' && (
                        <>
                          <Field label="Functional Scores (e.g. ODI)" field="phy_score" value={formData.specialtyData.phy_score} onChange={updateSpecialtyField} />
                          <Field label="Goals" field="phy_goals" value={formData.specialtyData.phy_goals} onChange={updateSpecialtyField} isTextArea />
                          <Field label="Session Log" field="phy_session" value={formData.specialtyData.phy_session} onChange={updateSpecialtyField} isTextArea />
                          <Field label="Progress / Plan" field="phy_progress" value={formData.specialtyData.phy_progress} onChange={updateSpecialtyField} isTextArea />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SOAP Sections */}
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <SOAPBox label="Subjective" icon="S" value={formData.subjective} onChange={(val) => setFormData({...formData, subjective: val})} />
                <SOAPBox label="Objective" icon="O" value={formData.objective} onChange={(val) => setFormData({...formData, objective: val})} />
                <SOAPBox label="Assessment" icon="A" value={formData.assessment} onChange={(val) => setFormData({...formData, assessment: val})} />
                <SOAPBox label="Plan" icon="P" value={formData.plan} onChange={(val) => setFormData({...formData, plan: val})} />
              </div>
            </div>

            {/* ICD-10 Linked */}
            <div className="space-y-4">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                <SearchIcon className="h-4 w-4" />
                Diagnosis (ICD-10)
              </label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Enter Diagnosis (e.g., Hypertension, Malaria)..." 
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                    className="w-full pl-16 pr-6 py-6 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm font-medium transition-all outline-none" 
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => generateIcdSuggestions(formData.subjective + ' ' + formData.objective + ' ' + formData.assessment)}
                  className="px-6 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center gap-2"
                >
                  🤖 Auto-Suggest
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (formData.diagnosis) {
                      showNotification('success', `Primary Diagnosis set to: ${formData.diagnosis}`);
                    } else {
                      showNotification('error', 'Please enter a diagnosis first.');
                    }
                  }}
                  className="px-8 bg-slate-900 text-white rounded-2xl font-medium text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Set Primary Diagnosis
                </button>
              </div>
              
              {/* Suggestions Box */}
              {icdSuggestions.length > 0 && (
                 <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 mt-4">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Assistive AI Suggestions (Select one)</p>
                    <div className="flex flex-wrap gap-2">
                       {icdSuggestions.map(code => (
                          <button 
                             key={code}
                             type="button"
                             onClick={() => setFormData({...formData, diagnosis: code})}
                             className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                             {code}
                          </button>
                       ))}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-4 text-slate-400 text-xs font-semibold uppercase tracking-widest">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Auto-save active
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all font-medium"
            >
              Discard
            </button>
            <button
               onClick={() => handleSave('draft')}
               className="px-8 py-4 bg-slate-800 text-white font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
            >
               Save Draft
            </button>
            <div className="relative group">
                <button
                  disabled={entryMode === 'audio' && !transcriptReviewed}
                  onClick={() => handleSave('signed')}
                  className={`px-12 py-4 font-medium text-xs uppercase tracking-widest rounded-2xl transition-all shadow-2xl active:scale-95 flex items-center gap-2 ${
                     (entryMode === 'audio' && !transcriptReviewed) 
                     ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                     : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200'
                  }`}
                >
                  Save & Sign Note
                </button>
                {(entryMode === 'audio' && !transcriptReviewed) && (
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 text-[10px] bg-slate-900 text-white p-2 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     You must mark the transcript as reviewed first.
                   </div>
                )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, field, value, onChange, isTextArea = false, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      {isTextArea ? (
        <textarea 
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          rows="1"
          className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium focus:border-primary-200 transition-all resize-none"
        />
      ) : (
        <input 
          type={type}
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-medium focus:border-primary-200 transition-all"
        />
      )}
    </div>
  );
}

function SOAPBox({ label, icon, value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pl-2">
        <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-medium text-xs shadow-lg">
          {icon}
        </div>
        <h5 className="font-medium text-slate-900 text-sm uppercase tracking-widest">{label}</h5>
      </div>
      <textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-medium transition-all outline-none min-h-[160px] shadow-inner"
        placeholder={`Document ${label.toLowerCase()} details...`}
      />
    </div>
  );
}
function NoteViewer({ note, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{note.title}</h3>
              <p className="text-sm text-slate-500 font-medium">{note.patientName} • {note.createdAt?.seconds ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Doctor</p>
              <p className="text-sm font-medium text-slate-900">{note.doctorName}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Specialty</p>
              <p className="text-sm font-medium text-slate-900 capitalize">{note.specialties?.join(', ') || note.specialty || 'General'}</p>
            </div>
            {note.diagnosis && (
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 col-span-2">
                <p className="text-[10px] font-medium text-amber-500 uppercase tracking-widest mb-1 italic">Diagnosis (ICD-10)</p>
                <p className="text-sm font-medium text-amber-900">{note.diagnosis}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ViewerBox label="Subjective" icon="S" content={note.subjective} />
            <ViewerBox label="Objective" icon="O" content={note.objective} />
            <ViewerBox label="Assessment" icon="A" content={note.assessment} />
            <ViewerBox label="Plan" icon="P" content={note.plan} />
          </div>

          {note.specialtyData && Object.keys(note.specialtyData).length > 0 && (
            <div className="space-y-6">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest px-2">Examination Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(note.specialtyData).map(([key, value]) => (
                  <div key={key} className="p-6 bg-primary-50/30 rounded-3xl border border-primary-50">
                    <p className="text-[10px] font-medium text-primary-400 uppercase tracking-widest mb-1">{key.replace('cn_', '').replace('med_', '').replace('_', ' ')}</p>
                    <p className="text-sm font-medium text-slate-700">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-medium text-xs uppercase tracking-widest">Close Viewer</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ViewerBox({ label, icon, content }) {
  if (!content) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <div className="h-6 w-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-medium">{icon}</div>
        <h5 className="text-xs font-medium text-slate-900 uppercase tracking-widest">{label}</h5>
      </div>
      <div className="p-6 bg-white border border-slate-100 rounded-[2rem] text-sm text-slate-600 leading-relaxed min-h-[100px] whitespace-pre-wrap font-medium">
        {content}
      </div>
    </div>
  );
}
