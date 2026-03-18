import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  XCircle, 
  Thermometer, 
  Heart, 
  Activity, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  ArrowUpRight, 
  Zap 
} from 'lucide-react';

export default function TriageModal({ appointment, onClose, onSave }) {
  const [vitals, setVitals] = useState({
    temp: '',
    bp_sys: '',
    bp_dia: '',
    heart_rate: '',
    resp_rate: '',
    spo2: '',
    weight: '',
    height: '',
    rbs: '',
    complaint: ''
  });

  const [bmi, setBmi] = useState(null);

  useEffect(() => {
    if (vitals.weight && vitals.height) {
      const h_m = vitals.height / 100;
      const res = (vitals.weight / (h_m * h_m)).toFixed(1);
      setBmi(res);
    }
  }, [vitals.weight, vitals.height]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...vitals, bmi });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Thermometer className="h-7 w-7" />
             </div>
             <div>
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Client Record</h3>
               <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em] mt-0.5">Vitals Collection: {appointment?.patient} • Token: T-{appointment?.tokenNumber}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <TriageField label="Temp (°C)" value={vitals.temp} onChange={(val) => setVitals({...vitals, temp: val})} icon={<Thermometer className="h-4 w-4" />} placeholder="36.5" />
            <TriageField label="BP Systolic" value={vitals.bp_sys} onChange={(val) => setVitals({...vitals, bp_sys: val})} icon={<Heart className="h-4 w-4" />} placeholder="120" />
            <TriageField label="BP Diastolic" value={vitals.bp_dia} onChange={(val) => setVitals({...vitals, bp_dia: val})} icon={<Heart className="h-4 w-4 text-emerald-500" />} placeholder="80" />
            <TriageField label="Heart Rate (BPM)" value={vitals.heart_rate} onChange={(val) => setVitals({...vitals, heart_rate: val})} icon={<Activity className="h-4 w-4" />} placeholder="72" />
            <TriageField label="RR (per min)" value={vitals.resp_rate} onChange={(val) => setVitals({...vitals, resp_rate: val})} icon={<Clock className="h-4 w-4" />} placeholder="16" />
            <TriageField label="SpO2 (%)" value={vitals.spo2} onChange={(val) => setVitals({...vitals, spo2: val})} icon={<CheckCircle2 className="h-4 w-4" />} placeholder="98" />
            <TriageField label="Weight (kg)" value={vitals.weight} onChange={(val) => setVitals({...vitals, weight: val})} icon={<BarChart3 className="h-4 w-4" />} placeholder="70" />
            <TriageField label="Height (cm)" value={vitals.height} onChange={(val) => setVitals({...vitals, height: val})} icon={<ArrowUpRight className="h-4 w-4" />} placeholder="175" />
            <TriageField label="RBS (mmol/L)" value={vitals.rbs} onChange={(val) => setVitals({...vitals, rbs: val})} icon={<Zap className="h-4 w-4" />} placeholder="5.4" />
          </div>

          <div className="flex gap-4">
            <div className={`p-4 rounded-2xl flex-1 flex flex-col justify-center items-center ${bmi ? 'bg-primary-50 border border-primary-100' : 'bg-slate-50'}`}>
               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Calculated BMI</p>
               <p className="text-2xl font-semibold text-primary-600">{bmi || '--'}</p>
            </div>
            <div className="flex-[2] space-y-2">
               <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Patient's Chief Complaint</label>
               <textarea 
                 value={vitals.complaint}
                 onChange={(e) => setVitals({...vitals, complaint: e.target.value})}
                 className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-100 rounded-2xl text-xs font-medium outline-none resize-none h-20 shadow-inner"
                 placeholder="Briefly describe patient's reason for visit..."
               />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
             <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-500 font-medium rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Discard</button>
             <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-medium rounded-2xl text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">Submit Vitals</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function TriageField({ label, value, onChange, icon, placeholder, type = "text" }) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-1.5">
         {icon} {label}
       </label>
       <input 
         type={type}
         placeholder={placeholder}
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className="w-full p-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-200 rounded-2xl text-sm font-medium shadow-inner outline-none transition-all"
       />
    </div>
  );
}
