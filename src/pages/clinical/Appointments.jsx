import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentModal from '../../components/modals/AppointmentModal';
import appointmentService from '../../services/appointmentService';
import AppointmentSummaryModal from '../../components/modals/AppointmentSummaryModal';

export default function Appointments() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [notification, setNotification] = useState(null);
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
    try {
      setLoading(true);
      const data = await appointmentService.getAllAppointments();
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
    fetchAppointments();
  }, []);

  const handleSaveAppointment = async (data) => {
    try {
      const newAppointment = await appointmentService.bookAppointment(data);
      setAppointments(prev => [newAppointment, ...prev]);
      setNotification({ type: 'success', message: 'Appointment booked successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error booking appointment, adding with mock ID:", error);
      setAppointments(prev => [{ ...data, id: Date.now().toString(), status: 'scheduled' }, ...prev]);
      setNotification({ type: 'warning', message: 'Offline booking created.' });
      setTimeout(() => setNotification(null), 3000);
    }
    setIsModalOpen(false);
  };

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    noShows: appointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length
  };

  const handleArrive = async (id) => {
    try {
      await appointmentService.updateAppointmentStatus(id, 'arrived');
      fetchAppointments();
      setNotification({ type: 'success', message: 'Patient marked as Arrived.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error arriving patient:", error);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentService.updateAppointment(id, { status: 'cancelled' });
        fetchAppointments();
        setNotification({ type: 'success', message: 'Appointment cancelled successfully.' });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this appointment?')) {
      try {
        await appointmentService.deleteAppointment(id);
        fetchAppointments();
        setNotification({ type: 'success', message: 'Appointment deleted successfully.' });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const handleEditAppointment = (apt) => {
    setSelectedApt(apt);
    setIsModalOpen(true);
  };

  const handleStartConsultation = (apt) => {
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
      // Prioritize Arrived status first
      if (a.status === 'arrived' && b.status !== 'arrived') return -1;
      if (a.status !== 'arrived' && b.status === 'arrived') return 1;
      return 0;
    });

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Appointments</h1>
            <p className="text-slate-500 mt-1">Manage patient bookings, scheduling, and clinical arrivals.</p>
          </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
            >
            <Plus className="h-5 w-5" />
            Book Appointment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">{monthName} {year}</h3>
                <div className="flex gap-1">
                  <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg"><ChevronLeft className="h-4 w-4 text-slate-400" /></button>
                  <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 rounded-lg"><ChevronRight className="h-4 w-4 text-slate-400" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
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
                      className={`h-8 w-8 text-xs font-bold rounded-xl flex items-center justify-center transition-all
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
                <h4 className="font-bold text-lg mb-2 text-left">Daily Summary</h4>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-sm text-slate-400 font-medium">Total Booked</span>
                    <span className="font-black text-emerald-400">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-sm text-slate-400 font-medium">Completed</span>
                    <span className="font-black text-blue-400">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-sm text-slate-400 font-medium">No Shows</span>
                    <span className="font-black text-red-400">{stats.noShows}</span>
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
                  className="px-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none text-slate-600 font-bold appearance-none min-w-[140px]"
                >
                  <option value="All">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Arrived">Arrived</option>
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
                  <p className="font-bold text-xs uppercase tracking-widest text-slate-400">Loading appointments...</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-50">
                   <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <CalendarIcon className="h-8 w-8" />
                   </div>
                   <p className="font-bold text-xs uppercase tracking-widest text-slate-400">No appointments for {new Date(selectedDate).toLocaleDateString()}.</p>
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
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{apt.time?.split(':')[0] || '0'}</span>
                        <span className="text-lg font-black text-slate-900 leading-none">{apt.time?.split(':')[1] || '00'}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                          {apt.patient}
                          <span className={`h-2 w-2 rounded-full ${apt.priority === 'High' ? 'bg-red-500 animate-pulse' : apt.priority === 'Normal' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                        </h3>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <User className="h-3.5 w-3.5" />
                          {apt.provider || apt.doctor} • <span className="text-slate-400">{apt.type}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2
                          ${apt.status === 'arrived' ? 'bg-indigo-50 text-indigo-600' : 
                            apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
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
                        {apt.status === 'arrived' ? (
                          <button 
                            onClick={() => handleStartConsultation(apt)}
                            className="px-5 py-2.5 bg-primary-600 text-white text-xs font-black rounded-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-50 active:scale-95"
                          >
                            START CONSULTATION
                          </button>
                        ) : (apt.status === 'scheduled') ? (
                          <button 
                            onClick={() => handleArrive(apt.id)}
                            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-lg hover:bg-slate-800 transition-all active:scale-95"
                          >
                            ARRIVE PATIENT
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleViewSummary(apt)}
                            className="px-5 py-2.5 bg-slate-50 text-slate-600 text-xs font-black rounded-lg hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
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
                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 font-bold flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" /> Edit Appointment
                              </button>
                              <button 
                                onClick={() => { handleCancelAppointment(apt.id); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-slate-50 font-bold flex items-center gap-2"
                              >
                                <Clock className="h-4 w-4" /> Cancel Appointment
                              </button>
                              <div className="h-px bg-slate-100 my-1" />
                              <button 
                                onClick={() => { handleDeleteAppointment(apt.id); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 font-bold flex items-center gap-2"
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
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
             <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
             </div>
             {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
