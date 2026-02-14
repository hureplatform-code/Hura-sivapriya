import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Dna, 
  Search, 
  Plus, 
  Trash2, 
  Edit2,
  DollarSign, 
  Layers, 
  Tag,
  Stethoscope,
  Smile,
  Activity,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import medicalMasterService from '../../services/medicalMasterService';

export default function ProcedureMaster() {
  const [activeTab, setActiveTab] = useState('dental');
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', group: 'Dental' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await medicalMasterService.getAll('procedures');
      setProcedures(data);
    } catch (error) {
      console.error("Error fetching procedures:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    setLoading(true);
    try {
      const payload = {
        ...newItem,
        group: activeTab === 'dental' ? 'Dental' : 'General'
      };

      if (editingItem) {
        await medicalMasterService.update('procedures', editingItem.id, payload);
        setProcedures(procedures.map(p => p.id === editingItem.id ? { ...p, ...payload } : p));
      } else {
        const result = await medicalMasterService.create('procedures', payload);
        setProcedures([...procedures, result]);
      }
      setIsAdding(false);
      setEditingItem(null);
      setNewItem({ name: '', price: '', group: activeTab === 'dental' ? 'Dental' : 'General' });
    } catch (error) {
      console.error("Error saving procedure:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await medicalMasterService.delete('procedures', deleteConfirmation.id);
      setProcedures(procedures.filter(p => p.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Error removing procedure:", error);
    }
  };

  const startEdit = (proc) => {
    setEditingItem(proc);
    setNewItem({ name: proc.name, price: proc.price, group: proc.group });
    setIsAdding(true);
  };

  const filtered = procedures.filter(p => activeTab === 'dental' ? p.group === 'Dental' : p.group !== 'Dental');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Procedure Master</h1>
            <p className="text-slate-500 mt-1">Configure clinical procedures, pricing, and departmental grouping.</p>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('dental')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dental' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Dental Procedures
            </button>
            <button 
              onClick={() => setActiveTab('other')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'other' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Other Clinical
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-end pr-4">
            <button 
              onClick={() => {
                setEditingItem(null);
                setNewItem({ name: '', price: '', group: activeTab === 'dental' ? 'Dental' : 'General' });
                setIsAdding(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Add New Procedure
            </button>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
             {filtered.length === 0 && !loading && (
               <div className="p-12 text-center text-slate-400 font-bold">
                 No procedures registered in this category.
               </div>
             )}
             <div className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                {filtered.map((proc) => (
                  <motion.div 
                    layout
                    key={proc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-all"
                  >
                    <div className="flex items-center gap-6">
                       <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${activeTab === 'dental' ? 'bg-amber-50 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                          {activeTab === 'dental' ? <Smile className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
                       </div>
                       <div>
                          <p className="font-black text-slate-900 text-lg">{proc.name}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{proc.group} Department</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="text-lg font-black text-primary-600">${proc.price}</p>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Base Rate</p>
                       </div>
                       <div className="flex gap-1">
                        <button 
                          onClick={() => startEdit(proc)}
                          className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" onClick={() => setDeleteConfirmation(proc)}>
                            <Trash2 className="h-5 w-5" />
                        </button>
                       </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
             </div>
          </div>
          
          <div className="flex items-center gap-3 justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest pt-4">
             <Layers className="h-4 w-4" /> Parity Check: Legacy Master/Chart logic integrated
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-900">{editingItem ? 'Update' : 'Add'} Procedure</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Procedure Name</label>
                  <input 
                    required
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="e.g. Tooth Filling"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Standard Price ($)</label>
                  <input 
                    required
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <>{editingItem ? 'Update' : 'Save'} Procedure</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {deleteConfirmation && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
            >
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Confirm Deletion</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">
                Are you sure you want to delete <b>{deleteConfirmation.name}</b>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-100"
                >
                  Delete Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
