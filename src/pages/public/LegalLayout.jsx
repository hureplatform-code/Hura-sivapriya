import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const LegalLayout = ({ children, title, subtitle, icon: Icon, sections = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 font-['Inter'] selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
         <div className="absolute top-0 right-[-10%] w-[1000px] h-[1000px] bg-teal-50/50 rounded-full blur-[120px] opacity-40 animate-pulse" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-[120px] opacity-40" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100/80">
        <div className="mx-auto max-w-[1600px] px-8 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-900 hover:text-teal-600 transition-all font-bold text-[11px] uppercase tracking-widest group bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            <span className="hidden sm:inline">Back to HURE Care</span>
          </button>
          
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/50 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-1.5" />
             </div>
             <div>
               <div className="text-xl font-bold text-slate-900 tracking-tight italic leading-tight">HURE <span className="text-teal-600">Care</span></div>
               <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black -mt-0.5">Patient Care OS</div>
             </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-8">
        <div className="mx-auto max-w-[1600px] flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-28">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Navigation</h4>
              <nav className="space-y-6">
                {sections.map((sec, i) => (
                  <a 
                    key={i} 
                    href={`#${sec.id}`}
                    className="flex items-center gap-4 text-sm font-bold text-slate-500 hover:text-teal-600 transition-all group"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200 group-hover:bg-teal-400 group-hover:scale-125 transition-all" />
                    {sec.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
             <div className="p-12 md:p-20 border-b border-slate-50 relative overflow-hidden bg-slate-50/30">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-10">
                  <div className="h-20 w-20 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-teal-600 shadow-2xl shadow-slate-200/50 shrink-0">
                     <Icon className="h-10 w-10" />
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">{title}</h1>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">{subtitle}</p>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute right-0 top-0 w-96 h-96 bg-teal-50/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             </div>
             
             <div className="p-12 md:p-20 text-slate-600 text-lg leading-relaxed font-medium">
                {children}
             </div>
           
           <div className="p-12 md:p-16 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 italic">Still have questions?</p>
              <button 
                onClick={() => window.location.href = 'mailto:support@gethure.com'}
                className="px-8 py-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-slate-200 transition-all active:scale-95"
              >
                Reach out to Compliance Office
              </button>
           </div>
          </div>
        </div>
        
        <div className="text-center mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} HURE CARE TECHNOLOGY. ALL RIGHTS RESERVED.
        </div>
      </main>
    </div>
  );
};

export default LegalLayout;
