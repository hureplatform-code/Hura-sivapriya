import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  Settings2,
  MoreVertical,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import medicalMasterService from '../../services/medicalMasterService';

export default function PracticeType() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newType, setNewType] = useState({ name: '', status: 'active' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await medicalMasterService.getAll('practiceTypes');
      setTypes(data);
    } catch (error) {
      console.error("Error fetching practice types:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await medicalMasterService.update('practiceTypes', editingItem.id, newType);
        setTypes(types.map(t => t.id === editingItem.id ? { ...t, ...newType } : t));
      } else {
        const result = await medicalMasterService.create('practiceTypes', {
          ...newType,
          count: 0
        });
        setTypes([...types, result]);
      }
      setIsAdding(false);
      setEditingItem(null);
      setNewType({ name: '', status: 'active' });
    } catch (error) {
      console.error("Error saving practice type:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await medicalMasterService.delete('practiceTypes', deleteConfirmation.id);
      setTypes(types.filter(t => t.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Error deleting practice type:", error);
    }
  };

  const startEdit = (type) => {
    setEditingItem(type);
    setNewType({ name: type.name, status: type.status });
    setIsAdding(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Practice Types</h1>
            <p className="text-slate-500 mt-1">Define and manage different types of medical practices in your facility.</p>
          </div>
          <button 
            onClick={() => {
              setEditingItem(null);
              setNewType({ name: '', status: 'active' });
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add New Type
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search practice types..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {types.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold">
                No practice types registered yet.
              </div>
            )}
            {types.map((type, i) => (
              <motion.div
                key={type.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${type.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {type.status}
                  </span>
                </div>
                
                <div className="h-12 w-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-6 w-6" />
                </div>
                
                <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{type.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{type.count || 0} Connected Facilities</p>
                
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => startEdit(type)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                    onClick={() => setDeleteConfirmation(type)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
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
                <h2 className="text-2xl font-black text-slate-900">{editingItem ? 'Update' : 'Add'} Practice Type</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type Name</label>
                  <input 
                    required
                    type="text"
                    value={newType.name}
                    onChange={(e) => setNewType({...newType, name: e.target.value})}
                    placeholder="e.g. Specialized Clinic"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={newType.status}
                    onChange={(e) => setNewType({...newType, status: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <>{editingItem ? 'Update' : 'Save'} Practice Type</>}
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
