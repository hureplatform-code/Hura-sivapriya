import React from 'react';
import LegalLayout from './LegalLayout';
import { Lock, ShieldCheck } from 'lucide-react';

const Privacy = () => {
  const sections = [
    { id: 'intro', label: 'Introduction' },
    { id: 'stewardship', label: 'Data Stewardship' },
    { id: 'collection', label: 'Information Collection' },
    { id: 'compliance', label: 'Compliance Standards' }
  ];

  return (
    <LegalLayout 
      title="Privacy Policy" 
      subtitle="How we protect your clinic and patient information."
      icon={Lock}
      sections={sections}
    >
      <section id="intro" className="mb-12 scroll-mt-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Introduction</h2>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
          HURE Care Technology ("we," "us," or "our") is dedicated to protecting the privacy of our healthcare partners and their patients. This Privacy Policy outlines how we collect, use, and safeguard the sensitive health information (PHI) managed within our Patient Care Operating System.
        </p>
      </section>

      <section id="stewardship" className="mb-12 scroll-mt-32">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Data Stewardship</h2>
        <p className="text-slate-600 leading-relaxed mb-8">
          We operate as a "Data Processor" for your facility. Your clinical team remains the "Data Controller" of all patient records and diagnostic data.
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:bg-white hover:shadow-sm">
             <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-teal-100">
               <ShieldCheck className="h-3 w-3 text-white" />
             </div>
             <p className="text-slate-600 text-[15px] font-medium leading-relaxed">All Patient Health Information (PHI) is encrypted at rest using industry-standard AES-256 protocols.</p>
          </div>
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-colors hover:bg-white hover:shadow-sm">
             <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-teal-100">
                <Lock className="h-3 w-3 text-white" />
             </div>
             <p className="text-slate-600 text-[15px] font-medium leading-relaxed">Immutable access logs are maintained for every user interaction with patient records for audit-trail integrity.</p>
          </div>
        </div>
      </section>

      <section id="collection" className="mb-12 scroll-mt-32">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Information Collection</h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          To maintain secure facility operations, we collect the following data points:
        </p>
        <div className="grid grid-cols-2 gap-3">
           {['Facility License Number', 'Administrator Credentials', 'Healthcare Provider Details', 'Operational Contact Info'].map(item => (
             <div key={item} className="px-5 py-3 rounded-xl bg-white border border-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest shadow-sm">{item}</div>
           ))}
        </div>
      </section>

      <section id="compliance" className="mb-12 scroll-mt-32">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Compliance Standards</h2>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
           Our platform is engineered to align with global digital health security standards, including GDPR and local health information act requirements.
        </p>
      </section>

      <footer className="pt-12 border-t border-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
         LAST UPDATED: MARCH 27, 2026
      </footer>
    </LegalLayout>
  );
};

export default Privacy;
