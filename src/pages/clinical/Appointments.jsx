import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
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
  ArrowUpRight,
  Volume2,
  Play,
  Beaker,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentModal from '../../components/modals/AppointmentModal';
import PaymentCollectionModal from '../../components/modals/PaymentCollectionModal';
import appointmentService from '../../services/appointmentService';
import AppointmentSummaryModal from '../../components/modals/AppointmentSummaryModal';
import TriageModal from '../../components/modals/TriageModal';
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
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [triageApt, setTriageApt] = useState(null);
  const { userData } = useAuth();
  const [activeMenu, setActiveMenu] = useState(null);
  const [routingMenu, setRoutingMenu] = useState(null);
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
    setLoading(true);
    if (!userData?.facilityId && userData?.role !== 'superadmin') {
      setLoading(false);
      return;
    }
    try {
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

  const dailyAppointments = appointments.filter(a => {
    const aptDate = a.date || a.app_date;
    return aptDate === selectedDate;
  });

  const stats = {
    total: dailyAppointments.filter(a => ['doctor', 'nurse', 'lab_tech', 'pharmacist', 'lab_admin', 'pharmacist_admin'].includes(userData?.role) ? a.status !== 'cancelled' : true).length,
    completed: dailyAppointments.filter(a => a.status === 'completed').length,
    noShows: ['doctor', 'nurse', 'lab_tech', 'pharmacist', 'lab_admin', 'pharmacist_admin'].includes(userData?.role) ? 0 : dailyAppointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length
  };

  const handleCallIn = async (appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, 'calling');
      success('Patient called in. Showing on TV.');
      fetchAppointments();
    } catch (error) {
       console.error("Error calling patient:", error);
    }
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
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        apt.patient?.toLowerCase().includes(q) || 
        apt.patientId?.toLowerCase().includes(q) || 
        apt.mobile?.toLowerCase().includes(q) ||
        apt.contact?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || apt.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesSpecialty = specialtyFilter === 'All' || apt.type?.toLowerCase() === specialtyFilter.toLowerCase();
      // Support both new "date" and legacy "app_date"
      const aptDate = apt.date || apt.app_date;
      const matchesDate = aptDate === selectedDate;
      const hideCancelledForClinical = ['doctor', 'nurse', 'lab_tech', 'pharmacist', 'lab_admin', 'pharmacist_admin'].includes(userData?.role) && apt.status === 'cancelled';
      return matchesSearch && matchesStatus && matchesSpecialty && matchesDate && !hideCancelledForClinical;
    })
    .sort((a, b) => {
      // Prioritize Arrived/Triage/In-Session status first
      const priority = { 'in-session': 1, 'triage': 2, 'arrived': 3, 'awaiting-nurse': 4, 'awaiting-lab': 5, 'awaiting-pharmacy': 6, 'awaiting-billing': 7, 'scheduled': 8, 'completed': 9, 'cancelled': 10 };
      return (priority[a.status?.toLowerCase()] || 99) - (priority[b.status?.toLowerCase()] || 99);
    });

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Appointments</h1>
              <button 
                onClick={fetchAppointments}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all active:scale-95"
                title="Refresh Queue"
              >
                <RotateCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-slate-500 mt-1">Manage patient bookings, scheduling, and clinical arrivals.</p>
          </div>
          {userData?.role !== 'doctor' && userData?.role !== 'nurse' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Book Appointment
            </button>
          )}
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
                  <option value="Awaiting-Nurse">Awaiting Nurse</option>
                  <option value="Awaiting-Lab">Awaiting Lab</option>
                  <option value="Awaiting-Pharmacy">Awaiting Pharmacy</option>
                  <option value="Awaiting-Billing">Awaiting Billing</option>
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
                    <div className="flex flex-1 items-center gap-5 min-w-0">
                      <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:border-primary-200 transition-colors shadow-inner">
                        <span className="text-[9px] font-bold text-primary-600 leading-none mb-1">T-{apt.tokenNumber || '0'}</span>
                        <div className="h-px w-6 bg-slate-200 mb-1" />
                        <div className="flex flex-col items-center leading-none">
                          <span className="text-[11px] font-bold text-slate-800 tracking-tight">
                            {apt.time || '00:00'}
                          </span>
                        </div>
                      </div>
                      <div className="text-left min-w-0">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base truncate">
                          {apt.patient}
                          <span className={`h-2 w-2 rounded-full shrink-0 ${apt.priority === 'High' ? 'bg-red-500 animate-pulse' : apt.priority === 'Normal' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          {apt.labResults && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-blue-100">
                               <Beaker className="h-3 w-3" /> Results Ready
                            </span>
                          )}
                          
                          {/* Booking Type Badge */}
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${apt.bookingType === 'SD' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             {apt.bookingType || 'ADV'}
                          </span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-1">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="text-slate-300">ID:</span> {apt.patientId || 'NEW'}
                          </p>
                          {(apt.patientPhone || apt.mobile || apt.phoneNumber) && (
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <span className="text-slate-300">MOB:</span> {apt.patientPhone || apt.mobile || apt.phoneNumber}
                            </p>
                          )}
                          <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                             <User className="h-3 w-3 text-slate-300" /> {apt.provider || apt.doctor}
                          </p>
                          <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] text-slate-500 font-bold uppercase tracking-widest">{apt.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-3 shrink-0">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border
                        ${apt.status === 'arrived' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                          apt.status === 'triage' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          apt.status === 'in-session' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          apt.status === 'calling' ? 'bg-amber-50 text-amber-700 animate-pulse border-amber-200 border-2' :
                          apt.status?.startsWith('awaiting-') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          apt.status === 'completed' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                          apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 
                          'bg-amber-50 text-amber-700 border-amber-100'}
                      `}>
                        {apt.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : 
                         apt.status === 'cancelled' ? <XCircle className="h-3 w-3" /> : 
                         apt.status === 'calling' ? <Volume2 className="h-3 w-3" /> :
                         apt.status?.startsWith('awaiting-') ? <ArrowUpRight className="h-3 w-3" /> :
                         <Clock className="h-3 w-3" />}
                        {apt.status?.replace('-', ' ')}
                      </span>

                      <div className="flex items-center gap-2">
                        {apt.status === 'scheduled' && (userData?.role === 'receptionist' || userData?.role === 'clinic_owner') && (
                          <button 
                            onClick={() => { setSelectedApt(apt); setIsPaymentOpen(true); }}
                            className="px-4 py-2 bg-emerald-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200 flex items-center gap-2"
                          >
                            <CreditCard className="h-3 w-3" /> COLLECT & CHECK IN
                          </button>
                        )}

                        {apt.status === 'awaiting-lab' && (userData?.role === 'lab_tech' || userData?.role === 'clinic_owner') && (
                          <button 
                            onClick={() => navigate('/lab/queue')}
                            className="px-4 py-2 bg-orange-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center gap-2"
                          >
                             <Thermometer className="h-3.5 w-3.5" /> PROCESS LAB
                          </button>
                        )}

                        {apt.status === 'awaiting-pharmacy' && (userData?.role === 'pharmacist' || userData?.role === 'clinic_owner') && (
                          <button 
                            onClick={() => navigate('/pharmacy/queue')}
                            className="px-4 py-2 bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                          >
                             <Zap className="h-3.5 w-3.5" /> DISPENSE MEDS
                          </button>
                        )}

                        {(apt.status === 'arrived' || apt.status === 'triage') && userData?.role === 'doctor' && (
                          apt.labResultsReady ? (
                            <button 
                              onClick={() => handleStartConsultation(apt)}
                              className="px-4 py-2 bg-emerald-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50 flex items-center gap-2"
                            >
                              <Beaker className="h-3.5 w-3.5" />
                              REPORT READY
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleCallIn(apt.id)}
                              className="px-4 py-2 bg-blue-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 flex items-center gap-2"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                              CALL IN
                            </button>
                          )
                        )}
                        
                        {apt.status === 'awaiting-nurse' && ['nurse'].includes(userData?.role) && (
                          <button 
                            onClick={() => handlePerformTriage(apt)}
                            className="px-4 py-2 bg-blue-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-50"
                          >
                            TRIAGE
                          </button>
                        )}

                        {(apt.status === 'calling' || apt.status === 'triage') && userData?.role === 'doctor' && (
                           <button 
                             onClick={() => handleStartConsultation(apt)}
                             className="px-4 py-2 bg-emerald-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50"
                           >
                             START SESSION
                           </button>
                        )}

                        {apt.status === 'in-session' && userData?.role === 'doctor' && (
                          <>
                            <button 
                              onClick={() => handleStartConsultation(apt)}
                              className="px-4 py-2 bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                              RESUME
                            </button>
                            <div className="relative">
                              <button 
                                onClick={() => setRoutingMenu(routingMenu === apt.id ? null : apt.id)}
                                className="px-4 py-2 bg-purple-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-50 flex items-center gap-2"
                              >
                                ROUTE <ChevronRight className={`h-3 w-3 transition-transform ${routingMenu === apt.id ? 'rotate-90' : ''}`} />
                              </button>

                              {routingMenu === apt.id && (
                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-[70]">
                                  <button 
                                    onClick={() => { handleStatusUpdate(apt.id, 'awaiting-nurse', 'Patient routed to Nurse.'); setRoutingMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-bold uppercase tracking-wider flex items-center gap-3"
                                  >
                                    <Activity className="h-3.5 w-3.5" /> Nurse
                                  </button>
                                  <button 
                                    onClick={() => { handleStatusUpdate(apt.id, 'awaiting-lab', 'Patient routed to Laboratory.'); setRoutingMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-bold uppercase tracking-wider flex items-center gap-3"
                                  >
                                    <Thermometer className="h-3.5 w-3.5" /> Lab
                                  </button>
                                  <button 
                                    onClick={() => { handleStatusUpdate(apt.id, 'awaiting-pharmacy', 'Patient routed to Pharmacy.'); setRoutingMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-bold uppercase tracking-wider flex items-center gap-3"
                                  >
                                    <Activity className="h-3.5 w-3.5" /> Pharmacy
                                  </button>
                                  <button 
                                    onClick={() => { handleStatusUpdate(apt.id, 'awaiting-billing', 'Patient routed to Billing.'); setRoutingMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-bold uppercase tracking-wider flex items-center gap-3"
                                  >
                                    <Zap className="h-3.5 w-3.5" /> Billing
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button 
                                    onClick={() => { handleStatusUpdate(apt.id, 'completed', 'Patient Discharged.'); setRoutingMenu(null); }}
                                    className="w-full text-left px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50 font-bold uppercase tracking-wider flex items-center gap-3"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Discharge
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {['completed', 'cancelled'].includes(apt.status) && (
                          <button 
                            onClick={() => handleViewSummary(apt)}
                            className="px-4 py-2 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-100 transition-all border border-slate-100"
                          >
                            SUMMARY
                          </button>
                        )}
                        
                        {!['in-session', 'completed', 'cancelled'].includes(apt.status) && userData?.role !== 'doctor' && userData?.role !== 'nurse' && (
                          <div className="relative">
                            <button 
                              onClick={() => setActiveMenu(activeMenu === apt.id ? null : apt.id)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            
                            {activeMenu === apt.id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                                <button 
                                  onClick={() => { handleEditAppointment(apt); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-bold uppercase tracking-widest flex items-center gap-2"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button 
                                  onClick={() => { handleCancelAppointment(apt.id); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-xs text-amber-600 hover:bg-slate-50 font-bold uppercase tracking-widest flex items-center gap-2"
                                >
                                  <Clock className="h-3.5 w-3.5" /> Cancel
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button 
                                  onClick={() => { handleDeleteAppointment(apt.id); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-slate-50 font-bold uppercase tracking-widest flex items-center gap-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
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
      <PaymentCollectionModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        appointment={selectedApt}
        type="consultation"
        onSuccess={() => {
          handleStatusUpdate(selectedApt.id, 'awaiting-nurse', 'Payment collected and patient routed to Nursing triage.');
          setIsPaymentOpen(false);
        }}
      />
    </DashboardLayout>
  );
}


