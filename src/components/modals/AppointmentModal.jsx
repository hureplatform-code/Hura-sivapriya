import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Stethoscope, 
  AlertCircle,
  Search,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import QuickPatientModal from './QuickPatientModal';
import patientService from '../../services/patientService';
import userService from '../../services/userService';
import facilityService from '../../services/facilityService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import appointmentService from '../../services/appointmentService';

export default function AppointmentModal({ isOpen, onClose, onSave, initialDate }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { userData } = useAuth();
  const { error: toastError } = useToast();
  const [isQuickPatientOpen, setIsQuickPatientOpen] = useState(false);
  
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [facilityProfile, setFacilityProfile] = useState(null);
  const [lastVisitMap, setLastVisitMap] = useState({});

  const formatLastVisitRelative = (lastDate) => {
    if (!lastDate) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const visitDate = new Date(lastDate);
    visitDate.setHours(0,0,0,0);
    
    const diffTime = today - visitDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Visited today";
    if (diffDays === 1) return "Visited yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 60) return "Last month";
    return `Last visit: ${lastDate}`;
  };

  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    provider: '',
    type: 'Consultation',
    date: initialDate || (() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    })(),
    time: '09:00',
    notes: '',
    priority: 'Normal',
    consultationFee: 1000
  });

  useEffect(() => {
    if (isOpen && userData?.facilityId) {
      // Reset form on open
      setSearchQuery('');
      setSelectedPatient(null);
      setShowResults(false);
      
      const loadInitialData = async () => {
        try {
          const profileData = await facilityService.getProfile(userData.facilityId);
          if (profileData) setFacilityProfile(profileData);
          
          setFormData(prev => ({
            ...prev,
            patientId: '',
            patientName: '',
            provider: doctors[0]?.name || '', 
            type: 'Consultation',
            date: initialDate || (() => {
              const now = new Date();
              const y = now.getFullYear();
              const m = String(now.getMonth() + 1).padStart(2, '0');
              const d = String(now.getDate()).padStart(2, '0');
              return `${y}-${m}-${d}`;
            })(),
            time: (() => {
              const now = new Date();
              const h = String(now.getHours()).padStart(2, '0');
              const m = String(now.getMinutes()).padStart(2, '0');
              return `${h}:${m}`;
            })(),
            notes: '',
            priority: 'Normal',
            consultationFee: profileData?.consultationFee || 1000
          }));
        } catch (err) {
          console.error("Error loading profile:", err);
        }
      };

      loadInitialData();
      fetchPatients();
      fetchDoctors();
    }
  }, [isOpen, initialDate, userData?.facilityId]);

  // Handle doctor selection once list is loaded
  useEffect(() => {
    if (doctors.length > 0 && !formData.provider) {
       setFormData(prev => ({ ...prev, provider: doctors[0].name }));
    }
  }, [doctors]);

  const fetchDoctors = async () => {
    try {
      const data = await userService.getAllUsers(userData?.facilityId);
      // Include only formal Doctors
      const docs = data.filter(u => u.role === 'doctor');
      setDoctors(docs);
      
      // Auto-select first matching provider if form is empty
      if (docs.length > 0 && !formData.provider) {
        setFormData(prev => ({ ...prev, provider: docs[0].name }));
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchPatients = async () => {
    if (!userData?.facilityId) return;
    try {
      // Fetch both simultaneously but handle failure individually
      const [patientData, recentAppts] = await Promise.allSettled([
        patientService.getAllPatients(userData.facilityId),
        appointmentService.getAppointmentsByFacility(userData.facilityId, 500)
      ]);
      
      const pData = patientData.status === 'fulfilled' ? (patientData.value || []) : [];
      const aData = recentAppts.status === 'fulfilled' ? (recentAppts.value || []) : [];
      
      setPatients(pData);
      
      const vMap = {};
      if (aData.length > 0) {
        aData.forEach(a => {
          if (!vMap[a.patientId]) {
            vMap[a.patientId] = a.date;
          }
        });
      }
      setLastVisitMap(vMap);
    } catch (error) {
      console.error("Error fetching patient context:", error);
    }
  };

  const filteredPatients = patients.filter(p => {
    const queryLower = searchQuery.toLowerCase();
    const queryDigits = searchQuery.replace(/[^0-9]/g, '');
    const queryNoZero = queryDigits.startsWith('0') ? queryDigits.substring(1) : queryDigits;

    const mobileDigits = (p.mobile || '').replace(/[^0-9]/g, '');
    const contactDigits = (p.contact || '').replace(/[^0-9]/g, '');
    const idLower = (p.id || '').toLowerCase();

    const nameMatch = p.name?.toLowerCase().includes(queryLower);
    const idMatch = idLower.includes(queryLower.replace(/[^a-z0-9]/g, ''));
    const phoneMatch = (queryDigits && (mobileDigits.includes(queryDigits) || contactDigits.includes(queryDigits))) ||
                      (queryNoZero && (mobileDigits.includes(queryNoZero) || contactDigits.includes(queryNoZero)));

    return nameMatch || idMatch || phoneMatch;
  }).slice(0, 5);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.name);
    setFormData(prev => ({ 
      ...prev, 
      patientId: patient.id, 
      patientName: patient.name 
    }));
    setShowResults(false);
  };

  const handleQuickPatientSave = (newPatient) => {
    setPatients(prev => [newPatient, ...prev]);
    handleSelectPatient(newPatient);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toastError("Please select a valid patient first.");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const isSameDay = formData.date === todayString;

      const sanitizedPhone = (selectedPatient.mobile || '').replace(/[\s\-\(\)]/g, '');
      const appointmentData = {
        ...formData,
        facilityId: userData?.facilityId,
        patient: selectedPatient.name,
        patientId: selectedPatient.id,
        patientPhone: sanitizedPhone,
        status: 'scheduled',
        bookingType: isSameDay ? 'SD' : 'ADV',
        createdAt: new Date().toISOString(),
        consultationFee: parseFloat(formData.consultationFee) // Ensure it's a number
      };
      
      if (onSave) {
        await onSave(appointmentData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error booking appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white"
            >
              {success ? (
                <div className="p-12 text-center flex flex-col items-center gap-4">
                  <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">Appointment Booked!</h3>
                  <p className="text-slate-500 font-medium">The patient will receive a confirmation shortly.</p>
                </div>
              ) : (
                <>
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Schedule Patient</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Book a new consultation or follow-up session.</p>
                    </div>
                    <button 
                      onClick={onClose}
                      className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="flex items-center justify-between ml-1 mb-2">
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Patient Search</label>
                          <button 
                            type="button"
                            onClick={() => setIsQuickPatientOpen(true)}
                            className="text-[10px] font-medium text-primary-600 uppercase tracking-widest hover:text-primary-700 flex items-center gap-1"
                          >
                            <UserPlus className="h-3 w-3" />
                            New Patient
                          </button>
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                          </div>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowResults(true);
                              setSelectedPatient(null);
                            }}
                            onFocus={() => setShowResults(true)}
                            required
                            className="block w-full pl-14 pr-6 py-4.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:ring-0 focus:border-primary-500 rounded-[1.5rem] transition-all duration-300 text-slate-900 placeholder-slate-400 text-sm font-medium shadow-inner"
                            placeholder="Search by Name, Phone, or OP Number (ID)..."
                          />
                        </div>

                        <AnimatePresence>
                          {showResults && searchQuery.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden"
                            >
                              {filteredPatients.length > 0 ? (
                                filteredPatients.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelectPatient(p)}
                                    className="w-full text-left px-6 py-4 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-900 text-sm flex items-center gap-2">
                                        {p.name}
                                        {lastVisitMap[p.id] && (
                                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase rounded-md border border-indigo-100">
                                            Returning
                                          </span>
                                        )}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-slate-400 font-medium">{p.mobile || p.id}</p>
                                        {lastVisitMap[p.id] && (
                                          <>
                                            <span className="h-1 w-1 bg-slate-300 rounded-full" />
                                            <p className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider">
                                              {formatLastVisitRelative(lastVisitMap[p.id])}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-6 py-8 text-center bg-slate-50/30">
                                  <p className="text-sm text-slate-500 font-medium">No patient found with that name.</p>
                                  <button 
                                    type="button"
                                    onClick={() => setIsQuickPatientOpen(true)}
                                    className="mt-3 text-xs font-medium text-primary-600 uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all"
                                  >
                                    Quick Register "{searchQuery}"
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1 block">Consulting Doctor</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                              <Stethoscope className="h-5 w-5" />
                            </div>
                            <select 
                              value={formData.provider}
                              onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                              className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none appearance-none transition-all"
                            >
                              <option value="">Select Doctor...</option>
                              {doctors.map(doc => (
                                <option key={doc.id} value={doc.name}>{doc.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1 block">Appointment Type</label>
                          <select 
                             value={formData.type}
                             onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                             className="block w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none appearance-none transition-all"
                          >
                            <option>Consultation</option>
                            <option>Laboratory</option>
                            <option>Follow-up</option>
                            <option>Emergency</option>
                            <option>Specialist Review</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1 block">Appointment Date</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                              <CalendarIcon className="h-5 w-5" />
                            </div>
                            <input 
                              type="date" 
                              value={formData.date}
                              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                              className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none transition-all" 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1 block">Prefered Time Slot</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                              <Clock className="h-5 w-5" />
                            </div>
                            <input 
                              type="time" 
                              value={formData.time}
                              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                              className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none transition-all" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1 block">Consultation Fee ({userData?.currency || 'KSH'})</label>
                          <input 
                            type="number" 
                            value={formData.consultationFee}
                            onChange={(e) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-bold shadow-inner outline-none transition-all" 
                            placeholder="Enter fee amount..." 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1 block">Notes / Reason for visit</label>
                          <textarea 
                            rows="1" 
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-sm font-medium outline-none transition-all resize-none shadow-inner" 
                            placeholder="Reason for visit..." 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-8 py-5 bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !selectedPatient}
                        className="flex-[2] px-8 py-5 bg-primary-600 text-white font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary-200 disabled:opacity-70 flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            Confirm Appointment
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <QuickPatientModal 
        isOpen={isQuickPatientOpen}
        onClose={() => setIsQuickPatientOpen(false)}
        onSave={handleQuickPatientSave}
      />
    </>
  );
}
