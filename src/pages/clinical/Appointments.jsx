import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
// ... rest of imports ...
import { 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  User, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Thermometer,
  Heart,
  Activity,
  Zap,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentModal from '../../components/modals/AppointmentModal';
import appointmentService from '../../services/appointmentService';
import AppointmentSummaryModal from '../../components/modals/AppointmentSummaryModal';
import medicalRecordService from '../../services/medicalRecordService';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function Appointments() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [triageApt, setTriageApt] = useState(null);
  const { userData } = useAuth();
  const [activeMenu, setActiveMenu] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const { success, warning, error: toastError } = useToast();
  const { confirm } = useConfirm();

  if (userData?.role === 'superadmin') {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="h-20 w-20 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 mb-6 shadow-inner">
              <CalendarIcon className="h-10 w-10" />
           </div>
           <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Access Restricted</h2>
           <p className="text-slate-500 max-w-md mt-2 font-medium">
             Individual clinic appointment schedules are managed by facility staff. Platform governance access is restricted to adoption and resource utilization metrics.
           </p>
           <button 
             onClick={() => navigate('/')}
             className="mt-8 px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
           >
             Return to Platform Dashboard
           </button>
        </div>
      </DashboardLayout>
    );
  }
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const fetchAppointments = async () => {
    if (!userData?.facilityId && userData?.role !== 'superadmin') return;
    try {
      setLoading(true);
      const data = await appointmentService.getAllAppointments(userData?.facilityId);
      const sortedData = (data || []).sort((a, b) => {
        const dateA = a.date || a.app_date || '';
        const dateB = b.date || b.app_date || '';
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return dateB.localeCompare(dateA) || timeB.localeCompare(timeA);
      });
      setAppointments(sortedData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchAppointments();
    }
  }, [userData]);

  const handleSaveAppointment = async (data) => {
    try {
      const newAppointment = await appointmentService.bookAppointment(data);
      setAppointments(prev => [newAppointment, ...prev]);
      success('Appointment booked successfully!');
    } catch (error) {
      console.error("Error booking appointment, adding with mock ID:", error);
      setAppointments(prev => [{ ...data, id: Date.now().toString(), status: 'scheduled' }, ...prev]);
      warning('Offline booking created.');
    }
    setIsModalOpen(false);
  };

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    noShows: appointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length
  };

  const handleStatusUpdate = async (id, status, message) => {
    try {
      await appointmentService.updateAppointmentStatus(id, status);
      fetchAppointments();
      success(message);
    } catch (error) {
      console.error(`Error updating status to ${status}:`, error);
    }
  };

  const handleConfirmationUpdate = async (id, currentStatus) => {
    // Cycle through: NC (Not Confirmed) -> LM (Left Message) -> C (Confirmed) -> NC
    const nextStatusMap = { 'NC': 'LM', 'LM': 'C', 'C': 'NC' };
    const nextStatus = nextStatusMap[currentStatus || 'NC'] || 'NC';
    try {
      // In a real app we would log the staff id/time for audit here.
      await appointmentService.updateAppointment(id, { confirmationStatus: nextStatus });
      fetchAppointments();
      success(`Confirmation status updated to ${nextStatus}.`);
    } catch (error) {
      console.error('Error updating confirmation:', error);
    }
  };

  const handleCancelAppointment = async (id) => {
    const isConfirmed = await confirm({
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment?',
      confirmText: 'Cancel Appointment',
      cancelText: 'Keep Appointment',
      isDestructive: true
    });
    
    if (isConfirmed) {
      try {
        await appointmentService.updateAppointment(id, { status: 'cancelled' });
        fetchAppointments();
        success('Appointment cancelled successfully.');
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        toastError('Failed to cancel appointment.');
      }
    }
  };

  const handleDeleteAppointment = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Appointment',
      message: 'Are you sure you want to permanently delete this appointment? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      isDestructive: true
    });
    
    if (isConfirmed) {
      try {
        await appointmentService.deleteAppointment(id);
        fetchAppointments();
        success('Appointment deleted successfully.');
      } catch (error) {
        console.error('Error deleting appointment:', error);
        toastError('Failed to delete appointment.');
      }
    }
  };

  const handleEditAppointment = (apt) => {
    setSelectedApt(apt);
    setIsModalOpen(true);
  };

  const handlePerformTriage = (apt) => {
    setTriageApt(apt);
    setIsTriageOpen(true);
  };

  const handleSaveTriage = async (vitals) => {
    try {
      // 1. Update Appointment Status
      await appointmentService.updateAppointmentStatus(triageApt.id, 'triage');
      
      // 2. Save Vitals to Medical Records (Type: triage)
      await medicalRecordService.createRecord({
        patientId: triageApt.patientId,
        patientName: triageApt.patient,
        appointmentId: triageApt.id,
        doctorName: userData?.name || 'Nurse',
        type: 'triage',
        specialty: 'general',
        title: 'Triage Assessment',
        status: 'signed',
        vitals
      }, { id: userData?.uid, name: userData?.name });

      fetchAppointments();
      setIsTriageOpen(false);
      success('Triage data recorded and patient queued for doctor.');
    } catch (error) {
      console.error('Error saving triage:', error);
      toastError('Failed to save triage data.');
    }
  };

  const handleStartConsultation = (apt) => {
    handleStatusUpdate(apt.id, 'in-session', 'Session Started.');
    navigate('/notes', { 
      state: { 
        autoCreate: true,
        patientId: apt.patientId || '',
        patientName: apt.patient,
        appointmentId: apt.id
      } 
    });
  };

  const handleViewSummary = (apt) => {
    setSelectedApt(apt);
    setIsSummaryOpen(true);
  };

  // Calendar Helpers
  const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Fill leading empty days
    const firstDay = date.getDay();
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const filteredAppointments = appointments
    .filter(apt => {
      const matchesSearch = apt.patient?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || apt.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesSpecialty = specialtyFilter === 'All' || apt.type?.toLowerCase() === specialtyFilter.toLowerCase();
      // Support both new "date" and legacy "app_date"
      const aptDate = apt.date || apt.app_date;
      const matchesDate = aptDate === selectedDate;
      return matchesSearch && matchesStatus && matchesSpecialty && matchesDate;
    })
    .sort((a, b) => {
      // Prioritize Arrived/Triage/In-Session status first
      const priority = { 'in-session': 1, 'triage': 2, 'arrived': 3, 'scheduled': 4, 'completed': 5, 'cancelled': 6 };
      return (priority[a.status?.toLowerCase()] || 99) - (priority[b.status?.toLowerCase()] || 99);
    });

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Appointments</h1>
            <p className="text-slate-500 mt-1">Manage patient bookings, scheduling, and clinical arrivals.</p>
          </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
            >
            <Plus className="h-5 w-5" />
            Book Appointment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-900">{monthName} {year}</h3>
                <div className="flex gap-1">
                  <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg"><ChevronLeft className="h-4 w-4 text-slate-400" /></button>
                  <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 rounded-lg"><ChevronRight className="h-4 w-4 text-slate-400" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} className="h-8 w-8" />;
                  
                  const dateStr = formatDate(date);
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === formatDate(new Date());
                  
                  return (
                    <button 
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-8 w-8 text-xs font-medium rounded-xl flex items-center justify-center transition-all
                        ${isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 
                          isToday ? 'bg-primary-50 text-primary-600' : 'hover:bg-slate-50 text-slate-600'}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative group">
              <div className="relative z-10">
                <h4 className="font-medium text-lg mb-2 text-left">Daily Summary</h4>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-sm text-slate-400 font-medium">Total Booked</span>
                    <span className="font-medium text-emerald-400">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-sm text-slate-400 font-medium">Completed</span>
                    <span className="font-medium text-blue-400">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-sm text-slate-400 font-medium">No Shows</span>
                    <span className="font-medium text-red-400">{stats.noShows}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all duration-700" />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none text-slate-600 font-medium appearance-none min-w-[140px]"
                >
                  <option value="All">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Arrived">Arrived (Checked In)</option>
                  <option value="Triage">Triage</option>
                  <option value="In-Session">In Session</option>
                  <option value="Completed">Completed</option>
                </select>
                <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                  <Filter className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-50">
                  <div className="h-8 w-8 border-2 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-medium text-xs uppercase tracking-widest text-slate-400">Loading appointments...</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-50">
                   <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <CalendarIcon className="h-8 w-8" />
                   </div>
                   <p className="font-medium text-xs uppercase tracking-widest text-slate-400">No appointments for {new Date(selectedDate).toLocaleDateString()}.</p>
                </div>
              ) : (
                filteredAppointments.map((apt, i) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:border-primary-200 transition-colors">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{(apt.time || '00:00').split(':')[0]}</span>
                        <span className="text-lg font-semibold text-slate-900 leading-none">{(apt.time || '00:00').split(':')[1]}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-slate-900 flex items-center gap-2">
                          {apt.patient}
                          <span className={`h-2 w-2 rounded-full ${apt.priority === 'High' ? 'bg-red-500 animate-pulse' : apt.priority === 'Normal' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          
                          {/* Booking Type Badge */}
                          <span className={`px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-widest ${apt.bookingType === 'SD' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                             {apt.bookingType || 'ADV'}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <User className="h-3.5 w-3.5" />
                          {apt.provider || apt.doctor} • <span className="text-slate-400">{apt.type}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-col items-end">
                        <button
                          onClick={() => handleConfirmationUpdate(apt.id, apt.confirmationStatus)}
                          title="Click to toggle confirmation status (NC -> LM -> C)"
                          className={`px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1 transition-all cursor-pointer border ${apt.confirmationStatus === 'C' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : apt.confirmationStatus === 'LM' ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                        >
                           {apt.confirmationStatus === 'C' ? 'C' : apt.confirmationStatus === 'LM' ? 'LM' : 'NC'}
                        </button>

                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest flex items-center gap-2
                          ${apt.status === 'arrived' ? 'bg-indigo-50 text-indigo-600' : 
                            apt.status === 'triage' ? 'bg-blue-50 text-blue-600' :
                            apt.status === 'in-session' ? 'bg-emerald-50 text-emerald-600' :
                            apt.status === 'completed' ? 'bg-purple-50 text-purple-600' : 
                            apt.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                            'bg-amber-50 text-amber-600'}
                        `}>
                          {apt.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : 
                           apt.status === 'cancelled' ? <XCircle className="h-3 w-3" /> : 
                           <Clock className="h-3 w-3" />}
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {apt.status === 'scheduled' && (
                          <button 
                            onClick={() => handleStatusUpdate(apt.id, 'arrived', 'Patient Checked In.')}
                            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-all active:scale-95"
                          >
                            CHECK IN
                          </button>
                        )}
                        
                        {apt.status === 'arrived' && ['nurse', 'doctor', 'clinic_owner'].includes(userData?.role) && (
                          <button 
                            onClick={() => handlePerformTriage(apt)}
                            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 active:scale-95"
                          >
                            PERFORM TRIAGE
                          </button>
                        )}

                        {(apt.status === 'triage' || apt.status === 'arrived') && ['doctor', 'clinic_owner'].includes(userData?.role) && (
                          <button 
                            onClick={() => handleStartConsultation(apt)}
                            className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50 active:scale-95"
                          >
                            START SESSION
                          </button>
                        )}

                        {apt.status === 'in-session' && ['doctor', 'clinic_owner'].includes(userData?.role) && (
                           <button 
                             onClick={() => handleStatusUpdate(apt.id, 'completed', 'Patient Discharged.')}
                             className="px-5 py-2.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-50 active:scale-95"
                           >
                             DISCHARGE
                           </button>
                        )}

                        {['completed', 'cancelled'].includes(apt.status) && (
                          <button 
                            onClick={() => handleViewSummary(apt)}
                            className="px-5 py-2.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
                          >
                            VIEW SUMMARY
                          </button>
                        )}
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === apt.id ? null : apt.id)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          
                          {activeMenu === apt.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                              <button 
                                onClick={() => { handleEditAppointment(apt); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 font-medium flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" /> Edit Appointment
                              </button>
                              <button 
                                onClick={() => { handleCancelAppointment(apt.id); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-slate-50 font-medium flex items-center gap-2"
                              >
                                <Clock className="h-4 w-4" /> Cancel Appointment
                              </button>
                              <div className="h-px bg-slate-100 my-1" />
                              <button 
                                onClick={() => { handleDeleteAppointment(apt.id); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 font-medium flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" /> Delete Appointment
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        initialDate={selectedDate}
      />

      <AppointmentSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        appointment={selectedApt}
      />

      <AnimatePresence>
        {isTriageOpen && (
          <TriageModal 
            appointment={triageApt}
            onClose={() => setIsTriageOpen(false)}
            onSave={handleSaveTriage}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function TriageModal({ appointment, onClose, onSave }) {
  const [vitals, setVitals] = useState({
    temp: '',
    bp_sys: '',
    bp_dia: '',
    heart_rate: '',
    resp_rate: '',
    spo2: '',
    weight: '',
    height: '',
    rbs: '',
    complaint: ''
  });

  const [bmi, setBmi] = useState(null);

  useEffect(() => {
    if (vitals.weight && vitals.height) {
      const h_m = vitals.height / 100;
      const res = (vitals.weight / (h_m * h_m)).toFixed(1);
      setBmi(res);
    }
  }, [vitals.weight, vitals.height]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...vitals, bmi });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Thermometer className="h-7 w-7" />
             </div>
             <div>
               <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Clinical Triage</h3>
               <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em] mt-0.5">Vitals Collection: {appointment?.patient}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <TriageField label="Temp (°C)" value={vitals.temp} onChange={(val) => setVitals({...vitals, temp: val})} icon={<Thermometer className="h-4 w-4" />} placeholder="36.5" />
            <TriageField label="BP Systolic" value={vitals.bp_sys} onChange={(val) => setVitals({...vitals, bp_sys: val})} icon={<Heart className="h-4 w-4" />} placeholder="120" />
            <TriageField label="BP Diastolic" value={vitals.bp_dia} onChange={(val) => setVitals({...vitals, bp_dia: val})} icon={<Heart className="h-4 w-4 text-emerald-500" />} placeholder="80" />
            <TriageField label="Heart Rate (BPM)" value={vitals.heart_rate} onChange={(val) => setVitals({...vitals, heart_rate: val})} icon={<Activity className="h-4 w-4" />} placeholder="72" />
            <TriageField label="RR (per min)" value={vitals.resp_rate} onChange={(val) => setVitals({...vitals, resp_rate: val})} icon={<Clock className="h-4 w-4" />} placeholder="16" />
            <TriageField label="SpO2 (%)" value={vitals.spo2} onChange={(val) => setVitals({...vitals, spo2: val})} icon={<CheckCircle2 className="h-4 w-4" />} placeholder="98" />
            <TriageField label="Weight (kg)" value={vitals.weight} onChange={(val) => setVitals({...vitals, weight: val})} icon={<BarChart3 className="h-4 w-4" />} placeholder="70" />
            <TriageField label="Height (cm)" value={vitals.height} onChange={(val) => setVitals({...vitals, height: val})} icon={<ArrowUpRight className="h-4 w-4" />} placeholder="175" />
            <TriageField label="RBS (mmol/L)" value={vitals.rbs} onChange={(val) => setVitals({...vitals, rbs: val})} icon={<Zap className="h-4 w-4" />} placeholder="5.4" />
          </div>

          <div className="flex gap-4">
            <div className={`p-4 rounded-2xl flex-1 flex flex-col justify-center items-center ${bmi ? 'bg-primary-50 border border-primary-100' : 'bg-slate-50'}`}>
               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Calculated BMI</p>
               <p className="text-2xl font-semibold text-primary-600">{bmi || '--'}</p>
            </div>
            <div className="flex-[2] space-y-2">
               <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Patient's Chief Complaint</label>
               <textarea 
                 value={vitals.complaint}
                 onChange={(e) => setVitals({...vitals, complaint: e.target.value})}
                 className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-100 rounded-2xl text-xs font-medium outline-none resize-none h-20 shadow-inner"
                 placeholder="Briefly describe patient's reason for visit..."
               />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
             <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-500 font-medium rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Discard</button>
             <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-medium rounded-2xl text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">Submit Vitals</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function TriageField({ label, value, onChange, icon, placeholder, type = "text" }) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-1.5">
         {icon} {label}
       </label>
       <input 
         type={type}
         placeholder={placeholder}
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-200 rounded-2xl text-sm font-medium shadow-inner outline-none transition-all"
       />
    </div>
  );
}


