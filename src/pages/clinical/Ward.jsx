import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Bed, 
  DoorOpen, 
  UserPlus, 
  MoreVertical, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Heart,
  Plus,
  X,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import wardService from '../../services/wardService';
import patientService from '../../services/patientService';

export default function Ward() {
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [isAddingWard, setIsAddingWard] = useState(false);
  const [isAddingBed, setIsAddingBed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      setLoading(true);
      const data = await wardService.getAllWards();
      setWards(data);
      if (data.length > 0) {
        if (!selectedWard) {
          setSelectedWard(data[0]);
        } else {
          // Update selectedWard data if it already exists
          const updatedSelected = data.find(w => w.id === selectedWard.id);
          if (updatedSelected) setSelectedWard(updatedSelected);
        }
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
      setWards([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    let total = 0;
    let occupied = 0;
    let available = 0;
    let maintenance = 0;

    wards.forEach(w => {
      w.beds?.forEach(b => {
        total++;
        if (b.status === 'occupied') occupied++;
        else if (b.status === 'empty') available++;
        else maintenance++;
      });
    });

    return [
      { label: 'Total Beds', value: total, color: 'text-slate-900', bg: 'bg-slate-50' },
      { label: 'Occupied', value: occupied, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Available', value: available, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Under Maintenance', value: maintenance, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
  };

  const handleAdmission = async (data) => {
    await wardService.updateBedStatus(data.wardId, data.bedId, 'occupied', data);
    fetchWards();
    setIsAdmitting(false);
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-center font-bold text-slate-500">Mapping Units...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Ward Management</h1>
            <p className="text-slate-500 font-medium mt-1">Real-time bed occupancy and in-patient clinical tracking.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsAddingWard(true)}
              className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 border border-slate-200 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Plus className="h-5 w-5" />
              New Facility Unit
            </button>
            <button 
              onClick={() => setIsAdmitting(true)}
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
            >
              <UserPlus className="h-5 w-5" />
              Admit New Patient
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {calculateStats().map((stat, i) => (
             <motion.div 
               key={stat.label}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm"
             >
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
               <div className="flex items-end justify-between">
                  <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                  <div className={`h-10 w-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Activity className="h-5 w-5" />
                  </div>
               </div>
             </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Facility Units</h3>
              {wards.map(ward => (
                 <button
                   key={ward.id}
                   onClick={() => setSelectedWard(ward)}
                   className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-center justify-between group
                     ${selectedWard?.id === ward.id 
                       ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                       : 'bg-white border-slate-50 text-slate-600 hover:border-slate-200'}
                   `}
                 >
                   <div>
                     <p className="font-black text-sm uppercase tracking-tight">{ward.name}</p>
                     <p className={`text-[10px] font-bold ${selectedWard?.id === ward.id ? 'text-slate-400' : 'text-slate-400'}`}>
                        {ward.beds.length} Total Units
                     </p>
                   </div>
                   <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors
                     ${selectedWard?.id === ward.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                     <Layers className="h-4 w-4" />
                   </div>
                 </button>
              ))}
           </div>

           <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedWard?.name} Map</h2>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <div className="h-2 w-2 rounded-full bg-emerald-500" /> Available
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <div className="h-2 w-2 rounded-full bg-blue-500" /> Occupied
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {selectedWard?.beds.map((bed, i) => (
                   <motion.div
                     key={bed.id}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: i * 0.05 }}
                     className={`p-6 rounded-2xl border-2 transition-all relative group
                       ${bed.status === 'occupied' 
                         ? 'bg-white border-blue-100 shadow-md' 
                         : bed.status === 'empty' 
                         ? 'bg-white border-slate-50 hover:border-emerald-200' 
                         : 'bg-amber-50/30 border-amber-100'}
                     `}
                   >
                     <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl shadow-inner
                          ${bed.status === 'occupied' 
                            ? 'bg-blue-50 text-blue-600' 
                            : bed.status === 'empty' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-amber-50 text-amber-600'}
                        `}>
                           <Bed className="h-6 w-6" />
                        </div>
                        <button className="p-2 text-slate-300 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all">
                           <MoreVertical className="h-5 w-5" />
                        </button>
                     </div>

                     <div className="space-y-1">
                        <p className="font-black text-lg text-slate-900 tracking-tight">{bed.name}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest
                          ${bed.status === 'occupied' ? 'text-blue-500' : 'text-slate-400'}
                        `}>
                          {bed.status}
                        </p>
                     </div>

                     {bed.status === 'occupied' ? (
                       <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-[10px] text-slate-400">
                                {bed.patient?.split(' ').map(n => n[0]).join('') || 'PT'}
                             </div>
                             <div>
                                <p className="text-xs font-black text-slate-900">{bed.patient}</p>
                                <p className="text-[10px] font-bold text-slate-400">Since {bed.admittedAt}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                             <Stethoscope className="h-3 w-3 text-slate-400" />
                             <span className="text-[10px] font-bold text-slate-500">{bed.doctor || 'Attending Physician'}</span>
                          </div>
                           <div className="flex gap-2">
                             <button className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-bold">
                                Vitals
                             </button>
                             <button 
                                onClick={async () => {
                                   if(confirm(`Discharge ${bed.patient}?`)) {
                                      await wardService.dischargePatient(selectedWard.id, bed.id);
                                      fetchWards();
                                   }
                                }}
                                className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all font-bold">
                                Discharge
                             </button>
                          </div>
                       </div>
                     ) : (
                       <div className="mt-8">
                          <button 
                            disabled={bed.status === 'cleaning'}
                            onClick={() => {
                               // Open admission with pre-selected bed
                               setIsAdmitting({ wardId: selectedWard.id, bedId: bed.id });
                            }}
                            className="w-full py-4 border-2 border-dashed border-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all disabled:opacity-50"
                          >
                            {bed.status === 'cleaning' ? 'Sanitization...' : 'Assign Subject'}
                          </button>
                       </div>
                     )}
                   </motion.div>
                 ))}
                                  {selectedWard && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setIsAddingBed(selectedWard.id)}
                      className="p-8 border-4 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-300 hover:bg-slate-50 hover:border-slate-200 transition-all"
                    >
                      <Plus className="h-10 w-10" />
                      <span className="font-black text-xs uppercase tracking-widest">Expansion Slot</span>
                    </motion.button>
                  )}
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
          {isAdmitting && (
             <AdmissionModal 
                 preSelect={typeof isAdmitting === 'object' ? isAdmitting : null} 
                 onClose={() => setIsAdmitting(false)} 
                 onSave={handleAdmission} 
             />
          )}
          {isAddingWard && (
            <NewWardModal 
              onClose={() => setIsAddingWard(false)}
              onSave={async (name) => {
                await wardService.createWard(name);
                fetchWards();
                setIsAddingWard(false);
              }}
            />
          )}
          {isAddingBed && (
            <NewBedModal 
              wardId={isAddingBed}
              onClose={() => setIsAddingBed(false)}
              onSave={async (wardId, name) => {
                await wardService.addBedToWard(wardId, name);
                fetchWards();
                setIsAddingBed(false);
              }}
            />
          )}
       </AnimatePresence>
    </DashboardLayout>
  );
}

function AdmissionModal({ preSelect, onClose, onSave }) {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [formData, setFormData] = useState({
        patientId: '',
        doctor: '',
        reason: '',
        wardId: preSelect?.wardId || '',
        bedId: preSelect?.bedId || ''
    });

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        const [patientsData, users] = await Promise.all([
            patientService.getAllPatients(),
            // Assuming we fetch all doctors
            Promise.resolve([{ name: 'Dr. Dolly Smith' }, { name: 'Dr. John Doe' }])
        ]);
        setPatients(patientsData);
        setDoctors(users);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const patient = patients.find(p => p.id === formData.patientId);
        onSave({ 
            ...formData, 
            name: patient?.name || 'Selected Patient',
            patientId: formData.patientId || null,
            doctor: formData.doctor || null,
            admittedAt: formData.admittedAt || new Date().toISOString().split('T')[0]
        });
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white"
        >
          <div className="p-10 border-b border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-5">
                <div className="h-14 w-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl">
                   <UserPlus className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Patient Admission</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">In-Patient Protocol Entry</p>
                </div>
             </div>
             <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
               <X className="h-6 w-6" />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="p-12 space-y-8">
             <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Select Registered Patient</label>
               <select 
                 required
                 value={formData.patientId}
                 onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                 className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-bold outline-none appearance-none"
               >
                  <option value="">Search patient directory...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
               </select>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Attending Physician</label>
                  <select 
                     required
                     value={formData.doctor}
                     onChange={(e) => setFormData({...formData, doctor: e.target.value})}
                     className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-bold outline-none appearance-none"
                  >
                     <option value="">Select Doctor...</option>
                     {doctors.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Admission Date</label>
                  <input 
                    type="date"
                    value={formData.admittedAt || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({...formData, admittedAt: e.target.value})}
                    className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-bold outline-none"
                  />
                </div>
             </div>

             <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Admission Indications / Reason</label>
               <textarea 
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-2xl text-sm font-bold outline-none min-h-[120px] resize-none"
                  placeholder="Clinical reasons for admission..."
               />
             </div>

             <div className="flex gap-4 pt-6">
               <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Abort</button>
               <button type="submit" className="flex-1 px-8 py-5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200">Confirm Admission</button>
             </div>
          </form>
        </motion.div>
      </motion.div>
   );
}


function NewWardModal({ onClose, onSave }) {
    const [name, setName] = useState('');
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between font-black">
            <span>New Ward/Facility Unit</span>
            <button onClick={onClose}><X className="h-5 w-5" /></button>
          </div>
          <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(name); }}>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400">Ward Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. ICU, General Ward, Emergency" className="w-full p-4 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:bg-white focus:border-slate-100 font-bold" />
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest">Create Unit</button>
          </form>
        </motion.div>
      </motion.div>
    );
}

function NewBedModal({ wardId, onClose, onSave }) {
    const [name, setName] = useState('');
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between font-black">
            <span>New Bed / Expansion Slot</span>
            <button onClick={onClose}><X className="h-5 w-5" /></button>
          </div>
          <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(wardId, name); }}>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400">Bed Identification</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Bed 101, Unit B" className="w-full p-4 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:bg-white focus:border-slate-100 font-bold" />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest">Add Expansion</button>
          </form>
        </motion.div>
      </motion.div>
    );
}
