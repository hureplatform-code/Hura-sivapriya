import React from 'react';
import { Search, Bell, User, X, FileText, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import medicalRecordService from '../../services/medicalRecordService';
import facilityService from '../../services/facilityService';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const role = userData?.role || 'Superadmin';
  const [notifications, setNotifications] = React.useState([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notificationRef = React.useRef(null);
  
  // Search State
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setShowResults(true);
    try {
      const [patients, appointments, records] = await Promise.all([
        patientService.getAllPatients(),
        appointmentService.getAllAppointments(),
        medicalRecordService.getAllRecords()
      ]);

      const filteredPatients = patients.filter(p => p.name?.toLowerCase().includes(val.toLowerCase())).slice(0, 3);
      const filteredApts = appointments.filter(a => a.patient?.toLowerCase().includes(val.toLowerCase())).slice(0, 3);
      const filteredRecords = records.filter(r => r.patientName?.toLowerCase().includes(val.toLowerCase()) || r.title?.toLowerCase().includes(val.toLowerCase())).slice(0, 3);

      setResults([
        ...filteredPatients.map(p => ({ ...p, type: 'patient', icon: Users, path: `/master/patients/${p.id}` })),
        ...filteredApts.map(a => ({ ...a, type: 'appointment', icon: Calendar, path: '/appointments' })),
        ...filteredRecords.map(r => ({ ...r, type: 'record', icon: FileText, path: '/notes' }))
      ]);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userData]);

  const fetchNotifications = async () => {
    if (!userData) return;
    try {
      let notes = [];
      const role = userData.role?.toLowerCase();

      if (role === 'superadmin') {
        const [requests, facilities] = await Promise.all([
          facilityService.getAllSubscriptionRequests(),
          facilityService.getAllFacilities()
        ]);
        
        const pending = requests.filter(r => r.status === 'pending');
        notes = pending.map(r => {
          const facility = facilities.find(f => f.id === r.facilityId);
          return {
            id: r.id,
            title: 'New Upgrade Request',
            message: `${facility?.name || 'Unknown Facility'} requested ${r.requestedPlan}`,
            time: new Date(r.timestamp),
            type: 'alert',
            link: '/superadmin/subscriptions'
          };
        });
      } else if (role === 'admin') { // Clinic Admin
        if (userData.facilityId) {
          const profile = await facilityService.getProfile(userData.facilityId);
          if (profile?.subscription?.expiryDate) {
            const expiry = new Date(profile.subscription.expiryDate);
            const now = new Date();
            const diffTime = Math.abs(expiry - now);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 7) {
              notes.push({
                id: 'sub-exp',
                title: 'Subscription Expiring',
                message: `Your plan expires in ${diffDays} days. Renew now to avoid interruption.`,
                time: now,
                type: 'warning',
                link: '/master/accounts'
              });
            }
          }
        }
      } else if (role === 'doctor') {
        // Fetch all appointments and filter for this doctor & today
        const appointments = await appointmentService.getAllAppointments();
        const today = new Date().toISOString().split('T')[0];
        const doctorAppointments = appointments.filter(apt => 
          (apt.provider === userData.name || apt.providerId === userData.uid) && 
          apt.date === today && 
          apt.status !== 'completed' && apt.status !== 'cancelled'
        );
        
        notes = doctorAppointments.map(apt => ({
          id: apt.id,
          title: 'Appointment Today',
          message: `${apt.patient} at ${apt.time} - ${apt.type}`,
          time: new Date(`${apt.date}T${apt.time}`),
          type: 'info',
          link: '/appointments'
        }));
      }

      setNotifications(notes.sort((a, b) => b.time - a.time));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
            {searching ? <div className="h-4 w-4 border-2 border-primary-500 border-t-transparent animate-spin rounded-full" /> : <Search className="h-5 w-5" />}
          </div>
          <input 
            type="text" 
            placeholder="Search patients, appointments, records..." 
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            className="w-full bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl pl-12 pr-10 py-2.5 text-sm transition-all outline-none"
          />
          {query && (
            <button 
              onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showResults && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setShowResults(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
              >
                {results.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {results.map((res, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          navigate(res.path);
                          setShowResults(false);
                          setQuery('');
                        }}
                        className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all group text-left"
                      >
                        <div className="h-10 w-10 bg-slate-50 group-hover:bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors">
                          <res.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{res.name || res.title || res.patient}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.type} {res.id ? `• ${res.id}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm font-bold text-slate-400 italic">No matches for "{query}"</p>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 transition-colors rounded-xl ${showNotifications ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <Bell className="h-6 w-6" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 h-5 w-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 origin-top-right"
              >
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-sm">Notifications</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notifications.length} New</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((note) => (
                      <button 
                        key={note.id}
                        onClick={() => {
                          if (note.link) navigate(note.link);
                          setShowNotifications(false);
                        }}
                        className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-all group"
                      >
                        <div className="flex gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 
                            ${note.type === 'alert' ? 'bg-red-50 text-red-500' : 
                              note.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}
                          >
                            <Bell className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-snug group-hover:text-primary-600 transition-colors">{note.title}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.message}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">
                              {note.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                        <Bell className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-400">No new notifications</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-8 w-[1px] bg-slate-100"></div>

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{userData?.name || 'Jon Day'}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
          <div className="h-10 w-10 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-primary-600 font-bold border border-slate-200">
            {userData?.name?.split(' ').map(n => n[0]).join('') || <User className="h-6 w-6 text-slate-400" />}
          </div>
        </div>
      </div>
    </header>
  );
}
