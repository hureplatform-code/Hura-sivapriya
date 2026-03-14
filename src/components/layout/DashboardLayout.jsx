import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useInactivityTimer } from '../../hooks/useInactivityTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { isWarning, timeLeft, resetTimer } = useInactivityTimer();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden print:bg-white">
      <div className="print:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <main className="flex-1 lg:ml-72 min-w-0 print:m-0 print:p-0">
        <div className="print:hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <div className="p-4 md:p-8 print:p-0">
          {children}
        </div>
      </main>

      {/* Security Lock Warning Overlay */}
      <AnimatePresence>
        {isWarning && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
           >
              <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 30, ease: 'linear' }}
                      className="h-full bg-red-500"
                    />
                 </div>

                 <div className="h-20 w-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
                    <ShieldAlert className="h-10 w-10" />
                 </div>

                 <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-slate-900">Security Timeout</h2>
                    <p className="text-slate-500 font-medium">For patient data protection, your session will lock due to inactivity.</p>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400 font-medium text-xs uppercase tracking-widest">
                       <Clock className="h-4 w-4" /> Locking in
                    </div>
                    <span className="text-2xl font-semibold text-red-600 font-mono">{timeLeft}s</span>
                 </div>

                 <button 
                   onClick={resetTimer}
                   className="w-full py-5 bg-slate-900 text-white font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                 >
                   I'm Still Working
                 </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
