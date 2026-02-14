import React from 'react';
import { Search, Bell, User, X, FileText, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import medicalRecordService from '../../services/medicalRecordService';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const role = userData?.role || 'Superadmin';

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
        <button className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
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
