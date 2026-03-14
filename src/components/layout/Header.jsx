import React from 'react';
import { Search, Bell, User, X, FileText, Calendar, Users, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import medicalRecordService from '../../services/medicalRecordService';
import facilityService from '../../services/facilityService';
import inventoryService from '../../services/inventoryService';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ onMenuClick }) {
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
      const facilityId = userData?.facilityId;
      const [patients, appointments, records] = await Promise.all([
        patientService.getAllPatients(facilityId),
        appointmentService.getAllAppointments(facilityId),
        medicalRecordService.getAllRecords(facilityId)
      ]);

      const queryLower = val.toLowerCase();
      const queryDigits = val.replace(/[^0-9]/g, '');
      const queryNoZero = queryDigits.startsWith('0') ? queryDigits.substring(1) : queryDigits;

      const filteredPatients = patients.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(queryLower);
        const idMatch = (p.id || '').toLowerCase().includes(queryLower);
        const mobileDigits = (p.mobile || '').replace(/[^0-9]/g, '');
        const contactDigits = (p.contact || '').replace(/[^0-9]/g, '');
        
        const phoneMatch = (queryDigits && (mobileDigits.includes(queryDigits) || contactDigits.includes(queryDigits))) ||
                          (queryNoZero && (mobileDigits.includes(queryNoZero) || contactDigits.includes(queryNoZero)));
        
        return nameMatch || idMatch || phoneMatch;
      }).slice(0, 3);

      const filteredApts = appointments.filter(a => {
        const nameMatch = a.patient?.toLowerCase().includes(queryLower);
        const mobileDigits = (a.patientPhone || '').replace(/[^0-9]/g, '');
        const phoneMatch = (queryDigits && mobileDigits.includes(queryDigits)) || (queryNoZero && mobileDigits.includes(queryNoZero));
        return nameMatch || phoneMatch;
      }).slice(0, 3);

      const filteredRecords = records.filter(r => 
        r.patientName?.toLowerCase().includes(queryLower) || 
        r.title?.toLowerCase().includes(queryLower) ||
        r.patientId?.toLowerCase().includes(queryLower) ||
        (r.id || '').toLowerCase().includes(queryLower)
      ).slice(0, 3);

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
    if (!userData || !userData.facilityId && userData.role !== 'superadmin') return;
    try {
      let notes = [];
      const role = userData.role?.toLowerCase();
      const facilityId = userData.facilityId;

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
      } else if (role === 'clinic_owner' || role === 'admin') {
        const profile = await facilityService.getProfile(facilityId);
        if (profile?.subscription?.expiryDate) {
          const expiry = new Date(profile.subscription.expiryDate);
          const now = new Date();
          const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          if (diffDays <= 14) {
            notes.push({
              id: 'sub-exp',
              title: diffDays <= 0 ? 'Subscription Expired' : 'Subscription Expiring Soon',
              message: diffDays <= 0
                ? 'Your subscription has expired. Renew immediately to restore access.'
                : `Your plan expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}. Renew now to avoid interruption.`,
              time: now,
              type: diffDays <= 0 ? 'alert' : 'warning',
              link: '/master/accounts'
            });
          }
        }
      } else if (role === 'doctor') {
        const appointments = await appointmentService.getAllAppointments(facilityId);
        const today = new Date().toISOString().split('T')[0];
        const doctorAppointments = appointments.filter(apt =>
          (apt.provider === userData.name || apt.providerId === userData.uid) &&
          apt.date === today && apt.status !== 'completed' && apt.status !== 'cancelled'
        );
        notes = doctorAppointments.map(apt => {
          let appointmentTime = new Date();
          try {
            if (apt.date && apt.time) {
              appointmentTime = new Date(`${apt.date}T${apt.time.padStart(5, '0')}`);
            }
          } catch (e) {
            console.error("Invalid appointment date/time", apt);
          }
          
          return {
            id: apt.id,
            title: 'Appointment Today',
            message: `${apt.patient} at ${apt.time || 'TBD'} — ${apt.type || 'Consultation'}`,
            time: appointmentTime,
            type: 'info',
            link: '/appointments'
          };
        });
      } else if (role === 'nurse') {
        const appointments = await appointmentService.getAllAppointments(facilityId);
        const today = new Date().toISOString().split('T')[0];
        const todayPts = appointments.filter(a => a.date === today && a.status !== 'cancelled');
        if (todayPts.length > 0) {
          notes.push({
            id: 'nurse-today',
            title: `${todayPts.length} Patient${todayPts.length > 1 ? 's' : ''} Scheduled Today`,
            message: 'Check the appointment list and prepare patient rooms.',
            time: new Date(),
            type: 'info',
            link: '/appointments'
          });
        }
      } else if (role === 'receptionist') {
        const appointments = await appointmentService.getAllAppointments(facilityId);
        const today = new Date().toISOString().split('T')[0];
        const pending = appointments.filter(a => a.date === today && a.status === 'booked');
        if (pending.length > 0) {
          notes.push({
            id: 'reception-pending',
            title: `${pending.length} Pending Check-in${pending.length > 1 ? 's' : ''}`,
            message: 'Patients are awaiting check-in for today.',
            time: new Date(),
            type: 'info',
            link: '/appointments'
          });
        }
      } else if (role === 'pharmacist') {
        try {
          const items = await inventoryService.getInventory(facilityId);
          // Handle inventory response which might be { items, lastDoc } or flat array
          const actualItems = items.items || items;
          const lowStock = actualItems.filter(i => parseInt(i.quantity || i.stock || 0) < 10);
          if (lowStock.length > 0) {
            notes.push({
              id: 'pharma-stock',
              title: `${lowStock.length} Low-Stock Item${lowStock.length > 1 ? 's' : ''}`,
              message: `${lowStock.slice(0, 2).map(i => i.name).join(', ')}${lowStock.length > 2 ? ` and ${lowStock.length - 2} more` : ''} need restocking.`,
              time: new Date(),
              type: 'warning',
              link: '/pharmacy'
            });
          }
        } catch (_) { /* inventory may not be set up */ }
      }

      setNotifications(notes.sort((a, b) => b.time - a.time));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 md:px-8 flex items-center gap-4 justify-between">
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
      >
        <Menu className="h-6 w-6" />
      </button>

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
                          <p className="text-sm font-medium text-slate-900 truncate">{res.name || res.title || res.patient}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{res.type} {res.id ? `• ${res.id}` : ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-slate-400 italic">No matches for "{query}"</p>
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
              <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 h-5 w-5 bg-red-500 text-white text-[10px] font-medium flex items-center justify-center rounded-full border-2 border-white shadow-sm">
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
                  <h3 className="font-medium text-slate-900 text-sm">Notifications</h3>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{notifications.length} New</span>
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
                            <p className="text-xs font-medium text-slate-900 leading-snug group-hover:text-primary-600 transition-colors">{note.title}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.message}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-2 uppercase tracking-wide">
                              {note.time instanceof Date && !isNaN(note.time) 
                                ? note.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Recent'}
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
                      <p className="text-xs font-medium text-slate-400">No new notifications</p>
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
            <p className="text-sm font-medium text-slate-900">{userData?.name || 'Jon Day'}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
          <div className="h-10 w-10 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-primary-600 font-medium border border-slate-200">
            {userData?.name?.split(' ').map(n => n[0]).join('') || <User className="h-6 w-6 text-slate-400" />}
          </div>
        </div>
      </div>
    </header>
  );
}
