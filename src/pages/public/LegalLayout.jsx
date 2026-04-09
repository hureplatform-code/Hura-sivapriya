import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LegalLayout = ({ children, title, subtitle, sections = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white font-['Inter'] selection:bg-teal-100 selection:text-teal-900">
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> 
            Back to Home
          </button>
          
          <div className="flex items-center gap-2">
             <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
             <span className="font-bold text-slate-900 tracking-tight">HURE Care</span>
          </div>
        </div>
      </nav>

      <main className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Side Menu */}
          {sections.length > 0 && (
            <aside className="lg:w-64 shrink-0 lg:sticky lg:top-24 h-fit">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Navigation</h4>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <a 
                    key={sec.id} 
                    href={`#${sec.id}`}
                    className="block px-3 py-2 text-sm font-medium text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-all"
                  >
                    {sec.label}
                  </a>
                ))}
              </nav>
            </aside>
          )}

          {/* Content Area */}
          <div className="flex-1 max-w-3xl">
            <header className="mb-12">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">{title}</h1>
              <p className="text-lg text-slate-500">{subtitle}</p>
            </header>

            <div className="prose prose-slate max-w-none">
              {children}
            </div>
            
            <footer className="mt-20 pt-8 border-t border-slate-100 text-sm text-slate-400">
                © {new Date().getFullYear()} HURE CARE TECHNOLOGY. ALL RIGHTS RESERVED.
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegalLayout;
