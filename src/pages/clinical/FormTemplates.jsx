import React from 'react';
import { Stethoscope } from 'lucide-react';

const HospitalHeader = ({ hospitalName = "JR Smart ERP Clinic", date }) => (
  <div className="flex justify-between border-b-2 border-slate-800 pb-6 mb-8 text-slate-900 print:border-black print:text-black">
    <div className="flex items-center gap-4">
       <Stethoscope className="h-10 w-10 text-primary-600 print:text-black" />
       <div>
         <h1 className="text-2xl font-bold uppercase tracking-wide">{hospitalName}</h1>
         <p className="text-sm font-medium text-slate-500 print:text-gray-700">123 Healthway Ave • Medical City, MED 11029</p>
         <p className="text-sm font-medium text-slate-500 print:text-gray-700">Phone: +1 800 555-0199 • Email: clinical@jrmedical.com</p>
       </div>
    </div>
    <div className="text-right">
       <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 print:text-gray-500">Date Printed</p>
       <p className="text-lg font-bold">{date || new Date().toLocaleDateString()}</p>
    </div>
  </div>
);

const PatientInfoBar = ({ patient }) => {
  if (!patient) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-8 print:bg-transparent print:border-black print:rounded-none">
       <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-gray-500">Patient Name</span>
          <p className="font-semibold text-slate-900 print:text-black">{patient.name}</p>
       </div>
       <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-gray-500">Patient ID / MRN</span>
          <p className="font-semibold text-slate-900 print:text-black">{patient.id || 'N/A'}</p>
       </div>
       <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-gray-500">Age / Gender</span>
          <p className="font-semibold text-slate-900 print:text-black">{patient.age || '--'} / {patient.gender || 'Unspecified'}</p>
       </div>
       <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-gray-500">Contact</span>
          <p className="font-semibold text-slate-900 print:text-black">{patient.mobile || patient.contact || 'N/A'}</p>
       </div>
    </div>
  );
};

export const ConsentFormTemplate = ({ patient, doctor, hospitalName }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-2xl print:shadow-none print:p-0">
     <HospitalHeader hospitalName={hospitalName} />
     <h2 className="text-xl font-bold uppercase tracking-widest text-center mb-8 border-b pb-4 print:border-black">Informed Consent for Medical/Surgical Treatment</h2>
     <PatientInfoBar patient={patient} />
     
     <div className="space-y-6 text-sm leading-relaxed text-slate-700 print:text-black font-medium text-justify">
        <p>I, the undersigned, hereby authorize Dr. <span className="font-bold underline">{doctor?.name || '______________________'}</span> and such assistants as may be selected by him/her to treat my condition.</p>
        <p>I understand that the following procedure(s) or treatment(s) have been planned: </p>
        <div className="h-20 border-b border-dashed border-slate-400 print:border-black w-full my-4"></div>
        <p>I acknowledge that no guarantees or assurances have been made to me concerning the results of the treatment/procedure. I understand the potential risks, complications, and side effects associated with this treatment, which have been fully explained to me by my physician.</p>
        <p>I have had the opportunity to ask questions, and all of my questions have been answered to my satisfaction.</p>
     </div>

     <div className="mt-20 grid grid-cols-2 gap-12">
        <div className="space-y-2">
            <div className="border-b border-black"></div>
            <p className="font-semibold text-xs uppercase tracking-widest">Patient / Guardian Signature</p>
            <p className="text-xs text-slate-400 print:text-gray-500">Date: _______________</p>
        </div>
        <div className="space-y-2">
            <div className="border-b border-black"></div>
            <p className="font-semibold text-xs uppercase tracking-widest">Attending Physician Signature</p>
            <p className="text-xs text-slate-400 print:text-gray-500">Dr. {doctor?.name || ''}</p>
        </div>
     </div>
  </div>
);

export const AdmissionFormTemplate = ({ patient, doctor, hospitalName }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-2xl print:shadow-none print:p-0">
     <HospitalHeader hospitalName={hospitalName} />
     <h2 className="text-xl font-bold uppercase tracking-widest text-center mb-8 border-b pb-4 print:border-black">Inpatient Admission Request</h2>
     <PatientInfoBar patient={patient} />
     
     <div className="grid grid-cols-2 gap-8 text-sm font-medium border border-slate-200 print:border-black rounded-lg p-6 mb-8">
        <div><span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Admitting Physician:</span> Dr. {doctor?.name || '___________________'}</div>
        <div><span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Admitting Dept / Ward:</span> ___________________</div>
        <div><span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Provisional Diagnosis:</span> ___________________</div>
        <div><span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Priority:</span> [ ] Elective   [ ] Urgent   [ ] Emergency</div>
     </div>
     
     <div className="space-y-6 text-sm leading-relaxed text-slate-700 print:text-black font-medium">
        <div>
           <span className="font-bold text-slate-900 border-b pb-1">Primary Reason for Admission:</span>
           <div className="h-12 border-b border-dashed border-slate-300 print:border-black mt-2"></div>
           <div className="h-12 border-b border-dashed border-slate-300 print:border-black mt-2"></div>
        </div>
        <div>
           <span className="font-bold text-slate-900 border-b pb-1">Special Diet / Isolation Requirements:</span>
           <div className="h-12 border-b border-dashed border-slate-300 print:border-black mt-2"></div>
        </div>
     </div>

     <div className="mt-16 text-right">
        <div className="inline-block space-y-2 w-64 text-left">
            <div className="border-b border-black"></div>
            <p className="font-semibold text-xs uppercase tracking-widest">Physician Signature</p>
            <p className="text-xs text-slate-400 print:text-gray-500">Date: _________ Time: _________</p>
        </div>
     </div>
  </div>
);

export const DischargeSummaryTemplate = ({ patient, doctor, hospitalName }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-2xl print:shadow-none print:p-0">
     <HospitalHeader hospitalName={hospitalName} />
     <h2 className="text-xl font-bold uppercase tracking-widest text-center mb-8 border-b pb-4 print:border-black">Discharge Summary</h2>
     <PatientInfoBar patient={patient} />
     
     <div className="space-y-8 text-sm text-slate-800 print:text-black">
        <div>
           <h3 className="font-bold uppercase bg-slate-100 p-2 print:border print:bg-transparent">Admission Details</h3>
           <div className="p-4 grid grid-cols-2 gap-4 border border-slate-100 print:border-t-0 print:border-black">
              <p><span className="font-bold">Date of Admission:</span> ___________</p>
              <p><span className="font-bold">Date of Discharge:</span> ___________</p>
              <p className="col-span-2"><span className="font-bold">Final Diagnosis:</span> __________________________________________________</p>
           </div>
        </div>

        <div>
           <h3 className="font-bold uppercase bg-slate-100 p-2 print:border print:bg-transparent">Hospital Course & Clinical Summary</h3>
           <div className="p-4 border border-slate-100 min-h-[150px] print:border-t-0 print:border-black">
              (Document procedures, operations, progress, and key laboratory findings)
           </div>
        </div>

        <div>
           <h3 className="font-bold uppercase bg-slate-100 p-2 print:border print:bg-transparent">Discharge Disposition & Instructions</h3>
           <div className="p-4 border border-slate-100 min-h-[100px] print:border-t-0 print:border-black">
              <p className="mb-2"><span className="font-bold">Discharged To:</span> [ ] Home   [ ] Transfer Facility   [ ] AMA</p>
              <p><span className="font-bold">Medications / Diet / Activity:</span></p>
           </div>
        </div>
     </div>

     <div className="mt-12 text-right">
        <div className="inline-block space-y-2 w-64 text-left">
            <div className="border-b border-black"></div>
            <p className="font-semibold text-xs uppercase tracking-widest">Attending Physician</p>
            <p className="text-xs text-slate-400 print:text-gray-500">Dr. {doctor?.name || ''}</p>
        </div>
     </div>
  </div>
);

export const ReferralLetterTemplate = ({ patient, doctor, hospitalName }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto shadow-2xl print:shadow-none print:p-0 font-serif">
     <HospitalHeader hospitalName={hospitalName} />
     
     <div className="mb-8">
        <p className="font-bold">TO:</p>
        <p>Attn: Specialist / Accepting Provider</p>
        <p>Department of _________________</p>
        <p>________________ Hospital / Clinic</p>
     </div>
     
     <h2 className="text-lg font-bold uppercase underline mb-6">Re: Referral & Transfer of Care Request</h2>
     
     <PatientInfoBar patient={patient} />
     
     <div className="space-y-6 text-sm leading-relaxed text-slate-800 print:text-black">
        <p>Dear Colleague,</p>
        <p>I would be very grateful if you could see and evaluate the above-named patient who requires your specialized expertise.</p>
        
        <div className="pl-4 border-l-4 border-slate-300 print:border-black py-2 my-4">
            <span className="font-bold block mb-1">Reason for Referral / Brief Clinical History:</span>
            <div className="h-8 border-b border-dashed border-slate-300 print:border-black mt-2"></div>
            <div className="h-8 border-b border-dashed border-slate-300 print:border-black mt-2"></div>
            <div className="h-8 border-b border-dashed border-slate-300 print:border-black mt-2"></div>
        </div>

        <p>I have attached copies of recent laboratory results and diagnostic imaging reports for your review. Please do not hesitate to contact our clinic if further background information is required.</p>
        <p>Thank you for your assistance in the ongoing care of this patient.</p>
        <p>Sincerely,</p>
     </div>

     <div className="mt-16">
        <div className="inline-block space-y-2 w-64 text-left">
            <p className="font-bold text-lg signature-font text-blue-900 print:text-black">{doctor?.name || '_________________'}</p>
            <div className="border-b border-black"></div>
            <p className="font-semibold text-xs uppercase tracking-widest">Referring Physician</p>
            <p className="text-xs text-slate-500">{hospitalName}</p>
        </div>
     </div>
  </div>
);
