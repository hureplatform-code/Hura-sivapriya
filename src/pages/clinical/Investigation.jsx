import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Beaker, 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  FileText,
  X,
  Upload,
  User,
  Activity,
  Calendar,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import investigationService from '../../services/investigationService';
import patientService from '../../services/patientService';

export default function Investigation() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const data = await investigationService.getAllInvestigations();
      setInvestigations(data || []);
    } catch (error) {
      console.error('Error fetching investigations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (inv) => {
    if (window.confirm(`Are you sure you want to CANCEL investigation request ${inv.id}?`)) {
      setNotification({ type: 'success', message: `Investigation ${inv.id} has been cancelled.` });
      setTimeout(() => setNotification(null), 3000);
      fetchInvestigations();
    }
  };

  const handleDeleteRequest = (id) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY delete this record?`)) {
      setNotification({ type: 'success', message: `Record deleted.` });
      setTimeout(() => setNotification(null), 3000);
      fetchInvestigations();
    }
  };

  const filteredInvestigations = investigations.filter(inv => 
    inv.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.testName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Diagnostics Hub</h1>
            <p className="text-slate-500 mt-1">Laboratory and Imaging results management system.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            New Investigation Request
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by Patient, ID or Test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm font-bold transition-all outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-bold text-sm">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Request Detail</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Patient Info</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Category</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Priority</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   <tr>
                     <td colSpan="6" className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Analyzing diagnostic baseline...</td>
                   </tr>
                ) : filteredInvestigations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No records found.</td>
                  </tr>
                ) : filteredInvestigations.map((inv, i) => (
                  <motion.tr 
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-5 px-4">
                      <div>
                        <p className="font-black text-slate-900 text-sm">#{inv.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight mt-0.5">{inv.testName}</p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                          {inv.patientName?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <p className="text-sm font-bold text-slate-900">{inv.patientName}</p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${inv.category === 'Laboratory' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}
                      `}>
                        {inv.category === 'Laboratory' ? <FlaskConical className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {inv.category}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                         ${inv.priority === 'Emergency (STAT)' ? 'bg-red-50 text-red-600' : 
                           inv.priority === 'Urgent' ? 'bg-amber-50 text-amber-600' : 
                           'bg-slate-50 text-slate-400'}
                       `}>
                         {inv.priority || 'Normal'}
                       </span>
                    </td>
                    <td className="py-5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${inv.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                          inv.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                          'bg-indigo-50 text-indigo-600'}
                      `}>
                        {inv.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : 
                         inv.status === 'pending' ? <Clock className="h-3 w-3" /> : 
                         <AlertCircle className="h-3 w-3" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inv.status === 'completed' ? (
                          <>
                            {inv.resultFile && (
                              <button 
                                onClick={() => window.open(inv.resultFile, '_blank')}
                                className="p-2.5 text-emerald-500 hover:text-emerald-600 bg-emerald-50 rounded-xl"
                              >
                                <Eye className="h-4.5 w-4.5" />
                              </button>
                            )}
                            <button className="p-2.5 text-slate-400 hover:text-primary-600 bg-white rounded-lg shadow-sm border border-slate-100">
                              <Download className="h-4.5 w-4.5" />
                            </button>
                          </>
                        ) : (
                          <button 
                             onClick={() => setUpdatingId(inv.id)}
                             className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg shadow-slate-200"
                          >
                            Update Result
                          </button>
                        )}
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenu(activeMenu === inv.id ? null : inv.id)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-white transition-all shadow-sm"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>
                          
                          <AnimatePresence>
                            {activeMenu === inv.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActiveMenu(null)}
                                ></div>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20"
                                >
                                  <button 
                                    onClick={() => { setUpdatingId(inv.id); setActiveMenu(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                  >
                                    <Activity className="h-4 w-4" />
                                    Update Result
                                  </button>
                                  <button 
                                    onClick={() => { setActiveMenu(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                  >
                                    <FileText className="h-4 w-4" />
                                    View Details
                                  </button>
                                  <div className="h-px bg-slate-50 my-1"></div>
                                  <button 
                                    onClick={() => { handleCancelRequest(inv); setActiveMenu(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 transition-colors"
                                  >
                                    <Clock className="h-4 w-4" />
                                    Cancel Request
                                  </button>
                                  <button 
                                    onClick={() => { handleDeleteRequest(inv.id); setActiveMenu(null); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <X className="h-4 w-4" />
                                    Delete Record
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <InvestigationModal 
            onClose={() => setIsAdding(false)} 
            onSave={() => { 
                setIsAdding(false); 
                fetchInvestigations(); 
                setNotification({ type: 'success', message: 'Investigation requested successfully.' });
                setTimeout(() => setNotification(null), 3000);
            }} 
          />
        )}
        {updatingId && (
          <ResultUpdateModal 
            investigationId={updatingId} 
            onClose={() => setUpdatingId(null)}
            onSave={() => { 
                setUpdatingId(null); 
                fetchInvestigations(); 
                setNotification({ type: 'success', message: 'Result updated successfully.' });
                setTimeout(() => setNotification(null), 3000);
            }}
            onError={(msg) => {
                setNotification({ type: 'error', message: msg });
                setTimeout(() => setNotification(null), 3000);
            }}
          />
        )}
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
             <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
             </div>
             {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function InvestigationModal({ onClose, onSave }) {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    testName: '',
    category: 'Laboratory',
    priority: 'Normal'
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const data = await patientService.getAllPatients();
    setPatients(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId);
    await investigationService.requestInvestigation({
      ...formData,
      patientName: patient?.name || 'Unknown Patient'
    });
    onSave();
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
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Beaker className="h-6 w-6" />
             </div>
             <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Diagnostic Request</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Clinical Protocol Entry</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Subject Selection</label>
            <select 
              required
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
              className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-bold transition-all outline-none"
            >
              <option value="">Select Patient Profile...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Department</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-bold outline-none"
              >
                <option>Laboratory</option>
                <option>Imaging (X-Ray/MRI)</option>
                <option>Diagnostic</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Urgency Status</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-bold outline-none"
              >
                <option>Normal</option>
                <option>Urgent</option>
                <option>Emergency (STAT)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Requested Investigation</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Full Blood Count, Chest X-Ray..." 
              value={formData.testName}
              onChange={(e) => setFormData({...formData, testName: e.target.value})}
              className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-bold outline-none" 
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Abort Request</button>
            <button type="submit" className="flex-1 px-8 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200">Dispatch Order</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ResultUpdateModal({ investigationId, onClose, onSave, onError }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      await investigationService.updateResult(investigationId, {
        result,
        resultNotes: notes
      }, file);
      onSave();
    } catch (error) {
      console.error('Error updating result:', error);
      if (onError) onError('Upload failed. Check storage permissions.');
    } finally {
      setUploading(false);
    }
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
           <div className="flex items-center gap-4">
             <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Upload className="h-6 w-6" />
             </div>
             <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Finalize Result</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Technician Documentation Portal</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Quantitative Finding / Outcome</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Normal, Reactive, 5.4 mmol/L..." 
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-bold outline-none shadow-inner" 
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Detailed Technician Notes</label>
            <textarea 
              placeholder="Observations or detailed breakdown..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-bold outline-none min-h-[120px] resize-none shadow-inner" 
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Upload Diagnostic Assets (PDF/Image)</label>
            <div className="relative group">
               <input 
                 type="file" 
                 onChange={(e) => setFile(e.target.files[0])}
                 className="hidden" 
                 id="result-file-upload"
               />
               <label 
                 htmlFor="result-file-upload"
                 className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all cursor-pointer group"
               >
                 <Upload className="h-10 w-10 text-slate-300 group-hover:text-emerald-500 mb-4 transition-colors" />
                 <p className="text-sm font-black text-slate-900">{file ? file.name : "Select Asset for Upload"}</p>
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">Max Size: 10MB • PDF, JPG, PNG</p>
               </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Discard</button>
            <button 
              disabled={uploading}
              type="submit" 
              className="flex-1 px-8 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50"
            >
              {uploading ? "Compressing & Syncing..." : "Finalize & Sign Result"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
