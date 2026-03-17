import React from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  Activity, 
  Heart, 
  ShieldCheck,
  Sparkles 
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
      <h2 className="text-lg font-semibold uppercase tracking-tighter">{facility.printHeader || facility.name || 'HOSPITAL ERP'}</h2>
      <p className="text-[9px] uppercase font-medium text-slate-500">{facility.address || 'Kenyatta Ave, Nairobi, Kenya'}</p>
      <p className="text-[9px] font-medium">{facility.phone || '+254 700 000 000'}</p>
      {facility.taxId && <p className="text-[9px] font-medium">PIN: {facility.taxId}</p>}
    </div>

    <div className="space-y-1 mb-4">
      <div className="flex justify-between text-[10px] font-medium">
        <span>INV NO:</span>
        <span>{data.invoiceNo}</span>
      </div>
      <div className="flex justify-between text-[10px] font-medium">
        <span>DATE:</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
      <div className="flex justify-between text-[10px] font-medium">
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
      <div className="flex justify-between text-xs font-medium">
        <span>TOTAL DUE:</span>
        <span>${data.totalAmount?.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-[10px] font-medium">
        <span>MODE:</span>
        <span>{data.paymentMode || 'Cash'}</span>
      </div>
    </div>

    <div className="mt-8 text-center text-[8px] font-medium text-slate-400">
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
          <h1 className="text-2xl font-semibold tracking-tighter uppercase">{facility.printHeader || facility.name || 'CLINICAL VISIT SUMMARY'}</h1>
          <p className="text-slate-500 font-semibold uppercase tracking-widest text-[10px] mt-1">{facility.printSubHeader || facility.tagline || 'Official Medical Records Archive'}</p>
          <div className="mt-2 text-[9px] font-medium text-slate-400 space-y-0.5">
             <p>{facility.address}</p>
             <p>{facility.phone} • {facility.email}</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-xs">REF: {data.id?.toUpperCase()}</p>
        <p className="text-slate-400 text-[10px] font-medium">{new Date().toLocaleString()}</p>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-8 mb-12 bg-slate-50 p-6 rounded-2xl">
      <div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Patient Subject</p>
        <p className="font-medium text-base">{data.patientName}</p>
        <p className="text-xs font-medium text-slate-500">ID: {data.patientId}</p>
      </div>
      <div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Attending Clinician</p>
        <p className="font-medium text-base">{data.doctorName}</p>
        <p className="text-xs font-medium text-slate-500">{data.specialty}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Vital Baseline</p>
        <p className="font-medium text-xs">BP: {data.vitals?.bp} mmHg</p>
        <p className="font-medium text-xs">TEMP: {data.vitals?.temp} °C</p>
      </div>
    </div>

    <div className="space-y-8">
      <section>
        <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Subjective / History</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-700">{data.soap?.subjective || 'No history recorded.'}</p>
      </section>

      <section>
        <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Objective / Exam Findings</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-700">{data.soap?.objective || 'Routine physical examination performed.'}</p>
      </section>

      <section className="bg-slate-50 p-6 rounded-2xl">
        <h3 className="text-[10px] font-medium text-slate-900 uppercase tracking-[0.2em] border-b border-slate-200 pb-2 mb-4">Clinical Impression / Diagnosis</h3>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-medium text-xs">A</div>
          <div>
            <p className="font-medium text-base uppercase tracking-tight">{data.diagnosis || 'Diagnosis Pending'}</p>
            <p className="text-[10px] text-slate-500 font-medium">ICD-10 CLASSIFICATION</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Plan / Prescription</h3>
        <p className="text-sm font-medium leading-relaxed text-slate-700">{data.soap?.plan || 'Referral or follow-up as discussed.'}</p>
      </section>
    </div>

    <div className="mt-20 pt-12 border-t border-slate-100 flex justify-between items-end">
       <div className="space-y-4">
          <div className="h-12 w-48 border-b-2 border-slate-900"></div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Authorized Clinician Signature</p>
       </div>
       <div className="text-right opacity-30 select-none">
          <ShieldCheck className="h-16 w-16 text-slate-200" />
          <p className="text-[8px] font-semibold uppercase mt-1">Authentic Record</p>
       </div>
    </div>
  </div>
);

export const LabReport = ({ data, facility = {}, catalog = {} }) => (
  <div className="flex flex-col gap-12">
    <PrintStyles />
    <style>{`
      @media print {
        .page-break {
          page-break-after: always;
          height: 0;
          border: none;
        }
      }
    `}</style>

    {data.structuredResults?.map((test, idx) => {
      const schema = catalog[test.type];
      return (
        <div key={idx} className={`${idx < data.structuredResults.length - 1 ? 'page-break' : ''} max-w-4xl mx-auto p-8 bg-white text-slate-900 border border-slate-100 shadow-sm print-shadow min-h-[200mm] flex flex-col justify-between`}>
          <div>
            <div className="grid grid-cols-3 gap-8 mb-6 border-b-2 border-slate-900 pb-6">
              <div className="col-span-2 space-y-3 border-r border-slate-50 pr-8">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">Subject Information</p>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{data.patient}</h2>
                   <p className="text-xs font-bold text-slate-500 mt-2">ID: {data.patientId || 'OP-NEW'} • {data.gender || 'M/F'} • {data.age || 'N/A'}</p>
                </div>
                <div className="flex items-start gap-8 pt-1">
                   <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Attending Clinician</p>
                      <p className="font-bold text-[10px] uppercase">Dr. {data.provider || data.doctor || 'N/A'}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                      <p className="font-bold text-[10px] uppercase">{new Date(data.date).toLocaleDateString()}</p>
                   </div>
                </div>
              </div>
              <div className="flex flex-col justify-center pl-4">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Baseline Vitals</p>
                    <p className="text-[8px] font-black text-slate-900 uppercase">REF: {data.id?.substring(0, 8).toUpperCase()}</p>
                 </div>
                 <div className="flex justify-around items-center bg-slate-50 py-3 rounded-2xl border border-slate-100">
                    <div className="text-center">
                       <p className="text-[11px] font-black text-slate-900 leading-none">{data.vitals?.temperature || '---'} °C</p>
                       <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Temp</p>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <div className="text-center">
                       <p className="text-[11px] font-black text-slate-900 leading-none">{data.vitals?.bloodPressure || '---'}</p>
                       <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">BP</p>
                    </div>
                 </div>
                 <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-2 text-right">
                    Report {idx + 1}/{data.structuredResults.length} • {new Date(data.labCompletedAt || data.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 bg-slate-900 rounded-lg" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">{test.name}</h3>
                   <div className="flex-1 h-[1px] bg-slate-100" />
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{schema?.category || 'Clinical investigation'}</span>
                </div>
                
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-900/10 text-slate-400">
                      <th className="py-2 text-[9px] font-bold uppercase tracking-[0.1em]">Investigation Parameter</th>
                      <th className="py-2 text-[9px] font-bold uppercase tracking-[0.1em] text-center">Result</th>
                      <th className="py-2 text-[9px] font-bold uppercase tracking-[0.1em] text-center">Ref. Range</th>
                      <th className="py-2 text-[9px] font-bold uppercase tracking-[0.1em] text-right pr-4">Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {schema?.fields.map(field => {
                      const val = parseFloat(test.values?.[field.id]);
                      const refParts = field.ref.split('-');
                      let isAbnormal = false;
                      if (refParts.length === 2 && !isNaN(val)) {
                        const min = parseFloat(refParts[0]);
                        const max = parseFloat(refParts[1]);
                        if (val < min || val > max) isAbnormal = true;
                      }
                      return (
                        <tr key={field.id} className={isAbnormal ? 'bg-red-50/20' : ''}>
                          <td className="py-2.5 text-[12px] font-bold text-slate-700">{field.label}</td>
                          <td className={`py-4 text-[14px] font-black text-center ${isAbnormal ? 'text-red-600' : 'text-slate-900'}`}>
                            {test.values?.[field.id] || '---'} {isAbnormal && <span className="text-[10px] ml-1">(!H/L)</span>}
                          </td>
                          <td className="py-4 text-[11px] font-bold text-slate-400 text-center">{field.ref}</td>
                          <td className="py-4 text-[11px] font-bold text-slate-500 text-right uppercase px-4">{field.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {test.remarks && (
                <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4 border border-slate-100 mt-12 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Sparkles className="h-12 w-12" />
                   </div>
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                     Authorized Clinical Interpretation
                   </h4>
                   <p className="text-[13px] font-medium leading-relaxed text-slate-600 italic">
                      {test.remarks}
                   </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 flex justify-between items-end border-t-2 border-slate-100 italic mt-auto">
             <div className="flex flex-col gap-6">
                <div className="space-y-4">
                   <div className="h-14 w-64 border-b-2 border-slate-900 flex items-center px-4">
                      <p className="text-xs font-black text-slate-900 tracking-tighter uppercase italic">{data.labTechnicianName || 'LABORATORY TECHNICIAN'}</p>
                   </div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4">Verified Match Digital Signature</p>
                </div>
                <div className="text-[9px] font-medium text-slate-300 max-w-sm leading-relaxed uppercase px-4 not-italic">
                   Disclaimer: This report is for clinical correlation by the attending physician. 
                   Laboratory findings should be interpreted alongside physical symptoms.
                </div>
             </div>
             <div className="text-right space-y-2 pb-2">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] leading-none px-1">Authenticated Diagnostics Archive</p>
                <div className="flex items-center justify-end gap-2">
                   <ShieldCheck className="h-4 w-4 text-emerald-500" />
                   <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">HURA CARE PLATFORM v2.0</p>
                </div>
             </div>
          </div>
        </div>
      );
    })}

  </div>
);
