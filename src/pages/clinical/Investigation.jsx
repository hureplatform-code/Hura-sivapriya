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

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function Investigation() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    if (userData) {
      fetchInvestigations();
    }
  }, [userData]);

  const fetchInvestigations = async (isLoadMore = false) => {
    if (!userData?.facilityId && userData?.role !== 'superadmin') {
      setLoading(false);
      return;
    }
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const { investigations: newInvs, lastDoc } = await investigationService.getAllInvestigations(
        userData.facilityId,
        20,
        isLoadMore ? lastVisible : null
      );
      
      if (isLoadMore) {
        setInvestigations(prev => [...prev, ...newInvs]);
      } else {
        setInvestigations(newInvs || []);
      }

      setLastVisible(lastDoc);
      setHasMore(newInvs.length === 20);
    } catch (error) {
      console.error('Error fetching investigations:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setLastVisible(null);
    setHasMore(true);
    fetchInvestigations(false);
  };

  if (userData?.role === 'superadmin') {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
           <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6 shadow-inner">
              <Beaker className="h-10 w-10" />
           </div>
           <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Diagnostic Governance</h2>
           <p className="text-slate-500 max-w-md mt-2 font-medium">
             Individual lab results and diagnostic investigations are private clinical data. Superadmin access is restricted to platform clinical outcome aggregated reports.
           </p>
           <button 
             onClick={() => navigate('/reports/outcome')}
             className="mt-8 px-8 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
           >
             Go to Outcome Reports
           </button>
        </div>
      </DashboardLayout>
    );
  }

  const handleCancelRequest = async (inv) => {
    const isConfirmed = await confirm({
      title: 'Cancel Investigation',
      message: `Are you sure you want to cancel investigation request ${inv.id}?`,
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request',
      isDestructive: true
    });
    if (isConfirmed) {
      success(`Investigation ${inv.id} has been cancelled.`);
      fetchInvestigations();
    }
  };

  const handleDeleteRequest = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Record',
      message: 'Are you sure you want to PERMANENTLY delete this record? This cannot be undone.',
      confirmText: 'Delete Permanently',
      cancelText: 'Keep Record',
      isDestructive: true
    });
    if (isConfirmed) {
      success('Record deleted.');
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
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Diagnostics Hub</h1>
            <p className="text-slate-500 mt-1">Laboratory and Imaging results management system.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
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
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm font-medium transition-all outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={handleRefresh}
                className="p-4 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95"
              >
                <Beaker className={`h-5 w-5 ${loading && !loadingMore ? 'animate-spin' : ''}`} />
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-medium text-sm">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">Request Detail</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">Patient Info</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">Category</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4 text-center">Priority</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && !loadingMore ? (
                   <tr>
                     <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">Analyzing diagnostic baseline...</td>
                   </tr>
                ) : filteredInvestigations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500 font-semibold uppercase tracking-widest text-xs">No records found.</td>
                  </tr>
                ) : (
                  filteredInvestigations.map((inv, i) => (
                    <motion.tr 
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-5 px-4">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">#{(inv.id || '......').slice(-6).toUpperCase()}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight mt-0.5">{inv.testName}</p>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center font-medium text-slate-400 text-xs shadow-inner">
                            {inv.patientName?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <p className="text-sm font-medium text-slate-900">{inv.patientName}</p>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest
                          ${inv.category === 'Laboratory' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}
                        `}>
                          {inv.category === 'Laboratory' ? <FlaskConical className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          {inv.category}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest
                           ${inv.priority === 'Emergency (STAT)' ? 'bg-red-50 text-red-600' : 
                             inv.priority === 'Urgent' ? 'bg-amber-50 text-amber-600' : 
                             'bg-slate-50 text-slate-400'}
                         `}>
                           {inv.priority || 'Normal'}
                         </span>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest
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
                        <div className="flex items-center justify-end gap-2 transition-opacity">
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
                               className="px-4 py-2 bg-slate-900 text-white text-[10px] font-medium rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg shadow-slate-200"
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
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                      <Activity className="h-4 w-4" />
                                      Update Result
                                    </button>
                                    <button 
                                      onClick={() => { setActiveMenu(null); }}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                      <FileText className="h-4 w-4" />
                                      View Details
                                    </button>
                                    {inv.status === 'Completed' && (
                                      <button 
                                        onClick={() => { 
                                          if (inv.resultFile) {
                                            window.open(inv.resultFile, '_blank');
                                          }
                                          setActiveMenu(null); 
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                      >
                                        <Download className="h-4 w-4" />
                                        Download Report
                                      </button>
                                    )}
                                    <div className="h-px bg-slate-50 my-1"></div>
                                    <button 
                                      onClick={() => { handleCancelRequest(inv); setActiveMenu(null); }}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                                    >
                                      <Clock className="h-4 w-4" />
                                      Cancel Request
                                    </button>
                                    <button 
                                      onClick={() => { handleDeleteRequest(inv.id); setActiveMenu(null); }}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="pt-8 border-t border-slate-50 flex justify-center">
              <button
                onClick={() => fetchInvestigations(true)}
                disabled={loadingMore}
                className="px-10 py-4 bg-slate-50 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loadingMore ? 'Loading Records...' : 'Load More Investigations'}
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <InvestigationModal 
            onClose={() => setIsAdding(false)} 
            onSave={() => { 
                setIsAdding(false); 
                fetchInvestigations(); 
                success('Investigation requested successfully.');
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
                success('Result updated successfully.');
            }}
            onError={(msg) => {
                toastError(msg);
            }}
          />
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
               <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Diagnostic Request</h3>
               <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em] mt-0.5">Clinical Protocol Entry</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Subject Selection</label>
            <select 
              required
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
              className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-medium transition-all outline-none"
            >
              <option value="">Select Patient Profile...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Department</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-medium outline-none"
              >
                <option>Laboratory</option>
                <option>Imaging (X-Ray/MRI)</option>
                <option>Diagnostic</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Urgency Status</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-medium outline-none"
              >
                <option>Normal</option>
                <option>Urgent</option>
                <option>Emergency (STAT)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Requested Investigation</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Full Blood Count, Chest X-Ray..." 
              value={formData.testName}
              onChange={(e) => setFormData({...formData, testName: e.target.value})}
              className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-medium outline-none" 
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Abort Request</button>
            <button type="submit" className="flex-1 px-8 py-5 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200">Dispatch Order</button>
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
               <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Finalize Result</h3>
               <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em] mt-0.5">Technician Documentation Portal</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Quantitative Finding / Outcome</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Normal, Reactive, 5.4 mmol/L..." 
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-medium outline-none shadow-inner" 
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Detailed Technician Notes</label>
            <textarea 
              placeholder="Observations or detailed breakdown..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-sm font-medium outline-none min-h-[120px] resize-none shadow-inner" 
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-2">Upload Diagnostic Assets (PDF/Image)</label>
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
                 <p className="text-sm font-medium text-slate-900">{file ? file.name : "Select Asset for Upload"}</p>
                 <p className="text-[10px] text-slate-400 uppercase font-medium tracking-widest mt-2">Max Size: 10MB • PDF, JPG, PNG</p>
               </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Discard</button>
            <button 
              disabled={uploading}
              type="submit" 
              className="flex-1 px-8 py-5 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50"
            >
              {uploading ? "Compressing & Syncing..." : "Finalize & Sign Result"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
