import React from 'react';
import LegalLayout from './LegalLayout';

const Terms = () => {
  const sections = [
    { id: 'acceptance', label: '1. Acceptance' },
    { id: 'description', label: '2. Service Description' },
    { id: 'eligibility', label: '3. Eligibility' },
    { id: 'facility', label: '4. Facility Duties' },
    { id: 'ownership', label: '5. Data Ownership' },
    { id: 'billing', label: '6. Billing & Payments' },
    { id: 'availability', label: '7. Availability' },
    { id: 'termination', label: '8. Termination' },
    { id: 'liability', label: '9. Liability' },
    { id: 'law', label: '11. Governing Law' },
    { id: 'contact', label: '12. Contact' }
  ];

  return (
    <LegalLayout 
      title="Terms of Service" 
      subtitle="Last updated: April 09, 2026"
      sections={sections}
    >
      <div className="space-y-12 text-slate-700">
        <section id="acceptance" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing or using HURE Care (“the Service”), you agree to these Terms of Service.
            If you do not agree, you should not use the Service.
            These Terms apply to all users accessing the platform on behalf of a healthcare facility.
          </p>
        </section>

        <section id="description" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. Description of the Service</h2>
          <p className="mb-4">HURE Care is a healthcare operations and patient management platform designed to support:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Appointment scheduling</li>
            <li>Patient records and visit documentation</li>
            <li>Clinical workflows</li>
            <li>Billing and payment tracking</li>
          </ul>
          <p className="mt-4 font-semibold text-slate-900">HURE Care provides software tools only and does not:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Deliver medical care or clinical services</li>
            <li>Replace professional medical judgment</li>
            <li>Provide medical, legal, or financial advice</li>
          </ul>
        </section>

        <section id="eligibility" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. User Eligibility and Accounts</h2>
          <p className="mb-4">Users must be authorized by their healthcare facility.</p>
          <p>You are responsible for:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Maintaining account security</li>
            <li>All activity conducted under your login</li>
          </ul>
        </section>

        <section id="facility" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Facility Responsibilities</h2>
          <p className="mb-4">Healthcare facilities using HURE Care agree to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Enter accurate and lawful patient information</li>
            <li>Maintain patient confidentiality</li>
            <li>Comply with applicable healthcare and data protection laws</li>
            <li>Ensure proper use of the platform by staff</li>
          </ul>
        </section>

        <section id="ownership" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">5. Patient Data and Ownership</h2>
          <p className="leading-relaxed">
            All patient data entered into HURE Care remains the property of the healthcare facility.
            By using the Service, the facility grants HURE Care permission to process this data solely to provide platform functionality.
            HURE Care does not claim ownership of patient data.
          </p>
        </section>

        <section id="billing" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">6. Billing and Payments</h2>
          <p className="mb-4">HURE Care supports billing and payment tracking within the platform. Facilities are responsible for:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Setting fees and charges</li>
            <li>Managing payments and financial records</li>
            <li>Ensuring compliance with applicable financial regulations</li>
          </ul>
        </section>

        <section id="availability" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">7. Service Availability</h2>
          <p className="leading-relaxed">
            We aim to provide reliable access but do not guarantee uninterrupted service.
            Downtime may occur due to maintenance, updates, or technical issues.
          </p>
        </section>

        <section id="termination" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">8. Suspension and Termination</h2>
          <p className="mb-4">We may suspend or terminate access if:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>These Terms are violated</li>
            <li>The Service is misused</li>
            <li>Payment obligations are not met</li>
          </ul>
          <p className="mt-4">Facilities may request termination at any time.</p>
        </section>

        <section id="liability" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">9. Limitation of Liability</h2>
          <p className="mb-4">To the maximum extent permitted by law:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>HURE Care is provided “as is” and “as available”</li>
            <li>We are not liable for indirect or consequential damages</li>
            <li>We are not responsible for clinical decisions made using the platform</li>
          </ul>
        </section>

        <section id="terms" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">10. Changes to Terms</h2>
          <p className="leading-relaxed">
            We may update these Terms periodically. Continued use of the Service means acceptance of updates.
          </p>
        </section>

        <section id="law" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">11. Governing Law</h2>
          <p className="leading-relaxed">
            These Terms are governed by the laws of the Republic of Kenya.
          </p>
        </section>

        <section id="contact" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-slate-900 mb-4">12. Contact Information</h2>
          <p className="leading-relaxed">
            For questions about this Privacy Policy or data handling, contact us at: <a href="mailto:info@gethure.com" className="text-teal-600 hover:underline">info@gethure.com</a>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};

export default Terms;
