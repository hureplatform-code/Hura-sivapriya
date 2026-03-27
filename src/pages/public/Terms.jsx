import React from 'react';
import LegalLayout from './LegalLayout';
import { Globe } from 'lucide-react';

const Terms = () => {
  const sections = [
    { id: 'overview', label: 'Service Overview' },
    { id: 'subscription', label: 'Subscription & Trials' },
    { id: 'governance', label: 'Facility Governance' },
    { id: 'suspension', label: 'Restriction & Suspension' }
  ];

  return (
    <LegalLayout 
      title="Terms of Service" 
      subtitle="The governance and rules of HURE Care operations."
      icon={Globe}
      sections={sections}
    >
      <section id="overview" className="mb-12 scroll-mt-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Service Overview</h2>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
          HURE Care Technology ("we," "us," or "our") provides a Patient Care Operating System (EMR/CMS) as a service ("SaaS"). By registering a healthcare facility, your administrative entity ("Facility Owner") agrees to these terms and the platform governance rules.
        </p>
      </section>

      <section id="subscription" className="mb-12 scroll-mt-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Subscription & Trials</h2>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
          Our platform operates with a free trial period and subsequent tiered subscription plans.
        </p>
        <div className="space-y-4">
           {[
             { title: "Trial Period", desc: "A 10-day evaluation period with full feature access for facility exploration." },
             { title: "Verification", desc: "License submission is required before the end of the trial to ensure long-term clinical compliance." },
             { title: "Renewal", desc: "Subscriptions are billed in advance per chosen billing cycle. No clinical data is deleted upon expiration, but write-access is restricted." }
           ].map((item, idx) => (
             <div key={idx} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all cursor-default">
               <div className="text-[10px] font-black text-teal-600 tracking-widest uppercase mb-2">CLAUSE {idx + 1}</div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
               <p className="text-slate-500 font-medium">{item.desc}</p>
             </div>
           ))}
        </div>
      </section>

      <section id="governance" className="mb-12 scroll-mt-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Facility Governance</h2>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
          Facility Owners are responsible for the clinical accuracy of the documentation entered by their staff. We provide the tools, but the clinical responsibility remains with the healthcare provider.
        </p>
      </section>

      <section id="suspension" className="mb-12 scroll-mt-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Restriction & Suspension</h2>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
          We reserve the right to restrict write-access if a facility:
        </p>
        <ul className="space-y-4 text-slate-500 font-medium">
           <li className="flex items-center gap-3">
              <div className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">!</div>
              <span>Allows an expired subscription to linger beyond the grace period.</span>
           </li>
           <li className="flex items-center gap-3">
              <div className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">!</div>
              <span>Fails to provide valid facility licensing documentation.</span>
           </li>
        </ul>
      </section>

      <footer className="pt-12 border-t border-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
         LAST UPDATED: MARCH 27, 2026
      </footer>
    </LegalLayout>
  );
};

export default Terms;
