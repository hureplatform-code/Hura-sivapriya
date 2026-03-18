import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  User, Activity, CheckCircle2, AlertCircle, FileText, Download, TrendingUp, 
  Search, Calendar, Phone, Edit3, Save, Printer, 
  RefreshCw, Eye, Mic, List, Info, ClipboardCheck, ClipboardList, Thermometer, 
  Droplet, Plus, BrainCircuit, Heart, Ear, Stethoscope, 
  ChevronRight, History, Smile, Baby, Scissors, Wind, Zap, Brain, Clock, 
  MoreVertical, X, Droplets, ShieldCheck, ShoppingBag, Trash2, FlaskConical, Pill, Sparkles
} from 'lucide-react';

import auditService from '../../services/auditService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../firebase';
import { getDoc, doc } from 'firebase/firestore';
import medicalRecordService from '../../services/medicalRecordService';
import appointmentService from '../../services/appointmentService';
import patientService from '../../services/patientService';
import medicalMasterService from '../../services/medicalMasterService';
import inventoryService from '../../services/inventoryService';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityIcon = Activity;
const EyeIcon = Eye;

const getRelativeVisitTime = (timestamp) => {
  if (!timestamp) return 'Fresh Case';
  const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 60) return `Just now (${diffInMinutes}m ago)`;
  if (diffInHours < 24) return `Today (${diffInHours}h ago)`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
};

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
  { id: 'pharmacy_lab', name: 'Pharmacy & Lab', icon: ClipboardList },
];

export default function Notes() {
  const location = useLocation();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [labSuggestions, setLabSuggestions] = useState([]);
  const [searchContext, setSearchContext] = useState({ type: null, index: null });
  const [viewingHistoryPatient, setViewingHistoryPatient] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, userData]);

  const fetchNotes = async (isLoadMore = false) => {
    if (!userData?.facilityId && userData?.role !== 'superadmin') {
      setLoading(false);
      return;
    }
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const { records: newNotes, lastDoc } = await medicalRecordService.getAllRecords(
        userData?.facilityId,
        20,
        isLoadMore ? lastVisible : null
      );

      if (isLoadMore) {
        setNotes(prev => [...prev, ...newNotes]);
      } else {
        setNotes(newNotes);
      }

      setLastVisible(lastDoc);
      setHasMore(newNotes.length === 20);
    } catch (error) {
      console.error('Error fetching clinical notes:', error);
      toastError('Failed to load clinical records.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setLastVisible(null);
    setHasMore(true);
    fetchNotes(false);
  };

  if (userData?.role === 'superadmin') {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
           <div className="h-20 w-20 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-6 shadow-inner">
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

  const filteredNotes = notes.filter(note => {
    const matchesSearch = (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.patientOp || note.patientId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.patientPhone || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // If user is searching, filter by search only (global search)
    if (searchQuery.trim().length > 0) return matchesSearch;

    // Otherwise apply date filters
    if (!matchesSearch) return false;

    const noteDate = note.createdAt?.seconds ? new Date(note.createdAt.seconds * 1000) : new Date(note.createdAt);
    const now = new Date();
    const clinicalToday = new Date(now);
    clinicalToday.setHours(2, 0, 0, 0);
    // If it's before 2 AM today, the "clinical day" still belongs to yesterday's 2 AM start
    if (now.getHours() < 2) {
      clinicalToday.setDate(clinicalToday.getDate() - 1);
    }
    
    const clinicalYesterday = new Date(clinicalToday);
    clinicalYesterday.setDate(clinicalYesterday.getDate() - 1);

    const startOfWeek = new Date(clinicalToday);
    startOfWeek.setDate(clinicalToday.getDate() - clinicalToday.getDay()); // Start of this week (Sunday 2 AM)

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setMilliseconds(-1);

    switch (dateFilter) {
      case 'today':
        return noteDate >= clinicalToday;
      case 'yesterday':
        return noteDate >= clinicalYesterday && noteDate < clinicalToday;
      case 'this_week':
        return noteDate >= startOfWeek;
      case 'last_week':
        return noteDate >= startOfLastWeek && noteDate <= endOfLastWeek;
      case 'all':
      default:
        return true;
    }
  });

  // Group by patient to show only the most recent one
  const uniquePatientNotes = Object.values(
    filteredNotes.reduce((acc, note) => {
      const pId = note.patientId || note.patientOp;
      const noteDate = note.createdAt?.seconds ? note.createdAt.seconds * 1000 : new Date(note.createdAt).getTime();
      const accDate = acc[pId]?.createdAt?.seconds ? acc[pId].createdAt.seconds * 1000 : new Date(acc[pId]?.createdAt).getTime() || 0;
      
      if (!acc[pId] || noteDate > accDate) {
        acc[pId] = note;
      }
      return acc;
    }, {})
  ).sort((a, b) => {
     const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
     const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
     return dateB - dateA;
  });

  const getPatientHistory = (id) => {
    return notes.filter(n => n.patientId === id || n.patientOp === id);
  };

  return (
    <>
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto pb-24">
        {/* Standard Clinical Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2">
          <h1 className="text-xl font-bold text-slate-800">Clinical Records</h1>
          <div className="flex items-center gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search OP or phone..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs w-56 focus:border-indigo-500 transition-all shadow-sm"
               />
             </div>
             
             <select 
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
               className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none hover:border-slate-300 transition-all shadow-sm cursor-pointer"
             >
               <option value="today">Today</option>
               <option value="yesterday">Yesterday</option>
               <option value="this_week">This Week</option>
               <option value="last_week">Last Week</option>
               <option value="all">All Days</option>
             </select>

             <button 
               onClick={handleRefresh}
               className="p-1.5 bg-white text-slate-500 rounded-lg hover:text-indigo-600 border border-slate-200 shadow-sm transition-all"
               title="Refresh Data"
             >
               <RefreshCw className={`h-4 w-4 ${loading && !loadingMore ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Patient Name</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">OP ID</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Phone</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Specialty</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Diagnosis</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
             <tbody className="divide-y divide-slate-100/30">
               {loading && !loadingMore ? (
                 <tr>
                   <td colSpan="7" className="py-80 text-center">
                     <div className="flex flex-col items-center gap-8">
                       <div className="relative h-24 w-24">
                          <div className="absolute inset-0 border-8 border-slate-100 rounded-full shadow-inner" />
                          <div className="absolute inset-0 border-8 border-t-indigo-600 rounded-full animate-spin" />
                       </div>
                       <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.5em] animate-pulse">Synchronizing Tactical Data...</p>
                     </div>
                   </td>
                 </tr>
               ) : filteredNotes.length === 0 ? (
                 <tr>
                   <td colSpan="7" className="py-80 text-center">
                      <div className="h-40 w-40 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-10 shadow-inner">
                        <ClipboardList className="h-16 w-16" />
                     </div>
                      <p className="text-slate-400 font-bold text-sm tracking-wide">No Clinical Records Found</p>
                   </td>
                 </tr>
                ) : (
                  uniquePatientNotes.map((note, i) => {
                    const history = getPatientHistory(note.patientId || note.patientOp);
                    return (
                      <motion.tr 
                        key={note.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                      >
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{note.patientName}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Last Visit: {getRelativeVisitTime(note.createdAt)}</span>
                              {history.length > 1 && (
                                <button 
                                  onClick={() => setViewingHistoryPatient({ name: note.patientName, records: history })}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                                >
                                  ({history.length} records)
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-mono font-bold text-slate-600">
                           #{note.patientOp || note.patientId?.slice(-6).toUpperCase() || '---'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-600 font-medium">{note.patientPhone || '---'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                           {note.specialty || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-900 font-bold max-w-[200px] truncate block">
                           {note.diagnosis || '--'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {note.status === 'draft' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded text-[10px] font-bold uppercase border border-amber-100">
                             Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold uppercase border border-emerald-100">
                             Signed
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => {
                             if (note.status === 'draft') {
                                setEditingNoteId(note.id);
                                setIsCreating(true);
                             } else {
                                setViewingNote(note);
                             }
                          }}
                          className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-all font-bold text-[11px] active:scale-95"
                        >
                          {note.status === 'draft' ? 'Resume' : 'View'}
                        </button>
                      </td>
                    </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
           
          <div className="p-4 flex items-center justify-between bg-slate-50/50 border-t border-slate-200">
             <div className="flex items-center gap-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Page 1 of 1</span>
             </div>
             {hasMore && (
                <button
                  onClick={() => fetchNotes(true)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  {loadingMore ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {loadingMore ? 'Syncing...' : 'View More Records'}
                </button>
             )}
          </div>
        </div>
      </div>
    </DashboardLayout>

    <AnimatePresence>
      {isCreating && (
        <NoteEditor 
          initialPatientId={location.state?.patientId}
          initialPatientName={location.state?.patientName}
          initialAppointmentId={location.state?.appointmentId}
          initialRecordId={editingNoteId}
          onClose={() => {
            setIsCreating(false);
            setEditingNoteId(null);
          }} 
          onSave={() => {
            setIsCreating(false);
            setEditingNoteId(null);
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
          onEdit={(id) => {
             setViewingNote(null);
             setEditingNoteId(id);
             setIsCreating(true);
          }}
        />
      )}
      {viewingHistoryPatient && (
        <PatientHistoryModal 
          patient={viewingHistoryPatient}
          onClose={() => setViewingHistoryPatient(null)}
          onViewNote={(note) => {
            setViewingHistoryPatient(null);
            setViewingNote(note);
          }}
        />
      )}
    </AnimatePresence>
    </>
  );
}

function PatientHistoryModal({ patient, onClose, onViewNote }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 mb-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] border border-white/20"
      >
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <History className="h-6 w-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-900 leading-tight">{patient.name}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Clinical Journey Ledger</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
          <div className="space-y-3">
            {[...patient.records].sort((a,b) => {
              const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
              const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
              return dateB - dateA;
            }).map((record, idx) => (
              <motion.div 
                key={record.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all cursor-pointer"
                onClick={() => onViewNote(record)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-black text-slate-900 tabular-nums">
                      {record.createdAt?.seconds 
                        ? new Date(record.createdAt.seconds * 1000).toLocaleDateString('en-US', { day: '2-digit' })
                        : new Date(record.createdAt).toLocaleDateString('en-US', { day: '2-digit' })}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">
                      {record.createdAt?.seconds 
                        ? new Date(record.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short' })
                        : new Date(record.createdAt).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  
                  <div className="h-8 w-[1px] bg-slate-100" />

                  <div>
                    <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {record.specialty || 'General Consultation'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className={`h-1.5 w-1.5 rounded-full ${record.status === 'draft' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                         Status: {record.status} • {record.createdAt?.seconds 
                           ? new Date(record.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric' })
                           : new Date(record.createdAt).toLocaleDateString('en-US', { year: 'numeric' })}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-white border-t border-slate-100 text-center">
           <p className="text-[10px] text-slate-400 font-medium">Total Records Logged: {patient.records.length}</p>
        </div>
      </motion.div>
    </div>
  );
}
function NoteEditor({ onClose, onSave, showNotification, initialPatientId = '', initialPatientName = '', initialAppointmentId = '', initialRecordId = null }) {
  const { userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientId, setPatientId] = useState(initialPatientId);
  const [appointmentId] = useState(initialAppointmentId);
  const [activeSpecialties, setActiveSpecialties] = useState(['general']);
  const [entryMode, setEntryMode] = useState('text');
  const [micVolume, setMicVolume] = useState(0);
  const [fakeTranscript, setFakeTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcriptReviewed, setTranscriptReviewed] = useState(false);
  const [icdSuggestions, setIcdSuggestions] = useState([]);
  const [existingRecordId, setExistingRecordId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(initialPatientName ? { name: initialPatientName, id: initialPatientId } : null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [labSuggestions, setLabSuggestions] = useState([]);
  const [searchContext, setSearchContext] = useState({ type: null, index: null });
  const [viewingHistoryPatient, setViewingHistoryPatient] = useState(null);
  const [associatedApt, setAssociatedApt] = useState(null);
  
  const transcriptRef = React.useRef('');
  const userStopRef = React.useRef(false);

  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    nursingOrders: '',
    diagnosis: '',
    vitals: {
      temp: '',
      hr: '',
      rr: '',
      bp_sys: '',
      bp_dia: '',
      spo2: '',
      weight: '',
      height: '',
      bmi: ''
    },
    specialtyData: {},
    labRequests: [],
    prescriptions: []
  });

  const runAIPolish = async (textToProcess) => {
    try {
      if (!textToProcess || textToProcess.length < 5) {
        showNotification('error', "Transcript too short to process.");
        return;
      }
      setIsAnalyzing(true);
      
      const docRef = doc(db, 'platform_settings', 'main');
      const docSnap = await getDoc(docRef);
      const apiKey = docSnap.exists() ? (docSnap.data().geminiApiKey || '').trim() : '';
      
      if (!apiKey) {
        showNotification('success', "Transcript captured (AI disabled - API Key missing).");
        setFormData(prev => ({ ...prev, subjective: textToProcess }));
        setIsAnalyzing(false);
        return;
      }

      const prompt = `You are a medical scribe. Convert this clinical dictation into a structured SOAP JSON object. 
      Dictation: "${textToProcess}"
      
      Requirements:
      - Use these fields: subjective, objective, assessment, plan, nursing_orders, icd_suggestion.
      - Return ONLY the raw JSON object, no markdown, no preamble.
      - If a field is not mentioned, return empty string.`;

      const getResponse = async (ver, mod) => {
        const url = `https://generativelanguage.googleapis.com/${ver}/models/${mod}:generateContent?key=${apiKey}`;
        return await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
      };

      let response;
      let lastError = '';

      // Stage 1: Attempt Discovery (Most Robust)
      try {
        const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const modelsResp = await fetch(modelsUrl);
        if (modelsResp.ok) {
          const modelsData = await modelsResp.json();
          const available = modelsData.models?.map(m => m.name.replace('models/', '')) || [];
          
          // Priority order for medical documentation
          const priorities = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
          const best = priorities.find(p => available.includes(p)) || available[0];
          
          if (best) {
            console.log("Discovered best model:", best);
            response = await getResponse('v1beta', best);
          }
        }
      } catch (discoveryErr) {
        console.warn("Model discovery failed, falling back to brute-force sequence...", discoveryErr);
      }

      // Stage 2: Fallback Brute-Force Sequence (If discovery fails or selected model fails)
      if (!response || !response.ok) {
        const sequences = [
          { ver: 'v1', mod: 'gemini-1.5-flash' },
          { ver: 'v1beta', mod: 'gemini-1.5-flash' },
          { ver: 'v1', mod: 'gemini-1.5-pro' },
          { ver: 'v1beta', mod: 'gemini-pro' }
        ];

        for (const seq of sequences) {
          try {
            const r = await getResponse(seq.ver, seq.mod);
            if (r.ok) {
              response = r;
              break;
            } else {
              const err = await r.json();
              lastError = err.error?.message || lastError;
            }
          } catch (e) { lastError = e.message; }
        }
      }

      if (!response || !response.ok) {
        throw new Error(lastError || "All AI connection attempts failed. Please verify your API key and quotas in Google AI Studio.");
      }

      const data = await response.json();
      if (data.candidates?.[0]) {
        let text = data.candidates[0].content.parts[0].text;
        // Clean markdown backticks if present
        text = text.replace(/```json|```/g, '').trim();
        
        try {
          const parsed = JSON.parse(text);
          setFormData(prev => ({
            ...prev,
            subjective: parsed.subjective || prev.subjective,
            objective: parsed.objective || prev.objective,
            assessment: parsed.assessment || prev.assessment,
            plan: parsed.plan || prev.plan,
            nursingOrders: parsed.nursing_orders || prev.nursingOrders
          }));
          if (parsed.icd_suggestion) setIcdSuggestions([parsed.icd_suggestion]);
          showNotification('success', "Medical note structured by AI!");
        } catch (jsonErr) {
          console.error("JSON Parse Error:", text);
          throw new Error("AI output format error. Falling back to manual entry.");
        }
      }
    } catch (err) { 
      console.error("AI processing error:", err);
      showNotification('error', err.message || "AI Analysis failed.");
    } finally { setIsAnalyzing(false); }
  };

  useEffect(() => {
    fetchPatients();
    if (initialRecordId) loadExistingRecord(initialRecordId);
    else if (appointmentId) loadExistingDraft();
  }, [initialRecordId]);

  const loadExistingRecord = async (id) => {
    try {
      const record = await medicalRecordService.getRecordById(id);
      if (record) {
        setExistingRecordId(record.id);
        setFormData({
          subjective: record.subjective || '',
          objective: record.objective || '',
          assessment: record.assessment || '',
          plan: record.plan || '',
          nursingOrders: record.nursingOrders || '',
          diagnosis: record.diagnosis || '',
          vitals: record.vitals || {
            temp: '', hr: '', rr: '', bp_sys: '', bp_dia: '', spo2: '', weight: '', height: '', bmi: ''
          },
          specialtyData: record.specialtyData || {},
          labRequests: record.labRequests || [],
          prescriptions: record.prescriptions || []
        });
        if (record.specialties?.length > 0) setActiveSpecialties(record.specialties);
        if (record.patientId) setPatientId(record.patientId);
      }
    } catch (e) { console.error("Load record failed:", e); }
  };

  const loadExistingDraft = async () => {
    try {
      if (appointmentId) {
        const appointment = await appointmentService.getAppointmentById(appointmentId);
        if (appointment) setAssociatedApt(appointment);
      }
      
      const draft = await medicalRecordService.getRecordByAppointment(appointmentId);
      if (draft) {
        setExistingRecordId(draft.id);
        
        // SYNC PAYMENT STATUS: Use the appointment (source of truth for billing) to update the draft's list
        const latestApt = appointment || associatedApt;
        const syncedLabs = (draft.labRequests || []).map(r => {
           const aptMatch = (latestApt?.labRequests || []).find(al => (al.test || al.testName) === (r.test || r.name));
           return aptMatch ? { ...r, isPaid: aptMatch.isPaid } : r;
        });

        const syncedPrescriptions = (draft.prescriptions || []).map(p => {
           const aptMatch = (latestApt?.prescriptions || []).find(ap => ap.medicine === p.medicine);
           return aptMatch ? { ...p, isPaid: aptMatch.isPaid, isDispensed: aptMatch.isDispensed } : p;
        });

        setFormData({
          subjective: draft.subjective || '',
          objective: draft.objective || '',
          assessment: draft.assessment || '',
          plan: draft.plan || '',
          nursingOrders: draft.nursingOrders || '',
          diagnosis: draft.diagnosis || '',
          vitals: draft.vitals || {
            temp: '', hr: '', rr: '', bp_sys: '', bp_dia: '', spo2: '', weight: '', height: '', bmi: ''
          },
          specialtyData: draft.specialtyData || {},
          labRequests: syncedLabs,
          prescriptions: syncedPrescriptions
        });
        if (draft.specialties?.length > 0) setActiveSpecialties(draft.specialties);
        if (draft.patientId) setPatientId(draft.patientId);
      } else if (appointmentId) {
        const appointment = await appointmentService.getAppointmentById(appointmentId);
        if (appointment && appointment.patientId) {
          setPatientId(appointment.patientId);
          setFormData(prev => ({
            ...prev,
            subjective: appointment.reason || appointment.complaint || prev.subjective,
            vitals: { ...prev.vitals, ...(appointment.vitals || {}) }
          }));
        }
      }
    } catch (e) { console.error("Load draft/appointment failed:", e); }
  };

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const arrived = await appointmentService.getArrivedAppointments(userData?.facilityId);
      // Fetch full details for arrived patients
      const patientPromises = arrived.map(a => patientService.getPatientById(a.patientId));
      const fullPatients = await Promise.all(patientPromises);
      setPatients(fullPatients.filter(p => !!p));
    } catch (e) { console.error(e); }
    finally { setLoadingPatients(false); }
  };

  const toggleSpecialty = (id) => {
    setActiveSpecialties(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(s => s !== id) : prev) : [...prev, id]);
  };

  const updateSpecialtyField = (field, value) => setFormData(prev => ({ ...prev, specialtyData: { ...prev.specialtyData, [field]: value } }));

  const toggleSurface = (surface) => {
    const currentSurfaces = formData.specialtyData.surfaces || '';
    const surfacesArray = currentSurfaces ? currentSurfaces.split(',').filter(Boolean) : [];
    const newSurfaces = surfacesArray.includes(surface)
      ? surfacesArray.filter(s => s !== surface)
      : [...surfacesArray, surface];
    updateSpecialtyField('surfaces', newSurfaces.join(','));
  };

  const generateIcdSuggestions = (text) => {
    if (!text) return;
    const textLower = text.toLowerCase();
    const suggestions = [];
    if(textLower.includes('headache')) suggestions.push('G43.909');
    if(textLower.includes('fever')) suggestions.push('J06.9');
    if(textLower.includes('cough')) suggestions.push('R05.9');
    if(suggestions.length === 0) suggestions.push('R69');
    setIcdSuggestions(suggestions);
  };

  const handleSave = async (status = 'signed') => {
    if (!patientId) { showNotification('error', 'Select a patient.'); return; }
    try {
      const patient = patients.find(p => p.id === patientId);
      const recordData = { 
        ...formData, 
        patientId, 
        patientName: selectedPatient?.name || 'Patient', 
        patientOp: selectedPatient?.opNumber || selectedPatient?.patientId || '',
        patientPhone: selectedPatient?.phone || '',
        appointmentId, 
        specialties: activeSpecialties, 
        status, 
        entryMode,
        doctorName: userData?.name || 'Dr. Dolly Smith', 
        facilityId: userData?.facilityId,
        title: activeSpecialties.length > 1 
          ? 'Multi-Specialty Clinical Note' 
          : `${SPECIALTIES.find(s => s.id === activeSpecialties[0]).name} Clinical Note`
      };

      if (!existingRecordId) {
        recordData.createdAt = new Date();
      }

      if (existingRecordId) await medicalRecordService.updateRecord(existingRecordId, recordData, { id: userData?.uid, name: userData?.name });
      else await medicalRecordService.createRecord(recordData, { id: userData?.uid, name: userData?.name });
      
      // SYNC TO APPOINTMENT: Critical for Lab/Pharmacy to see these requests
      if (appointmentId) {
        await appointmentService.updateAppointment(appointmentId, {
          labRequests: formData.labRequests || [],
          prescriptions: formData.prescriptions || [],
          diagnosis: formData.diagnosis || '',
          vitals: formData.vitals || {}
        });
      }

      if (status === 'signed') handleAutoRoute();
      else showNotification('success', 'Draft saved.');
    } catch (err) { 
      showNotification('error', 'Save failed.'); 
      console.error(err); 
    }
  };

  const handleAutoRoute = async () => {
    let nextStatus = 'completed';
    
    // Smart Routing Logic: Only route to departments if there are UNPAID/UNPROCESSED items
    const hasUnpaidMeds = formData.prescriptions?.some(p => !p.isPaid && !p.isDispensed);
    const hasUnpaidLabs = formData.labRequests?.some(l => !l.isPaid);

    if (hasUnpaidMeds) {
      nextStatus = 'awaiting-pharmacy';
    } else if (hasUnpaidLabs) {
      nextStatus = 'awaiting-lab';
    } else if (formData.nursingOrders?.trim()) {
      nextStatus = 'awaiting-nurse';
    }
    
    try {
      if (appointmentId) {
        await appointmentService.updateAppointmentStatus(appointmentId, nextStatus);
        
        const destination = nextStatus === 'completed' ? 'Discharge' : nextStatus.replace('awaiting-', '').toUpperCase();
        showNotification('success', `Consultation signed. Patient routed to ${destination}.`);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Routing failed.');
    }
    
    // Always call onSave to close editor and refresh
    if (onSave) onSave();
  };

  const handleRoute = async (routeTo) => {
    try { if (appointmentId) await appointmentService.updateAppointmentStatus(appointmentId, routeTo); }
    catch (err) { console.error(err); }
    onSave();
  };

  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { 
    if (patientId) {
      fetchHistory(); 
      fetchPatientDetails();
    } else {
      setSelectedPatient(null);
    }
  }, [patientId]);

  // Ensure patientId is updated if props change (for case where parent re-renders with new state)
  useEffect(() => {
    if (initialPatientId && initialPatientId !== patientId) {
      setPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  const fetchPatientDetails = async () => {
    if (!patientId) return;
    try {
      setLoadingPatient(true);
      const p = await patientService.getPatientById(patientId);
      if (p) {
        setSelectedPatient(p);
      } else if (initialPatientId === patientId && initialPatientName) {
         // Keep the skeleton if ID match but doc not found (maybe slow indexing)
         setSelectedPatient({ name: initialPatientName, id: patientId });
      } else {
         // If truly not found and no skeleton, reset to allow search
         setSelectedPatient(null);
         if (!initialPatientId) setPatientId(''); 
      }
    } catch (e) { 
       console.error("Error fetching patient details:", e);
       if (initialPatientName) setSelectedPatient({ name: initialPatientName, id: patientId });
    }
    finally { setLoadingPatient(false); }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await medicalRecordService.getRecordsByPatient(patientId);
      setPatientHistory(history.filter(h => h.status === 'signed'));
    } catch (err) { console.error(err); }
    finally { setLoadingHistory(false); }
  };

  const handleSearchMaster = async (type, term, index, section) => {
    if (!term || term.trim().length < 1) {
       if (section === 'prescription') setMedicineSuggestions([]);
       else if (section === 'labs') setLabSuggestions([]);
       else if (section === 'diagnosis') setIcdSuggestions([]);
       return;
    }
    try {
    if (section === 'prescription') {
      setSearchContext({ type: 'prescription', index });
        // Search both Master Catalogue and Inventory
        const [masterResults, invResults] = await Promise.all([
          medicalMasterService.search('pharma', term, userData?.facilityId),
          inventoryService.search(term, userData?.facilityId)
        ]);

        // Merge results, giving preference to inventory items if IDs match or names are very similar
        const merged = masterResults.map(m => ({ ...m, _source: 'Master Catalog' }));
        
        // Add inventory items that aren't already represented, or update stock for existing ones
        invResults.forEach(invItem => {
          const invName = (invItem.name || '').trim().toLowerCase();
          const existing = merged.find(m => {
            const masterBrand = (m.brandName || '').trim().toLowerCase();
            const masterName = (m.name || '').trim().toLowerCase();
            // Aggressive fuzzy matching
            return (
              (masterBrand && invName.includes(masterBrand)) || 
              (masterName && invName.includes(masterName)) ||
              (masterBrand && masterBrand.includes(invName)) ||
              (masterName && masterName.includes(invName)) ||
              (m.id === invItem.id) ||
              (m.code && invItem.code && m.code === invItem.code)
            );
          });
          
          const invStockRaw = invItem.stock ?? invItem.quantity ?? invItem.availableStock ?? invItem.currentStock ?? invItem.totalStock ?? invItem.availableBalance ?? invItem.qty ?? 0;
          const invStock = typeof invStockRaw === 'string' ? parseFloat(invStockRaw) : invStockRaw;

          if (existing) {
            const currentMasterStockRaw = existing.availableStock ?? existing.stock ?? existing.quantity ?? 0;
            const currentMasterStock = typeof currentMasterStockRaw === 'string' ? parseFloat(currentMasterStockRaw) : currentMasterStockRaw;
            existing.availableStock = (Number(currentMasterStock) || 0) + invStock;
            existing._source = 'Unified Inventory';
            existing._syncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            merged.push({
              ...invItem,
              brandName: invItem.name,
              availableStock: invStock,
              _source: 'Physical Stock',
              _syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        });

        setMedicineSuggestions(merged);
      } else if (section === 'labs') {
        const results = await medicalMasterService.search(type, term, userData?.facilityId);
        setLabSuggestions(results);
        setSearchContext({ type: 'lab', index });
      } else if (section === 'diagnosis') {
        const results = await medicalMasterService.search(type, term, userData?.facilityId);
        setIcdSuggestions(results.map(r => ({ code: r.code, desc: r.description || r.name })));
        setSearchContext({ type: 'diagnosis', index: 0 });
      }
    } catch (e) { 
      console.error(`Master search failed for ${type}:`, e); 
      if (section === 'prescription') setMedicineSuggestions([]);
      else if (section === 'labs') setLabSuggestions([]);
    }
  };

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
        className="w-full max-w-6xl h-[95vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
              <Stethoscope className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-4">
                 <div>
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                       {selectedPatient ? `Consultation: ${selectedPatient.name}` : 'Clinical Consultation'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                       {selectedPatient ? (
                          <>
                             <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-md border border-primary-100">OP-{selectedPatient.opNumber || selectedPatient.id?.slice(0,8)}</span>
                             <span className="text-slate-200 font-normal">|</span>
                             <span>Active Documentation Session</span>
                          </>
                       ) : 'Secure Patient Assessment Registry'}
                    </p>
                 </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Session automatically becomes permanent once "Signed".</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowHistory(!showHistory)}
               className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${showHistory ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
             >
                <History className="h-4 w-4" />
                {showHistory ? 'Close History' : 'View Patient History'}
             </button>
             <button 
               onClick={onClose}
               className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm"
             >
               <X className="h-6 w-6" />
             </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Specialty Sidebar (Left - Constant) */}
          <div className="w-64 bg-slate-50/50 border-r border-slate-100 overflow-y-auto p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Specialty Template</p>
            {SPECIALTIES.map((spec) => (
              <button
                key={spec.id}
                onClick={() => toggleSpecialty(spec.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider
                  ${activeSpecialties.includes(spec.id) 
                    ? 'bg-white text-primary-600 shadow-sm border border-slate-100' 
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 border border-transparent'}
                `}
              >
                <spec.icon className={`h-4 w-4 ${activeSpecialties.includes(spec.id) ? 'text-primary-500' : 'text-slate-400'}`} />
                {spec.name}
              </button>
            ))}
          </div>

          {/* Main Form Content */}
          <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-white">
            {/* Patient Identification Hub - Premium Unified View */}
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-primary-500/10" />
               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 flex flex-col justify-center">
                     {selectedPatient && !loadingPatient ? (
                        <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm flex items-center gap-8 relative overflow-hidden h-full min-h-[180px]">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                           <div className="flex-1 space-y-4 relative z-10">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedPatient.name}</h3>
                                    <div className="flex items-center gap-3 mt-1.5">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                          <Phone className="h-3.5 w-3.5 text-primary-500/50" />
                                          {selectedPatient.phoneNumber || 'N/A'}
                                       </p>
                                       <span className="text-slate-200">•</span>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                          <Info className="h-3.5 w-3.5 text-primary-500/50" />
                                          OP-{selectedPatient.opNumber || selectedPatient.id?.slice(0,8)}
                                       </p>
                                    </div>
                                 </div>
                                 {!initialPatientId && (
                                    <button 
                                       onClick={() => { setPatientId(''); setSelectedPatient(null); }}
                                       className="px-4 py-2 bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-slate-100"
                                    >
                                       Switch Patient
                                    </button>
                                 )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-5 border-t border-slate-50">
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mt-0.5">Age / Sex</p>
                                    <p className="text-sm font-bold text-slate-800 tracking-tight">{selectedPatient.age || '--'} Years / {selectedPatient.gender || '--'}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mt-0.5">Blood Grp</p>
                                    <p className="text-sm font-bold text-emerald-600 tracking-tight">{selectedPatient.bloodGroup || '--'}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mt-0.5">Last Visit</p>
                                    <p className="text-sm font-bold text-indigo-600 tracking-tight">{getRelativeVisitTime(patientHistory[0]?.createdAt)}</p>
                                 </div>
                                 <div className="space-y-1 text-right md:text-left">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 mt-0.5">Baseline BP</p>
                                    <p className="text-sm font-bold text-slate-800 tracking-tight">
                                       {patientHistory[0]?.vitals?.bp_sys || '--'}/{patientHistory[0]?.vitals?.bp_dia || '--'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ) : (patientId || loadingPatient) ? (
                        <div className="bg-white border border-slate-200 p-12 rounded-xl shadow-sm flex flex-col items-center justify-center gap-4 min-h-[200px]">
                           <div className="h-12 w-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              {loadingPatient ? 'Verifying Identity...' : 'Loading Clinical Environment...'}
                           </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                           <div className="space-y-3">
                              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em] pl-1">Identify Patient</label>
                              <div className="relative">
                                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                 <input 
                                    type="text"
                                    placeholder="Search by Name, OP Number or Mobile..."
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold transition-all shadow-sm focus:ring-4 focus:ring-primary-50 focus:border-primary-500 outline-none"
                                    onChange={async (e) => {
                                       const term = e.target.value;
                                       if (term.length > 2) {
                                          const results = await patientService.searchPatients(userData?.facilityId, term);
                                          setPatients(results);
                                       } else {
                                          fetchPatients();
                                       }
                                    }}
                                 />
                              </div>
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em] pl-1">Registry Context</label>
                              <div className="relative">
                                 <select 
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold shadow-sm outline-none focus:border-primary-500 transition-all appearance-none text-slate-900 h-[56px]"
                                 >
                                    <option value="">Select an active case...</option>
                                    {patients.map(p => (
                                       <option key={p.id} value={p.id}>{p.name} ({p.phoneNumber || p.opNumber || p.id?.slice(0,6)})</option>
                                    ))}
                                 </select>
                                 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 rotate-90" />
                              </div>
                           </div>
                        </div>
                      )}
                  </div>

                  <div className="lg:col-span-4 bg-white/40 backdrop-blur-md rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-center">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary-500" /> Clinical Pulse
                     </p>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <p className="text-[11px] font-bold text-slate-500">Prior Diagnosis</p>
                           <p className="text-[11px] font-black text-slate-900 max-w-[150px] truncate text-right">{patientHistory[0]?.diagnosis || 'No record'}</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                           <p className="text-[11px] font-bold text-slate-500">Last Encounter</p>
                           <p className="text-[11px] font-black text-slate-900">{patientHistory[0]?.title || 'Fresh Case'}</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                           <p className="text-[11px] font-bold text-slate-500">Weight Metric</p>
                           <p className="text-[11px] font-black text-slate-900">{patientHistory[0]?.vitals?.weight ? `${patientHistory[0].vitals.weight} KG` : '--'}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

         {/* Input Mode Hub */}
         <div className="flex items-center justify-between border-b border-slate-100 pb-8">
               <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Documentation</h3>
                  <p className="text-sm text-slate-500 font-medium tracking-tight">Standardize your clinical observations with SOAP structure.</p>
               </div>
               
               <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
                  <button 
                     onClick={() => setEntryMode('text')}
                     className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${entryMode === 'text' ? 'bg-white shadow-xl text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                     <FileText className="h-4 w-4" /> Text Entry
                  </button>
                  <button 
                     onClick={() => setEntryMode('audio')}
                     className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${entryMode === 'audio' ? 'bg-indigo-600 shadow-xl shadow-indigo-200 text-white border border-indigo-500' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                     <Mic className="h-4 w-4" /> AI Dictation
                  </button>
               </div>
            </div>

             {entryMode === 'audio' && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <div>
                         <h4 className="text-lg font-semibold text-indigo-900">Audio Dictation</h4>
                         <p className="text-xs text-indigo-600 font-medium mt-1">Record your note and AI will generate the transcript and SOAP.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={async () => {
                           const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                           
                           if (!isRecording) {
                              if (!SpeechRecognition) {
                                 showNotification('error', 'Speech recognition is not supported in this browser. Please use Chrome.');
                                 return;
                              }

                              try {
                                 // Force Mic Permission Handshake
                                 await navigator.mediaDevices.getUserMedia({ audio: true });
                              } catch (permissionErr) {
                                 console.error("Microphone permission error:", permissionErr);
                                 showNotification('error', 'Microphone blocked. Please check your browser address bar to allow mic access.');
                                 return;
                              }
                              
                              userStopRef.current = false;
                              
                              transcriptRef.current = '';
                              setFakeTranscript('');
                              
                              const recognition = new SpeechRecognition();
                              recognition.continuous = true;
                              recognition.interimResults = true;
                              recognition.lang = 'en-US';

                              recognition.onstart = async () => {
                                 setIsRecording(true);
                                 try {
                                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                                    const analyser = audioCtx.createAnalyser();
                                    const source = audioCtx.createMediaStreamSource(stream);
                                    source.connect(analyser);
                                    analyser.fftSize = 256;
                                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                                    const updateVol = () => {
                                       if (!window._currentRecognition) {
                                          if (audioCtx.state !== 'closed') audioCtx.close();
                                          return;
                                       }
                                       analyser.getByteFrequencyData(dataArray);
                                       const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                                       setMicVolume(Math.min(100, (average / 128) * 100));
                                       requestAnimationFrame(updateVol);
                                    };
                                    updateVol();
                                 } catch (e) {
                                    console.warn("Analyzer failed", e);
                                 }
                              };
                              recognition.onresult = (event) => {
                                 let interimTranscript = '';
                                 for (let i = event.resultIndex; i < event.results.length; ++i) {
                                    if (event.results[i].isFinal) {
                                       transcriptRef.current += event.results[i][0].transcript + ' ';
                                    } else {
                                       interimTranscript += event.results[i][0].transcript;
                                    }
                                 }
                                 setFakeTranscript((transcriptRef.current + interimTranscript).trim());
                              };

                              recognition.onerror = (event) => {
                                 console.error('Speech recognition error:', event.error);
                                 if (event.error === 'no-speech' && !userStopRef.current) {
                                    // Silent timeout: don't stop recording, let onend handle the relay
                                    console.warn("Voice timeout - relayer will restart...");
                                    return;
                                 }
                                 if (event.error === 'not-allowed' || event.error === 'aborted') {
                                     userStopRef.current = true;
                                 }
                                 setIsRecording(false);
                                 if(event.error !== 'aborted') {
                                     showNotification('error', `Speech Recognition Error: ${event.error}`);
                                 }
                              };

                              recognition.onend = async () => {
                                 // Rely ONLY on the ref inside this closure to prevent infinite loops from stale state
                                 if (!userStopRef.current) {
                                    try { 
                                       window._currentRecognition.start(); 
                                    } catch(e) { 
                                       console.warn("Relay restart failed:", e); 
                                    }
                                    return;
                                 }

                                 // User explicitly stopped
                                 setIsRecording(false);
                                 if (transcriptRef.current.trim().length > 0) {
                                    runAIPolish(transcriptRef.current);
                                 }
                                 
                                 // Clean up
                                 window._currentRecognition = null;
                              };
                              recognition.start();
                              window._currentRecognition = recognition;
                           } else {
                              userStopRef.current = true;
                              setIsRecording(false);
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
                   {(isRecording || fakeTranscript || isAnalyzing) && (
                      <div className={`bg-white p-8 rounded-2xl shadow-xl border transition-all duration-500 ${isRecording ? 'border-primary-200 ring-4 ring-primary-50/50' : 'border-indigo-100'}`}>
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Mic className="h-3.5 w-3.5" />
                                 Live Voice Feed
                               </p>
                               {isRecording && (
                                  <div className="flex items-end gap-1 h-4">
                                     <motion.span animate={{ height: [4, 8 + (micVolume * 0.5), 4] }} transition={{ repeat: Infinity, duration: 0.2 }} className="w-1.5 bg-primary-400 rounded-full" />
                                     <motion.span animate={{ height: [12, 4 + (micVolume * 1.5), 12] }} transition={{ repeat: Infinity, duration: 0.2, delay: 0.05 }} className="w-1.5 bg-primary-500 rounded-full" />
                                     <motion.span animate={{ height: [4, 8 + (micVolume * 0.5), 4] }} transition={{ repeat: Infinity, duration: 0.2, delay: 0.1 }} className="w-1.5 bg-primary-600 rounded-full" />
                                  </div>
                               )}
                            </div>
                            {isRecording && (
                               <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-[0.1em]">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Streaming Data
                               </span>
                            )}
                         </div>

                          <textarea 
                             value={fakeTranscript}
                             onChange={(e) => {
                                setFakeTranscript(e.target.value);
                                transcriptRef.current = e.target.value;
                             }}
                             disabled={isRecording || isAnalyzing}
                             placeholder={isRecording ? "Listening... speak clearly" : "Captured clinical script. You can edit this before AI processing..."}
                             className={`w-full text-base font-medium leading-relaxed p-8 rounded-xl min-h-[160px] transition-all outline-none resize-none
                                ${fakeTranscript ? 'text-slate-800 bg-slate-50' : 'text-slate-400 bg-slate-50/50 italic'} 
                                border border-slate-100 shadow-inner mb-6 focus:ring-4 focus:ring-primary-50 focus:bg-white`}
                          />
                       <div className="flex items-center justify-between">
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

                          {!isRecording && fakeTranscript && (
                             <button 
                               type="button"
                               onClick={() => runAIPolish(fakeTranscript)}
                               disabled={isAnalyzing}
                               className="flex items-center gap-2 px-6 py-3 bg-primary-100 text-primary-700 rounded-xl hover:bg-primary-200 transition-all text-[10px] font-bold uppercase tracking-[0.1em]"
                             >
                                <BrainCircuit className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                {isAnalyzing ? "Analyzing..." : "Process with AI"}
                             </button>
                          )}
                       </div>
                      </div>
                )}
             </div>
          )}

           {associatedApt?.structuredResults?.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm"
              >
                  <div className="bg-emerald-50 px-8 py-4 flex items-center justify-between border-b border-emerald-100">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                           <FlaskConical className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest leading-none">Flash Lab Results</h3>
                           <p className="text-[10px] font-bold text-emerald-600/70 mt-1 uppercase tracking-wider">Reported {associatedApt.labCompletedAt ? new Date(associatedApt.labCompletedAt).toLocaleTimeString() : 'Recently'}</p>
                        </div>
                     </div>
                     <span className="px-3 py-1 bg-white/50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">Finalized Findings</span>
                  </div>
                  
                  <div className="p-8 grid grid-cols-1 gap-12">
                     {associatedApt.structuredResults.map((res, idx) => (
                        <div key={idx} className="space-y-4">
                           <div className="flex items-center gap-2 mb-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{res.name}</h4>
                           </div>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {Object.entries(res.values || {}).map(([key, val]) => (
                                 <div key={key} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase truncate mb-1">{key}</p>
                                    <p className="text-base font-black text-slate-900 tabular-nums leading-none">{val}</p>
                                 </div>
                              ))}
                           </div>
                           {res.remarks && (
                              <div className="bg-emerald-50/30 p-4 rounded-xl border border-dashed border-emerald-100/50">
                                 <p className="text-[8px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <Sparkles className="h-3 w-3" /> Tech Observation
                                 </p>
                                 <p className="text-xs font-bold text-emerald-900/70 leading-relaxed italic">"{res.remarks}"</p>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
              </motion.div>
           )}

           {/* SOAP SECTION - Enhanced Visibility Card Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
               {/* Subjective */}
               <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-blue-200 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <FileText className="h-6 w-6" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-slate-900 tracking-tight">Subjective (S)</h4>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Chief Complaint & History</p>
                     </div>
                  </div>
                  <textarea 
                     className="w-full flex-1 min-h-[160px] p-6 bg-slate-50/50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none text-sm font-medium leading-relaxed transition-all placeholder:text-slate-300"
                     placeholder="What the patient says: Chief complaints, history of present illness..."
                     value={formData.subjective}
                     onChange={(e) => {
                        setFormData({...formData, subjective: e.target.value});
                        generateIcdSuggestions(e.target.value);
                     }}
                  />
               </div>

               {/* Objective */}
               <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-emerald-200 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Activity className="h-6 w-6" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-slate-900 tracking-tight">Objective (O)</h4>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Exam Findings & Vitals</p>
                     </div>
                  </div>
                  <textarea 
                     className="w-full flex-1 min-h-[160px] p-6 bg-slate-50/50 rounded-xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none text-sm font-medium leading-relaxed transition-all placeholder:text-slate-300"
                     placeholder="Observation / Exam findings, Vital signs, Lab results reviewed..."
                     value={formData.objective}
                     onChange={(e) => setFormData({...formData, objective: e.target.value})}
                  />
               </div>

               {/* Assessment */}
               <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-amber-200 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Brain className="h-6 w-6" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-slate-900 tracking-tight">Assessment (A)</h4>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Diagnosis & ICD Codes</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <textarea 
                        className="w-full min-h-[120px] p-6 bg-slate-50/50 rounded-xl border-2 border-transparent focus:border-amber-500 focus:bg-white outline-none text-sm font-medium leading-relaxed transition-all placeholder:text-slate-300 shadow-inner"
                        placeholder="Clinical impression, Differential diagnosis..."
                        value={formData.assessment}
                        onChange={(e) => setFormData({...formData, assessment: e.target.value})}
                     />
                     
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                           <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Clinical ICD-10 Code
                        </label>
                        <div className="relative">
                           <input 
                              placeholder="Search or Select ICD-10..."
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold shadow-inner"
                              value={formData.diagnosis}
                              onChange={(e) => { const term = e.target.value; setFormData({...formData, diagnosis: term}); handleSearchMaster("icd", term, 0, "diagnosis"); }}
                           />
                           {icdSuggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden p-1 max-h-60 overflow-y-auto">
                                 {icdSuggestions.map(item => (
                                    <button 
                                       key={item.code}
                                       type="button"
                                       onClick={() => {
                                          setFormData({...formData, diagnosis: item.code});
                                          setIcdSuggestions([]);
                                       }}
                                       className="w-full text-left px-5 py-3 hover:bg-slate-50 rounded-xl transition-all flex flex-col gap-0.5"
                                    >
                                       <span className="text-xs font-bold text-slate-900">{item.code}</span>
                                       <span className="text-[10px] text-slate-400 font-medium">{item.desc}</span>
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Plan */}
               <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-indigo-200 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <ClipboardList className="h-6 w-6" />
                     </div>
                     <div>
                        <h4 className="text-lg font-bold text-slate-900 tracking-tight">Plan (P)</h4>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Treatment & Follow-up</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <textarea 
                        className="w-full min-h-[160px] p-6 bg-slate-50/50 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none text-sm font-medium leading-relaxed transition-all placeholder:text-slate-300"
                        placeholder="Treatment plan: Procedures, education, and follow-up steps..."
                        value={formData.plan}
                        onChange={(e) => setFormData({...formData, plan: e.target.value})}
                     />
                  </div>
                </div>
             </div>

             {/* Nursing Orders - Full Width */}
             <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-blue-200 mt-8">
                <div className="flex items-center gap-4 mb-6">
                   <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <ClipboardCheck className="h-6 w-6" />
                   </div>
                   <div>
                      <h4 className="text-lg font-bold text-slate-900 tracking-tight">Nursing Orders</h4>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Procedural instructions & clinic Care</p>
                   </div>
                </div>
                <textarea 
                   className="w-full min-h-[100px] p-6 bg-slate-50/50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none text-sm font-medium transition-all placeholder:text-slate-300 shadow-inner"
                   placeholder="Document nursing actions: Injections, dressings, vitals monitoring intervals..."
                   value={formData.nursingOrders}
                   onChange={(e) => setFormData({...formData, nursingOrders: e.target.value})}
                />
             </div>


            {/* Vitals Hub - Compact High Density */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl space-y-6">
               <div className="flex items-center gap-4 px-2">
                  <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-900 shadow-sm transition-transform hover:scale-110">
                     <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                     <h4 className="text-xl font-bold text-slate-900 tracking-tight">Vital Signs</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Physiological Parameters</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {[
                    { label: 'Temp', field: 'temp', unit: '°C' },
                    { label: 'HR', field: 'hr', unit: 'bpm' },
                    { label: 'RR', field: 'rr', unit: '/min' },
                    { label: 'Sys', field: 'bp_sys', unit: 'mmHg' },
                    { label: 'Dia', field: 'bp_dia', unit: 'mmHg' },
                    { label: 'SpO2', field: 'spo2', unit: '%' },
                    { label: 'Weight', field: 'weight', unit: 'kg' },
                    { label: 'Height', field: 'height', unit: 'cm' }
                  ].map((v) => (
                    <div key={v.field} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2 group hover:border-primary-200 transition-all">
                       <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tighter px-0.5">{v.label}</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            placeholder="--"
                            value={formData.vitals[v.field]}
                            onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, [v.field]: e.target.value } })}
                            className="w-full py-1 bg-slate-50 border-b-2 border-transparent focus:border-primary-500 focus:bg-white outline-none text-sm font-black text-slate-900 transition-all text-center rounded-md"
                          />
                          <span className="absolute -bottom-4 left-0 w-full text-center text-[7px] font-bold text-slate-300 uppercase opacity-0 group-hover:opacity-100 transition-opacity">{v.unit}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Prescription Hub */}
            <div className="bg-white border border-slate-200 p-10 rounded-2xl space-y-10 shadow-sm">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-2xl">
                        <ClipboardCheck className="h-8 w-8" />
                     </div>
                     <div>
                        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Prescription Hub</h4>
                        <p className="text-sm text-slate-500 font-medium">Digital pharmacy medication orders</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setFormData({ ...formData, prescriptions: [...formData.prescriptions, { medicine: '', dosage: '', frequency: '', duration: '', route: 'Oral' }] })}
                    className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    <Plus className="h-4 w-4" /> Add Medication
                  </button>
               </div>

               <div className="space-y-4">
                  {formData.prescriptions.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                       <ClipboardList className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-sm font-medium text-slate-300 uppercase tracking-widest">No medications prescribed yet</p>
                    </div>
                  ) : (
                    <div className="w-full">
                        <div className="space-y-6">
                           {(formData.prescriptions || []).map((p, idx) => (
                          <div key={idx} className={`bg-slate-50/50 hover:bg-white transition-all p-8 rounded-2xl border border-slate-100 group space-y-6 shadow-sm hover:shadow-md ${p.isPaid ? 'opacity-90 grayscale-[0.5]' : ''}`}>
                             <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                   <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${p.isPaid ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}>
                                      {p.isPaid ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication Segment</p>
                                      {p.isPaid && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded">Paid & Locked</span>}
                                   </div>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                                <div className="md:col-span-12 relative">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Search Medicine</label>
                                   <div className="relative">
                                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                      <input 
                                         placeholder="Type brand or generic name..." 
                                         value={p.medicine}
                                         readOnly={p.isPaid}
                                         autoComplete="off"
                                         onChange={(e) => {
                                            if (p.isPaid) return;
                                            const term = e.target.value;
                                            const newP = [...formData.prescriptions];
                                            newP[idx].medicine = term;
                                            setFormData({...formData, prescriptions: newP});
                                            handleSearchMaster('pharmacy', term, idx, 'prescription');
                                         }}
                                         onBlur={() => setTimeout(() => setSearchContext({type: null, index: null}), 300)}
                                         className={`w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold shadow-sm transition-all ${p.isPaid ? 'bg-slate-50 cursor-not-allowed border-transparent' : 'focus:border-blue-500'}`}
                                      />
                                   </div>
                                   {searchContext.type === 'prescription' && searchContext.index === idx && medicineSuggestions.length > 0 && !p.isPaid && (
                                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 z-[100] overflow-hidden max-h-[400px] overflow-y-auto">
                                         <div className="p-2 space-y-0.5">
                                            {medicineSuggestions.map((m) => (
                                               <button 
                                                  key={m.id}
                                                  onMouseDown={(e) => {
                                                     e.preventDefault();
                                                     const newP = [...formData.prescriptions];
                                                     newP[idx].medicine = m.brandName || m.name;
                                                     if (m.dosage) newP[idx].dosage = m.dosage;
                                                     setFormData({...formData, prescriptions: newP});
                                                     setMedicineSuggestions([]);
                                                     setSearchContext({type: null, index: null});
                                                  }}
                                                  className="w-full text-left px-5 py-4 hover:bg-blue-50/50 transition-all rounded-xl flex items-center justify-between group/item border border-transparent hover:border-blue-100"
                                               >
                                                  <div className="flex items-center gap-4">
                                                     <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-white group-hover/item:text-blue-600 transition-all shadow-inner">
                                                        <Pill className="h-5 w-5" />
                                                     </div>
                                                     <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 truncate">
                                                           {m.brandName || m.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.genericName || m.generic || 'Generic Available'}</span>
                                                     </div>
                                                  </div>
                                                  <div className="text-right">
                                                     <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 group-hover/item:bg-blue-100">
                                                        {m.category || 'Pharmacy'}
                                                     </span>
                                                  </div>
                                               </button>
                                            ))}
                                         </div>
                                      </div>
                                   )}
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 items-end border-t border-slate-100/50 pt-8">
                                <div className="lg:col-span-2 space-y-3">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 pl-1 border-l-2 border-blue-500">Route</label>
                                   <select className={`w-full p-4 border border-slate-100 rounded-xl outline-none text-xs font-bold appearance-none cursor-pointer transition-all ${p.isPaid ? 'bg-slate-50 cursor-not-allowed' : 'bg-slate-50/50 hover:bg-white'}`}
                                      value={p.route}
                                      disabled={p.isPaid}
                                      onChange={(e) => {
                                         const newP = [...formData.prescriptions];
                                         newP[idx].route = e.target.value;
                                         setFormData({...formData, prescriptions: newP});
                                      }}>
                                      {['Oral', 'IV', 'IM', 'Topical', 'Inhalation', 'Drops'].map(r => <option key={r} value={r}>{r}</option>)}
                                   </select>
                                </div>
                                <div className="lg:col-span-2 space-y-3">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 pl-1 border-l-2 border-indigo-500">Dosage</label>
                                   <input placeholder="Ex: 500mg" value={p.dosage} readOnly={p.isPaid}
                                      className={`w-full p-4 border border-slate-100 rounded-xl outline-none text-xs font-bold transition-all ${p.isPaid ? 'bg-slate-50 cursor-not-allowed' : 'bg-slate-50/50 focus:bg-white focus:border-indigo-400'}`}
                                      onChange={(e) => {
                                         const newP = [...formData.prescriptions];
                                         newP[idx].dosage = e.target.value;
                                         setFormData({...formData, prescriptions: newP});
                                      }}/>
                                </div>
                                <div className="lg:col-span-2 space-y-3">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 pl-1 border-l-2 border-emerald-500">Freq</label>
                                   <select className={`w-full p-4 border border-slate-100 rounded-xl outline-none text-xs font-bold appearance-none cursor-pointer transition-all ${p.isPaid ? 'bg-slate-50 cursor-not-allowed' : 'bg-slate-50/50 hover:bg-white'}`}
                                      value={p.frequency}
                                      disabled={p.isPaid}
                                      onChange={(e) => {
                                         const newP = [...formData.prescriptions];
                                         newP[idx].frequency = e.target.value;
                                         setFormData({...formData, prescriptions: newP});
                                      }}>
                                      {['1-0-1', '1-1-1', '0-0-1', '1-0-0', 'PRN', 'Stat'].map(f => <option key={f} value={f}>{f}</option>)}
                                   </select>
                                </div>
                                <div className="lg:col-span-2 space-y-3">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 pl-1 border-l-2 border-amber-500">Days</label>
                                   <input placeholder="Ex: 5" value={p.duration} readOnly={p.isPaid}
                                      className={`w-full p-4 border border-slate-100 rounded-xl outline-none text-xs font-bold transition-all ${p.isPaid ? 'bg-slate-50 cursor-not-allowed' : 'bg-slate-50/50 focus:bg-white focus:border-amber-400'}`}
                                      onChange={(e) => {
                                         const newP = [...formData.prescriptions];
                                         newP[idx].duration = e.target.value;
                                         setFormData({...formData, prescriptions: newP});
                                      }}/>
                                </div>
                                <div className="lg:col-span-3 space-y-3 relative">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 pl-1 border-l-2 border-slate-300">Instructions</label>
                                   <input placeholder="Ex: After meal" value={p.instructions || ""} readOnly={p.isPaid}
                                      className={`w-full p-4 border border-slate-100 rounded-xl outline-none text-xs font-bold transition-all ${p.isPaid ? 'bg-slate-50 cursor-not-allowed' : 'bg-slate-50/50 focus:bg-white'}`}
                                      onChange={(e) => {
                                         const newP = [...formData.prescriptions];
                                         newP[idx].instructions = e.target.value;
                                         setFormData({...formData, prescriptions: newP});
                                      }}/>
                                </div>
                                <div className="lg:col-span-1 flex justify-end pb-1.5">
                                   {!p.isPaid && (
                                     <button 
                                        onClick={() => setFormData({ ...formData, prescriptions: formData.prescriptions.filter((_, i) => i !== idx) })}
                                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                                     >
                                        <Trash2 className="h-5 w-5" />
                                     </button>
                                   )}
                                </div>
                             </div>
                          </div>
                       ))}
                        </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Laboratory Request Hub */}
            <div className="bg-white border border-slate-200 p-10 rounded-2xl space-y-8 shadow-sm">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                        <ActivityIcon className="h-8 w-8" />
                     </div>
                     <div>
                        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostics & Labs</h4>
                        <p className="text-sm text-slate-500 font-medium">Pathology, Radiology & Clinical Tests</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setFormData({ ...formData, labRequests: [...(formData.labRequests || []), { test: '', priority: 'routine', instructions: '' }] })}
                    className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    <Plus className="h-4 w-4" /> Request Test
                  </button>
               </div>

                <div className="w-full">
                   <div className="space-y-6">
                      {(formData.labRequests || []).map((r, idx) => (
                          <div key={idx} className={`bg-slate-50/50 hover:bg-white transition-all p-6 rounded-2xl border border-slate-100 group space-y-6 shadow-sm hover:shadow-md ${r.isPaid ? 'opacity-90' : ''}`}>
                             <div className="flex items-center gap-2 mb-2">
                                {r.isPaid && (
                                   <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-100 animate-in fade-in zoom-in duration-300">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Test Settled & Locked
                                   </span>
                                )}
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                                <div className="md:col-span-8 relative">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Select Investigation</label>
                                   <input 
                                      placeholder="Search test, radiology or pathology..." 
                                      value={r.test}
                                      readOnly={r.isPaid}
                                      autoComplete="off"
                                      onChange={(e) => {
                                         if (r.isPaid) return;
                                         const term = e.target.value;
                                         const newR = [...formData.labRequests];
                                         newR[idx].test = term;
                                         setFormData({...formData, labRequests: newR});
                                         handleSearchMaster('labs', term, idx, 'labs');
                                      }}
                                      onBlur={() => setTimeout(() => setSearchContext({type: null, index: null}), 300)}
                                      className={`bg-white border rounded-xl px-4 py-3 text-sm font-bold w-full outline-none shadow-sm transition-all ${r.isPaid ? 'bg-slate-50 border-transparent text-slate-500 cursor-not-allowed' : 'border-slate-200 focus:border-emerald-500'}`}
                                   />
                                   {searchContext.type === 'lab' && searchContext.index === idx && labSuggestions.length > 0 && !r.isPaid && (
                                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 z-[100] overflow-hidden max-h-[350px] overflow-y-auto">
                                         <div className="p-2 space-y-0.5">
                                            {labSuggestions.map((m) => (
                                               <button 
                                                  key={m.id}
                                                  onMouseDown={(e) => {
                                                     e.preventDefault();
                                                     const newR = [...formData.labRequests];
                                                     newR[idx].test = m.testName || m.name;
                                                     setFormData({...formData, labRequests: newR});
                                                     setLabSuggestions([]);
                                                     setSearchContext({type: null, index: null});
                                                  }}
                                                  className="w-full text-left px-5 py-5 hover:bg-emerald-50/30 transition-all rounded-2xl flex items-center justify-between group/item border border-transparent hover:border-emerald-100"
                                               >
                                                  <div className="flex items-center gap-5">
                                                     <div className="h-12 w-12 bg-slate-100/50 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-white group-hover/item:text-emerald-600 transition-all shadow-inner shrink-0">
                                                        <ActivityIcon className="h-6 w-6" />
                                                     </div>
                                                     <div className="flex flex-col gap-1 overflow-hidden">
                                                        <span className="text-base font-bold text-slate-900 truncate group-hover/item:text-emerald-900 transition-colors tracking-tight">
                                                           {m.testName || m.name}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                           <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                                           Investigation Profile
                                                        </span>
                                                     </div>
                                                  </div>
                                               </button>
                                            ))}
                                         </div>
                                      </div>
                                   )}
                                </div>
                                <div className="md:col-span-4">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Priority</label>
                                   <select 
                                      value={r.priority}
                                      disabled={r.isPaid}
                                      onChange={(e) => {
                                         const newR = [...formData.labRequests];
                                         newR[idx].priority = e.target.value;
                                         setFormData({...formData, labRequests: newR});
                                      }}
                                      className={`bg-white border rounded-xl px-4 py-3 text-xs font-bold w-full outline-none shadow-sm appearance-none cursor-pointer transition-colors ${r.isPaid ? 'bg-slate-50 border-transparent text-slate-500 cursor-not-allowed' : 'border-slate-200 focus:border-emerald-500 hover:bg-slate-50'}`}
                                   >
                                      <option value="routine">Routine</option>
                                      <option value="urgent">Urgent</option>
                                      <option value="stat">STAT</option>
                                   </select>
                                </div>
                             </div>

                             {/* Row 2: Instructions */}
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end border-t border-slate-100/50 pt-5">
                                <div className="md:col-span-11 relative">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Clinical Instructions</label>
                                   <textarea 
                                      placeholder="Reason for test or specific sample instructions..." 
                                      value={r.instructions}
                                      readOnly={r.isPaid}
                                      rows={1}
                                      onChange={(e) => {
                                         const newR = [...formData.labRequests];
                                         newR[idx].instructions = e.target.value;
                                         setFormData({...formData, labRequests: newR});
                                         e.target.style.height = 'auto';
                                         e.target.style.height = e.target.scrollHeight + 'px';
                                      }}
                                      className={`bg-white border rounded-xl px-4 py-3 text-xs font-medium w-full outline-none shadow-sm resize-none min-h-[44px] transition-all ${r.isPaid ? 'bg-slate-50 border-transparent text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-emerald-500'}`}
                                   />
                                </div>
                                <div className="md:col-span-1 flex justify-end pb-1.5">
                                   {!r.isPaid && (
                                     <button 
                                        onClick={() => setFormData({ ...formData, labRequests: formData.labRequests.filter((_, i) => i !== idx) })}
                                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                                     >
                                        <Trash2 className="h-5 w-5" />
                                     </button>
                                   )}
                                </div>
                             </div>
                          </div>
                       ))}
                   </div>
                </div>
            </div>

            {/* Specialized Modules - Sections */}
            <div className="space-y-10 pt-8">
               <div className="flex items-center gap-4 mb-2">
                  <div className="h-px flex-1 bg-slate-100" />
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">Clinical Templates & Extras</p>
                  <div className="h-px flex-1 bg-slate-100" />
               </div>

               {activeSpecialties.filter(id => id !== 'pharmacy_lab' && id !== 'general').length > 0 && (
                  <div className="space-y-8">
                     {activeSpecialties.filter(id => id !== 'pharmacy_lab' && id !== 'general').map(specId => {
                        const spec = SPECIALTIES.find(s => s.id === specId);
                        return (
                           <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={specId} 
                              className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm"
                           >
                              <div className="flex items-center justify-between mb-10">
                                 <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-slate-50 text-primary-600 rounded-xl flex items-center justify-center border border-slate-100 shadow-inner">
                                       {spec?.icon ? React.createElement(spec.icon, { className: 'h-8 w-8' }) : <Stethoscope className="h-8 w-8" />}
                                    </div>
                                    <div>
                                       <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{spec?.name || 'Unknown'} Module</h4>
                                       <p className="text-sm text-slate-500 font-medium">Specialized examination findings</p>
                                    </div>
                                 </div>
                                 <button onClick={() => toggleSpecialty(specId)} className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm">
                                    <X className="h-5 w-5" />
                                 </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                 {/* (Individual Fields kept here - just cleaned up UI styles) */}
                                 {specId === 'dental' && (
                                    <>
                                       <div className="space-y-3">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Tooth Number (1-32)</label>
                                          <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2x outline-none text-sm font-bold shadow-inner"
                                             onChange={(e) => updateSpecialtyField('tooth', e.target.value)}>
                                             <option value="">Select</option>
                                             {Array.from({length: 32}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                                          </select>
                                       </div>
                                       <div className="space-y-3 col-span-2">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Surfaces</label>
                                          <div className="flex gap-3">
                                             {['O', 'M', 'D', 'L', 'B'].map(s => (
                                             <button 
                                                key={s} 
                                                onClick={() => toggleSurface(s)}
                                                className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center font-bold text-xs transition-all
                                                   ${(formData.specialtyData.surfaces || '').split(',').includes(s)
                                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100'
                                                      : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-blue-600'}
                                                `}>{s}</button>
                                             ))}
                                          </div>
                                       </div>
                                    </>
                                 )}

                                 {/* Other specialty field blocks follow same principle - using the Field component with premium styles */}
                                 {specId === 'obgyn' && (
                                    <>
                                       <Field label="LMP" field="cn_lmp" value={formData.specialtyData.cn_lmp} onChange={updateSpecialtyField} type="date" />
                                       <Field label="EDD" field="cn_edd" value={formData.specialtyData.cn_edd} onChange={updateSpecialtyField} type="date" />
                                       <Field label="Gravida" field="cn_gravida" value={formData.specialtyData.cn_gravida} onChange={updateSpecialtyField} />
                                       <Field label="FHR" field="cn_fhr" value={formData.specialtyData.cn_fhr} onChange={updateSpecialtyField} />
                                       <div className="col-span-full">
                                          <Field label="Exam Notes" field="cn_exam_notes" value={formData.specialtyData.cn_exam_notes} onChange={updateSpecialtyField} isTextArea />
                                       </div>
                                    </>
                                 )}
                                 
                                 {specId === 'pediatrics' && (
                                    <>
                                       <Field label="Weight (kg)" field="cn_weight" value={formData.specialtyData.cn_weight} onChange={updateSpecialtyField} />
                                       <Field label="Height (cm)" field="cn_height" value={formData.specialtyData.cn_height} onChange={updateSpecialtyField} />
                                       <Field label="Percentile (W)" field="cn_percentile_wt" value={formData.specialtyData.cn_percentile_wt} onChange={updateSpecialtyField} />
                                       <Field label="Growth Comments" field="cn_notesgrowthcoment" value={formData.specialtyData.cn_notesgrowthcoment} onChange={updateSpecialtyField} isTextArea />
                                    </>
                                 )}

                                 {specId === 'internal_med' && (
                                    <>
                                       <Field label="BP Target" field="med_bp" value={formData.specialtyData.med_bp} onChange={updateSpecialtyField} />
                                       <Field label="HbA1c" field="med_latest" value={formData.specialtyData.med_latest} onChange={updateSpecialtyField} />
                                       <div className="col-span-full">
                                          <Field label="Medication Adjustments" field="med_planadjust" value={formData.specialtyData.med_planadjust} onChange={updateSpecialtyField} isTextArea />
                                       </div>
                                    </>
                                 )}

                                 {specId === 'surgery' && (
                                    <>
                                       <Field label="Target Procedure" field="sur_pro" value={formData.specialtyData.sur_pro} onChange={updateSpecialtyField} />
                                       <Field label="Surgeon Name" field="sur_surgeon" value={formData.specialtyData.sur_surgeon} onChange={updateSpecialtyField} />
                                       <Field label="Pre-op Diagnosis" field="sur_preop" value={formData.specialtyData.sur_preop} onChange={updateSpecialtyField} />
                                       <div className="col-span-full">
                                          <Field label="Operative Notes" field="sur_notes" value={formData.specialtyData.sur_notes} onChange={updateSpecialtyField} isTextArea />
                                       </div>
                                    </>
                                 )}

                                 {specId === 'ent' && (
                                    <>
                                       <Field label="Ear Findings" field="ent_ear" value={formData.specialtyData.ent_ear} onChange={updateSpecialtyField} />
                                       <Field label="Nose/Sinus" field="ent_nose" value={formData.specialtyData.ent_nose} onChange={updateSpecialtyField} />
                                       <Field label="Throat/Larynx" field="ent_throat" value={formData.specialtyData.ent_throat} onChange={updateSpecialtyField} />
                                    </>
                                 )}

                                 {specId === 'dermatology' && (
                                    <>
                                       <Field label="Lesion Type" field="derm_lesion" value={formData.specialtyData.derm_lesion} onChange={updateSpecialtyField} />
                                       <Field label="Body Location" field="derm_loc" value={formData.specialtyData.derm_loc} onChange={updateSpecialtyField} />
                                       <Field label="Characteristics" field="derm_char" value={formData.specialtyData.derm_char} onChange={updateSpecialtyField} />
                                       <div className="col-span-full">
                                          <Field label="Dermatology Summary" field="derm_notes" value={formData.specialtyData.derm_notes} onChange={updateSpecialtyField} isTextArea />
                                       </div>
                                    </>
                                 )}

                                 {specId === 'radiology' && (
                                    <>
                                       <Field label="Imaging Modality" field="rad_modality" value={formData.specialtyData.rad_modality} onChange={updateSpecialtyField} />
                                       <Field label="Clinical Indication" field="rad_indication" value={formData.specialtyData.rad_indication} onChange={updateSpecialtyField} />
                                       <div className="col-span-full">
                                          <Field label="Radiological Findings" field="rad_findings" value={formData.specialtyData.rad_findings} onChange={updateSpecialtyField} isTextArea />
                                       </div>
                                    </>
                                 )}

                                 {specId === 'ophthalmology' && (
                                    <>
                                       <div className="grid grid-cols-2 gap-4 col-span-1">
                                          <Field label="VA (OD)" field="eye_va_od" value={formData.specialtyData.eye_va_od} onChange={updateSpecialtyField} />
                                          <Field label="VA (OS)" field="eye_va_os" value={formData.specialtyData.eye_va_os} onChange={updateSpecialtyField} />
                                       </div>
                                       <Field label="IOP (mmHg)" field="eye_iop" value={formData.specialtyData.eye_iop} onChange={updateSpecialtyField} />
                                       <div className="col-span-full">
                                          <Field label="Fundoscopy" field="eye_fundus" value={formData.specialtyData.eye_fundus} onChange={updateSpecialtyField} isTextArea />
                                       </div>
                                    </>
                                 )}

                                 {specId === 'orthopedics' && (
                                    <>
                                       <Field label="Joint Involved" field="orth_joint" value={formData.specialtyData.orth_joint} onChange={updateSpecialtyField} />
                                       <Field label="ROM" field="orth_rom" value={formData.specialtyData.orth_rom} onChange={updateSpecialtyField} />
                                       <Field label="Muscle Power" field="orth_power" value={formData.specialtyData.orth_power} onChange={updateSpecialtyField} />
                                    </>
                                 )}

                                 {specId === 'psychiatry' && (
                                    <>
                                       <Field label="MSE Summary" field="psych_mse" value={formData.specialtyData.psych_mse} onChange={updateSpecialtyField} />
                                       <Field label="Mood/Affect" field="psych_mood" value={formData.specialtyData.psych_mood} onChange={updateSpecialtyField} />
                                       <Field label="Thought Content" field="psych_thought" value={formData.specialtyData.psych_thought} onChange={updateSpecialtyField} />
                                    </>
                                 )}

                                 {specId === 'physiotherapy' && (
                                    <>
                                       <Field label="Strength Grade" field="physio_grade" value={formData.specialtyData.physio_grade} onChange={updateSpecialtyField} />
                                       <Field label="Gait/Balance" field="physio_gait" value={formData.specialtyData.physio_gait} onChange={updateSpecialtyField} />
                                       <div className="col-span-full">
                                          <Field label="Rehab Progress" field="physio_prog" value={formData.specialtyData.physio_prog} onChange={updateSpecialtyField} isTextArea />
                                       </div>
                                    </>
                                 )}
                              </div>
                           </motion.div>
                        );
                     })}
                  </div>
               )}
            </div>
          </div>

          {/* History Sidebar (Right Side) */}
          <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-96 bg-slate-50 border-l border-slate-200 overflow-y-auto p-8 shadow-2xl z-20"
              >
                 <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                       <History className="h-4 w-4 text-primary-500" /> Medical Archive
                    </h4>
                 </div>
                 
                 {loadingHistory ? (
                    <div className="py-20 text-center">
                       <RefreshCw className="h-8 w-8 text-primary-200 animate-spin mx-auto mb-4" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning Records...</p>
                    </div>
                 ) : patientHistory.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-xl border border-slate-100 shadow-sm">
                       <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-slate-200" />
                       </div>
                       <p className="text-sm font-bold text-slate-900 mb-1">No Clinical History</p>
                       <p className="text-[10px] font-medium text-slate-400 px-6">This appears to be a new case for this facility.</p>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       {patientHistory.map((h) => (
                          <motion.div 
                            key={h.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-xl hover:shadow-slate-200 transition-all group cursor-pointer relative"
                            onClick={() => setViewingNote(h)}
                          >
                             <div className="flex justify-between items-start mb-4">
                                <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-[8px] font-bold uppercase tracking-widest border border-primary-100">
                                   {h.specialty || (h.specialties ? h.specialties[0] : 'General')}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                   {h.createdAt?.seconds ? new Date(h.createdAt.seconds * 1000).toLocaleDateString() : 'Historical'}
                                </span>
                             </div>
                             <h5 className="text-sm font-bold text-slate-900 mb-2 truncate group-hover:text-primary-600 transition-colors">{h.title || 'Consultation'}</h5>
                             <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed font-medium">
                                {h.assessment || h.subjective || 'No summary available.'}
                             </p>
                             
                             {h.diagnosis && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                                   <p className="text-[10px] font-bold text-slate-800 truncate uppercase">{h.diagnosis}</p>
                                </div>
                             )}

                             <div className="mt-6 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                   <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                      {h.doctorName?.charAt(0) || 'D'}
                                   </div>
                                   {h.doctorName}
                                </span>
                                <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-primary-500 transition-colors" />
                             </div>
                          </motion.div>
                       ))}
                    </div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Automatic Routing Implementation - Modal Removed */}
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
          className="w-full p-4 bg-white border border-slate-300 rounded-2xl outline-none text-sm font-medium focus:border-primary-500 transition-all resize-none shadow-sm"
        />
      ) : (
        <input 
          type={type}
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 bg-white border border-slate-300 rounded-2xl outline-none text-sm font-medium focus:border-primary-500 transition-all shadow-sm"
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
        className="w-full p-6 bg-white border border-slate-300 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 rounded-2xl text-sm font-medium transition-all outline-none min-h-[160px] shadow-sm"
        placeholder={`Document ${label.toLowerCase()} details...`}
      />
    </div>
  );
}
function NoteViewer({ note, onClose, onEdit }) {
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
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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
            <div className="p-6 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Doctor</p>
              <p className="text-sm font-bold text-slate-900">{note.doctorName}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Specialty</p>
              <p className="text-sm font-bold text-slate-900 capitalize">{note.specialties?.join(', ') || note.specialty || 'General'}</p>
            </div>
            {note.diagnosis && (
              <div className="p-6 bg-slate-900 text-white rounded-2xl col-span-2 shadow-xl shadow-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 italic">Diagnosis (ICD-10)</p>
                <p className="text-sm font-bold">{note.diagnosis}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
             {note.vitals && Object.values(note.vitals).some(v => v) && (
               <div className="col-span-full bg-slate-50 p-8 rounded-2xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
                 {Object.entries(note.vitals).filter(([_, v]) => v).map(([key, value]) => (
                   <div key={key} className="text-center md:text-left">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key.replace('_', ' ')}</p>
                      <p className="text-sm font-bold text-slate-900">{value}</p>
                   </div>
                 ))}
               </div>
             )}

            <ViewerBox label="Subjective" icon="S" content={note.subjective} />
            <ViewerBox label="Objective" icon="O" content={note.objective} />
            <ViewerBox label="Assessment" icon="A" content={note.assessment} />
            <ViewerBox label="Plan" icon="P" content={note.plan} />
            
            {note.prescriptions?.length > 0 && (
               <div className="col-span-full space-y-4">
                  <div className="flex items-center gap-3 px-2">
                     <div className="h-6 w-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-medium">Rx</div>
                     <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Prescribed Medications</h5>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                     <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                           <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] text-left">
                              <th className="px-6 py-4">Medicine</th>
                              <th className="px-6 py-4">Dose</th>
                              <th className="px-6 py-4">Frequency</th>
                              <th className="px-6 py-4">Duration</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium text-xs text-slate-600">
                           {note.prescriptions.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-6 py-4 font-bold text-slate-900">{p.medicine} <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded uppercase ml-2">{p.route}</span></td>
                                 <td className="px-6 py-4">{p.dosage}</td>
                                 <td className="px-6 py-4">{p.frequency}</td>
                                 <td className="px-6 py-4">{p.duration}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {note.labRequests?.length > 0 && (
               <div className="col-span-full space-y-4">
                  <div className="flex items-center gap-3 px-2">
                     <div className="h-6 w-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-[10px] font-medium">Lx</div>
                     <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Laboratory Investigations</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {note.labRequests.map((l, idx) => (
                        <div key={idx} className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center group">
                           <div>
                               <p className="text-sm font-bold text-slate-900">{l?.test || 'Unspecified Test'}</p>
                               <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest mt-1">
                                 {l?.priority || l?.urgency || 'Routine'} • {l?.instructions || 'No specific instruction'}
                               </p>
                            </div>
                           <ActivityIcon className="h-5 w-5 text-emerald-200 group-hover:text-emerald-500 transition-colors" />
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {note.nursingOrders && (
               <div className="col-span-1 md:col-span-2">
                  <ViewerBox label="Nursing Orders" icon="N" content={note.nursingOrders} />
               </div>
            )}
          </div>

          {note.specialtyData && Object.keys(note.specialtyData).length > 0 && (
            <div className="space-y-6">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest px-2">Examination Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(note.specialtyData).map(([key, value]) => (
                  <div key={key} className="p-6 bg-primary-50/30 rounded-xl border border-primary-50">
                    <p className="text-[10px] font-medium text-primary-400 uppercase tracking-widest mb-1">{key.replace('cn_', '').replace('med_', '').replace('_', ' ')}</p>
                    <p className="text-sm font-medium text-slate-700">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          {note.status === 'draft' && (
             <button 
                onClick={() => onEdit(note.id)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
             >
                Edit Script
             </button>
          )}
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
      <div className="p-6 bg-white border border-slate-100 rounded-2xl text-sm text-slate-600 leading-relaxed min-h-[100px] whitespace-pre-wrap font-medium">
        {content}
      </div>
    </div>
  );
}
