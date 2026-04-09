import React from 'react';
import LegalLayout from './LegalLayout';

const Privacy = () => {
  const sections = [
    { id: 'intro', label: 'Intro' },
    { id: 'collection', label: '1. Collection' },
    { id: 'usage', label: '2. Usage' },
    { id: 'responsibility', label: '3. Responsibility' },
    { id: 'security', label: '4. Security' },
    { id: 'control', label: '5. Access' },
    { id: 'retention', label: '6. Retention' },
    { id: 'crossborder', label: '7. Processing' },
    { id: 'updates', label: '8. Updates' },
    { id: 'contact', label: '9. Contact' }
  ];

  return (
    <LegalLayout 
      title="Privacy Policy" 
      subtitle="Last updated: April 09, 2026"
      sections={sections}
    >
      <div className="space-y-12 text-slate-700">
        <section id="intro" className="scroll-mt-24">
          <p className="leading-relaxed">
            HURE Care (“the Service”) is committed to protecting personal and health-related data and handling it in accordance with applicable data protection laws, including the <span className="font-bold">Data Protection Act, 2019 (Kenya)</span>.
          </p>
        </section>

        <section id="collection" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
          <p className="mb-4">HURE Care collects information necessary to support healthcare facility operations and patient care. This may include:</p>
          
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 mb-2">Patient Information</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Names and identifiers</li>
              <li>Contact details (e.g., phone number)</li>
              <li>Appointment and visit records</li>
              <li>Clinical notes and documentation entered by providers</li>
              <li>Billing and payment-related information</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-2">Facility & Staff Information</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Staff names, roles, and permissions</li>
              <li>Appointment scheduling data</li>
              <li>Activity related to patient care workflows</li>
            </ul>
          </div>
        </section>

        <section id="usage" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. How We Use Information</h2>
          <p className="mb-4">We use collected data strictly to support healthcare facility operations, including:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Managing patient appointments and visit workflows</li>
            <li>Recording and maintaining patient clinical documentation</li>
            <li>Supporting billing, payments, and account balances</li>
            <li>Improving operational efficiency within the facility</li>
          </ul>
          <p className="mt-4 font-semibold text-slate-900">
            HURE Care does not sell or use patient data for advertising or marketing purposes.
          </p>
        </section>

        <section id="responsibility" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. Data Responsibility</h2>
          <p className="leading-relaxed mb-4">
            Healthcare facilities using HURE Care are the data controllers of patient information.
            HURE Care acts as a data processor, handling data only as instructed by the facility and for the purpose of providing the Service.
          </p>
          <p className="mb-4">Facilities are responsible for:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ensuring lawful collection of patient data</li>
            <li>Obtaining any required patient consent</li>
            <li>Using the platform in compliance with applicable regulations</li>
          </ul>
        </section>

        <section id="security" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Data Security</h2>
          <p className="mb-4">We implement reasonable technical and organizational measures to protect data, including:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Role-based access controls</li>
            <li>Secure authentication and user permissions</li>
            <li>Logical separation of facility data</li>
            <li>Encryption and secure data storage practices</li>
          </ul>
          <p className="mt-4">
            While no system is completely secure, we continuously work to safeguard data against unauthorized access, loss, or misuse.
          </p>
        </section>

        <section id="control" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">5. Data Access and Control</h2>
          <p className="leading-relaxed">
            Healthcare facilities and authorized users can access and update patient records, correct or modify information, and manage user permissions.
            Patients should direct any data-related requests to the healthcare facility where they received care.
          </p>
        </section>

        <section id="retention" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">6. Data Retention</h2>
          <p className="leading-relaxed">
            Data is retained for as long as necessary to provide the Service and comply with applicable legal and regulatory requirements.
            Facilities are responsible for determining appropriate data retention policies.
          </p>
        </section>

        <section id="crossborder" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">7. Cross-Border Data Processing</h2>
          <p className="leading-relaxed">
            Data may be stored or processed on secure servers outside Kenya, provided appropriate safeguards are in place.
          </p>
        </section>

        <section id="updates" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">8. Policy Updates</h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy from time to time. Updates will be posted with a revised effective date.
          </p>
        </section>

        <section id="contact" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">9. Contact Us</h2>
          <p className="leading-relaxed">
            For questions about this Privacy Policy or data handling, contact us at: <a href="mailto:info@gethure.com" className="text-teal-600 hover:underline">info@gethure.com</a>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Privacy;
