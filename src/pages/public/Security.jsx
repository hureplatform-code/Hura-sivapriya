import React from 'react';
import LegalLayout from './LegalLayout';
import { ShieldCheck, Database, Key, Send, Lock } from 'lucide-react';

const Security = () => {
  const sections = [
    { id: 'infra', label: 'Data Infrastructure' },
    { id: 'access', label: 'User Access Control' },
    { id: 'backup', label: 'Secure Backups' }
  ];

  return (
    <LegalLayout 
      title="Security Matrix" 
      subtitle="How HURE Care protects your medical facility's clinical data."
      icon={ShieldCheck}
      sections={sections}
    >
      <section id="infra" className="mb-16 scroll-mt-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Data Infrastructure</h2>
        <div className="grid md:grid-cols-2 gap-8">
           {[
             { title: "AES-256 Encryption", desc: "All sensitive health metadata and clinical notes encounter triple-layer encryption at rest.", icon: Lock },
             { title: "Point-to-Point SSL", desc: "Every API request and clinical documentation sync uses 2048-bit SSL certificates for transit security.", icon: Send },
             { title: "Immutable Registry", desc: "Patient records maintain audit-trail integrity—meaning every change is logged with a permanent timestamp.", icon: Database },
             { title: "Isolated Data Tents", desc: "Facility data is logically separated within our architecture to prevent cross-facility data leaks.", icon: Key }
           ].map((sec, idx) => (
             <div key={idx} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-slate-100 transition-all">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-teal-600 mb-6 border border-slate-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                   <sec.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{sec.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{sec.desc}</p>
             </div>
           ))}
        </div>
      </section>

      <section id="access" className="mb-12 scroll-mt-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">User Access Control</h2>
        <p className="text-slate-600 leading-relaxed mb-8 font-medium">
          We implement a rigid Role-Based Access Control (RBAC) model. Clinic owners define who can view PHI, who can edit clinical notes, and who manages the finances.
        </p>
        <div className="space-y-4">
           {['Facility Admin: Full Oversight', 'Clinician: Records & Encounter documentation', 'Accountant: Financial Hub & Invoicing'].map(role => (
             <div key={role} className="flex items-center gap-4 px-8 py-5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-700 font-bold tracking-tight">
                <div className="h-2 w-2 rounded-full bg-teal-500" />
                {role}
             </div>
           ))}
        </div>
      </section>

      <section id="backup" className="mb-12 scroll-mt-32">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Secure Backups</h2>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
          Our global infrastructure performs real-time data replication. In the rare event of a node disruption, your facility's clinical data has multiple redundancies to prevent any loss of patient history.
        </p>
      </section>

      <footer className="pt-12 border-t border-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
         LAST UPDATED: MARCH 27, 2026
      </footer>
    </LegalLayout>
  );
};

export default Security;
