import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Stethoscope, 
  AlertCircle,
  CheckCircle2,
  FileText,
  Activity
} from 'lucide-react';

export default function AppointmentSummaryModal({ isOpen, onClose, appointment }) {
  if (!appointment) return null;

  return (
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
            className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Visit Summary</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Detailed appointment and clinical history overview.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-6">
                <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-100">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">{appointment.patient}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{appointment.type}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${appointment.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarIcon className="h-3 w-3" /> Date
                  </span>
                  <p className="text-sm font-bold text-slate-900">{appointment.date || 'TBD'}</p>
                </div>
                <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> TimeSlot
                  </span>
                  <p className="text-sm font-bold text-slate-900">{appointment.time}</p>
                </div>
                <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Stethoscope className="h-3 w-3" /> Provider
                  </span>
                  <p className="text-sm font-bold text-slate-900">{appointment.provider || appointment.doctor}</p>
                </div>
                <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="h-3 w-3" /> Priority
                  </span>
                  <p className={`text-sm font-black ${appointment.priority === 'High' ? 'text-red-500' : 'text-slate-900'}`}>
                    {appointment.priority}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <FileText className="h-4 w-4 text-primary-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Clinical Notes</span>
                </div>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic text-slate-500 text-sm font-medium leading-relaxed">
                  {appointment.notes || "No clinical notes entered for this session."}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all font-bold"
                >
                  Close Summary
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
