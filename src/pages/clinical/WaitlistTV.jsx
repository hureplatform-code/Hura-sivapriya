import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Activity, Heart, Thermometer, Radio } from 'lucide-react';
import appointmentService from '../../services/appointmentService';

export default function WaitlistTV() {
  const [appointments, setAppointments] = useState([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const fetcher = setInterval(fetchQueue, 10000);
    fetchQueue();
    return () => {
      clearInterval(timer);
      clearInterval(fetcher);
    };
  }, []);

  const fetchQueue = async () => {
    try {
      const data = await appointmentService.getAllAppointments();
      const waiting = data.filter(a => ['arrived', 'triage', 'in-session'].includes(a.status))
        .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
      setAppointments(waiting);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-12 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-16 px-6">
        <div className="flex items-center gap-6">
           <div className="h-20 w-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Activity className="h-10 w-10" />
           </div>
           <div>
              <h1 className="text-5xl font-medium tracking-tighter uppercase">Live Patient Flow</h1>
              <p className="text-blue-400 font-medium tracking-[0.3em] text-sm mt-1 flex items-center gap-2">
                 <Radio className="h-4 w-4 animate-pulse" /> Real-time Queue Status
              </p>
           </div>
        </div>
        <div className="text-right">
           <p className="text-6xl font-medium tabular-nums tracking-tighter">
             {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </p>
           <p className="text-slate-500 font-semibold uppercase tracking-widest text-sm mt-2">
             {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-[calc(100vh-250px)]">
        {/* Main List */}
        <div className="lg:col-span-2 bg-[#12151c] rounded-[4rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between mb-12 px-4">
              <h3 className="text-2xl font-semibold text-slate-400 uppercase tracking-widest">Active Queue</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-6 py-2 rounded-full text-xs font-semibold uppercase">
                    <Users className="h-4 w-4" /> {appointments.length} Present
                 </div>
              </div>
           </div>

           <div className="space-y-6 overflow-y-auto max-h-full pr-4 custom-scrollbar">
              <AnimatePresence mode='popLayout'>
                {appointments.map((apt, i) => (
                  <motion.div 
                    key={apt.id}
                    layout
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`flex items-center justify-between p-8 rounded-[2.5rem] border transition-all
                      ${apt.status === 'in-session' 
                        ? 'bg-blue-600 border-blue-400 shadow-2xl shadow-blue-500/20 scale-[1.02]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}
                    `}
                  >
                    <div className="flex items-center gap-8">
                       <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-medium text-2xl
                         ${apt.status === 'in-session' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'}
                       `}>
                          {i + 1}
                       </div>
                       <div>
                          <p className={`text-3xl font-semibold tracking-tight ${apt.status === 'in-session' ? 'text-white' : 'text-slate-100'}`}>
                            {apt.patient?.split(' ')[0]} {apt.patient?.split(' ')[1]?.[0] || ''}.
                          </p>
                          <p className={`text-sm font-semibold uppercase tracking-widest mt-1 ${apt.status === 'in-session' ? 'text-blue-100' : 'text-slate-500'}`}>
                             Ref: {apt.id?.slice(-6).toUpperCase()} • {apt.type}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className={`text-sm font-semibold uppercase tracking-widest ${apt.status === 'in-session' ? 'text-emerald-300' : 'text-slate-400'}`}>
                             Status
                          </p>
                          <p className={`text-xl font-semibold uppercase ${apt.status === 'in-session' ? 'text-white' : 'text-blue-400'}`}>
                             {apt.status === 'in-session' ? 'Consulting' : apt.status === 'triage' ? 'In Triage' : 'Waiting'}
                          </p>
                       </div>
                       <ChevronRight className={`h-8 w-8 ${apt.status === 'in-session' ? 'text-white' : 'text-white/10'}`} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           <div className="bg-emerald-600 rounded-[3.5rem] p-12 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
              <div className="relative z-10">
                 <Heart className="h-12 w-12 text-emerald-200 mb-6" />
                 <h4 className="text-2xl font-semibold mb-2">Health Notice</h4>
                 <p className="text-emerald-100 font-medium leading-relaxed">Please ensure you have your token and ID ready. Our team will assist you shortly.</p>
              </div>
              <div className="absolute -right-12 -bottom-12 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
           </div>

           <div className="bg-[#12151c] rounded-[3.5rem] p-10 border border-white/5 flex-1 flex flex-col items-center justify-center text-center">
              <Thermometer className="h-16 w-16 text-blue-500 mb-6" />
              <h5 className="text-slate-400 font-semibold uppercase tracking-widest text-sm mb-4">AVG. WAIT TIME</h5>
              <p className="text-7xl font-medium text-white tracking-tighter">18</p>
              <p className="text-lg font-semibold text-slate-500 uppercase tracking-widest">MINUTES</p>
              
              <div className="mt-12 w-full pt-10 border-t border-white/5 grid grid-cols-2 gap-8">
                 <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1">Doctors In</p>
                    <p className="text-2xl font-semibold text-emerald-400">04</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1">In Session</p>
                    <p className="text-2xl font-semibold text-blue-400">03</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.4); }
      `}</style>
    </div>
  );
}

function ChevronRight({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
    </svg>
  );
}
