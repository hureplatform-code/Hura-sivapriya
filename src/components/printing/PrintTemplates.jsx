import React from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  Activity, 
  Heart, 
  ShieldCheck 
} from 'lucide-react';

export const PrintStyles = () => (
  <style>{`
    @media print {
      @page {
        margin: 10mm;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        background: white !important;
      }
      .no-print {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      .print-shadow {
        box-shadow: none !important;
        border: 1px solid #eee !important;
      }
      .invoice-slip {
        width: 80mm;
        margin: 0 auto;
        font-family: 'Courier New', Courier, monospace;
      }
    }
    .print-only {
      display: none;
    }
  `}</style>
);

export const InvoiceSlip = ({ data, facility = {} }) => (
  <div className="invoice-slip p-4 bg-white text-slate-900">
    <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
      {facility.logoUrl && (
        <img src={facility.logoUrl} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
      )}
      <h2 className="text-lg font-black uppercase tracking-tighter">{facility.printHeader || facility.name || 'HOSPITAL ERP'}</h2>
      <p className="text-[9px] uppercase font-bold text-slate-500">{facility.address || 'Kenyatta Ave, Nairobi, Kenya'}</p>
      <p className="text-[9px] font-bold">{facility.phone || '+254 700 000 000'}</p>
      {facility.taxId && <p className="text-[9px] font-bold">PIN: {facility.taxId}</p>}
    </div>

    <div className="space-y-1 mb-4">
      <div className="flex justify-between text-[10px] font-bold">
        <span>INV NO:</span>
        <span>{data.invoiceNo}</span>
      </div>
      <div className="flex justify-between text-[10px] font-bold">
        <span>DATE:</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
      <div className="flex justify-between text-[10px] font-bold">
        <span>PATIENT:</span>
        <span className="truncate max-w-[50px]">{data.patientName}</span>
      </div>
    </div>

    <table className="w-full text-[10px] mb-4">
      <thead className="border-b border-dashed border-slate-300">
        <tr className="text-left">
          <th className="py-2">ITEM</th>
          <th className="py-2 text-right">AMT</th>
        </tr>
      </thead>
      <tbody>
        {data.items?.map((item, i) => (
          <tr key={i}>
            <td className="py-1 uppercase">{item.description} x{item.quantity}</td>
            <td className="py-1 text-right">${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="border-t-2 border-dashed border-slate-300 pt-4 space-y-1">
      <div className="flex justify-between text-xs font-black">
        <span>TOTAL DUE:</span>
        <span>${data.totalAmount?.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-[10px] font-bold">
        <span>MODE:</span>
        <span>{data.paymentMode || 'Cash'}</span>
      </div>
    </div>

    <div className="mt-8 text-center text-[8px] font-bold text-slate-400">
      <p>THANK YOU FOR CHOOSING OUR FACILITY</p>
      <p>QUICK RECOVERY TO THE PATIENT</p>
      <div className="mt-4 border-t border-slate-100 pt-2 italic">
        Powered by Hospital ERP v2.0
      </div>
    </div>
  </div>
);

export const ClinicalSummary = ({ data, facility = {} }) => (
  <div className="max-w-4xl mx-auto p-12 bg-white text-slate-900 border border-slate-100 shadow-sm print-shadow">
    <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
      <div className="flex items-center gap-6">
        {facility.logoUrl && (
          <img src={facility.logoUrl} alt="Logo" className="h-20 w-20 object-contain" />
        )}
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">{facility.printHeader || facility.name || 'CLINICAL VISIT SUMMARY'}</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">{facility.printSubHeader || facility.tagline || 'Official Medical Records Archive'}</p>
          <div className="mt-2 text-[9px] font-bold text-slate-400 space-y-0.5">
             <p>{facility.address}</p>
             <p>{facility.phone} • {facility.email}</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-black text-xs">REF: {data.id?.toUpperCase()}</p>
        <p className="text-slate-400 text-[10px] font-bold">{new Date().toLocaleString()}</p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-8 mb-12 bg-slate-50 p-6 rounded-2xl">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Subject</p>
        <p className="font-black text-base">{data.patientName}</p>
        <p className="text-xs font-bold text-slate-500">ID: {data.patientId}</p>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attending Clinician</p>
        <p className="font-black text-base">{data.doctorName}</p>
        <p className="text-xs font-bold text-slate-500">{data.specialty}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vital Baseline</p>
        <p className="font-black text-xs">BP: {data.vitals?.bp} mmHg</p>
        <p className="font-black text-xs">TEMP: {data.vitals?.temp} °C</p>
      </div>
    </div>

    <div className="space-y-8">
      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Subjective / History</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-700">{data.soap?.subjective || 'No history recorded.'}</p>
      </section>

      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Objective / Exam Findings</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-700">{data.soap?.objective || 'Routine physical examination performed.'}</p>
      </section>

      <section className="bg-slate-50 p-6 rounded-2xl">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-200 pb-2 mb-4">Clinical Impression / Diagnosis</h3>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">A</div>
          <div>
            <p className="font-black text-base uppercase tracking-tight">{data.diagnosis || 'Diagnosis Pending'}</p>
            <p className="text-[10px] text-slate-500 font-bold">ICD-10 CLASSIFICATION</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Plan / Prescription</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-700">{data.soap?.plan || 'Referral or follow-up as discussed.'}</p>
      </section>
    </div>

    <div className="mt-20 pt-12 border-t border-slate-100 flex justify-between items-end">
       <div className="space-y-4">
          <div className="h-12 w-48 border-b-2 border-slate-900"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Clinician Signature</p>
       </div>
       <div className="text-right opacity-30 select-none">
          <ShieldCheck className="h-16 w-16 text-slate-200" />
          <p className="text-[8px] font-black uppercase mt-1">Authentic Record</p>
       </div>
    </div>
  </div>
);
