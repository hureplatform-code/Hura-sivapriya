import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Database, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  FileCode, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import firestoreService from '../../services/firestoreService';
import auditService from '../../services/auditService';
import { useAuth } from '../../contexts/AuthContext';

export default function SystemCodes() {
  const { userData } = useAuth();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', description: '', type: 'ICD-10', category: 'General' });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const [icd, pharma] = await Promise.all([
        firestoreService.getAll(firestoreService.collections.icd_masters),
        firestoreService.getAll(firestoreService.collections.pharma_masters)
      ]);
      const icdList = icd.map(c => ({ ...c, type: 'ICD-10' }));
      const pharmaList = pharma.map(c => ({ ...c, type: 'CDT' }));
      setCodes([...icdList, ...pharmaList]);
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInject = async (e) => {
    e.preventDefault();
    try {
      const collection = newCode.type === 'ICD-10' 
        ? firestoreService.collections.icd_masters 
        : firestoreService.collections.pharma_masters;
      
      const result = await firestoreService.create(collection, newCode);
      
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'INJECT_SYSTEM_CODE',
        module: 'GOVERNANCE',
        description: `Injected new ${newCode.type} code: ${newCode.code}`,
        metadata: { codeId: result.id, code: newCode.code, type: newCode.type }
      });

      setIsAdding(false);
      setNewCode({ code: '', description: '', type: 'ICD-10', category: 'General' });
      fetchCodes();
    } catch (error) {
       console.error('Error injecting code:', error);
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm('Are you sure you want to delete this global master code?')) {
      try {
        const collection = type === 'ICD-10' 
          ? firestoreService.collections.icd_masters 
          : firestoreService.collections.pharma_masters;
        
        const codeToRemove = codes.find(c => c.id === id);
        await firestoreService.delete(collection, id);

        await auditService.logActivity({
          userId: userData?.uid,
          userName: userData?.name || 'Superadmin',
          action: 'DELETE_SYSTEM_CODE',
          module: 'GOVERNANCE',
          description: `Deleted global ${type} code: ${codeToRemove?.code}`,
          metadata: { codeId: id, code: codeToRemove?.code, type }
        });

        fetchCodes();
      } catch (error) {
        console.error('Error deleting code:', error);
      }
    }
  };

  const filteredCodes = codes.filter(c => {
    const matchesSearch = (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeType === 'All' || c.type === activeType;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Codes Master</h1>
            <p className="text-slate-500 font-medium mt-1">Global ICD-10 and CDT terminology management for platform-wide clinical accuracy.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Inject New Code
          </button>
        </div>

        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by code identifier or clinical description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-3xl text-sm font-bold outline-none transition-all"
              />
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {['All', 'ICD-10', 'CDT'].map(type => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${activeType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Code Type</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Identifier</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Description</th>
                  <th className="pb-6 text-[10px) font-black text-slate-400 uppercase tracking-widest px-4">Category</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCodes.map((code) => (
                  <tr key={code.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-4">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest
                        ${code.type === 'ICD-10' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}
                      `}>
                        {code.type}
                      </span>
                    </td>
                    <td className="py-6 px-4 font-black text-slate-900 text-sm tracking-tight">{code.code}</td>
                    <td className="py-6 px-4 text-xs font-bold text-slate-600 max-w-md">{code.description}</td>
                    <td className="py-6 px-4">
                       <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                         {code.category}
                       </span>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="h-9 w-9 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(code.id, code.type)}
                          className="h-9 w-9 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && codes.length === 0 && (
               <div className="py-20 text-center font-bold text-slate-400 animate-pulse">Synchronizing Global Lexicon...</div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-slate-100">
                     <h3 className="text-xl font-black text-slate-900 uppercase">Inject Master Code</h3>
                     <p className="text-xs text-slate-500 font-bold mt-1">Add verified ICD-10 or CDT terminology.</p>
                  </div>
                  <form onSubmit={handleInject} className="p-8 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code Type</label>
                           <select 
                            value={newCode.type}
                            onChange={e => setNewCode({...newCode, type: e.target.value})}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold appearance-none"
                           >
                              <option>ICD-10</option>
                              <option>CDT</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                           <input 
                            type="text"
                            required
                            placeholder="e.g. Respiratory"
                            value={newCode.category}
                            onChange={e => setNewCode({...newCode, category: e.target.value})}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                           />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code Identifier</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. A00.1"
                          value={newCode.code}
                          onChange={e => setNewCode({...newCode, code: e.target.value})}
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Description</label>
                        <textarea 
                          rows={3}
                          required
                          placeholder="Full medical terminology description..."
                          value={newCode.description}
                          onChange={e => setNewCode({...newCode, description: e.target.value})}
                          className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold resize-none"
                        />
                     </div>
                     <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-slate-50 font-black text-[10px] uppercase tracking-widest text-slate-500 rounded-2xl hover:bg-slate-100 transition-all">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-slate-900 font-black text-[10px] uppercase tracking-widest text-white rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">Commit Injection</button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 flex items-start gap-6">
          <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-amber-100 flex items-center justify-center text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Global Synchronization Protocol</h4>
            <p className="text-xs font-bold text-amber-700 leading-relaxed">
              Modifying these codes impacts billing and clinical documentation across ALL organizations. 
              Changes are versioned and logged in the Global Audit Trail. Only use verified WHO and ADA terminology.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
