import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Heart, 
  Plus, 
  Search, 
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import medicalMasterService from '../../services/medicalMasterService';

export default function Specialty() {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newSpec, setNewSpec] = useState({ name: '', count: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await medicalMasterService.getAll('specialties');
      setSpecialties(data);
    } catch (error) {
      console.error("Error fetching specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await medicalMasterService.update('specialties', editingItem.id, newSpec);
        setSpecialties(specialties.map(s => s.id === editingItem.id ? { ...s, ...newSpec } : s));
      } else {
        const result = await medicalMasterService.create('specialties', {
          ...newSpec,
          status: 'active'
        });
        setSpecialties([...specialties, result]);
      }
      setIsAdding(false);
      setEditingItem(null);
      setNewSpec({ name: '', count: 0 });
    } catch (error) {
      console.error("Error saving specialty:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await medicalMasterService.delete('specialties', deleteConfirmation.id);
      setSpecialties(specialties.filter(s => s.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Error deleting specialty:", error);
    }
  };

  const startEdit = (spec) => {
    setEditingItem(spec);
    setNewSpec({ name: spec.name, count: spec.count });
    setIsAdding(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Medical Specialties</h1>
            <p className="text-slate-500 mt-1">Manage the different clinical departments and specialties available.</p>
          </div>
          <button 
            onClick={() => {
              setEditingItem(null);
              setNewSpec({ name: '', count: 0 });
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add New Specialty
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search specialties..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold">
                No specialties registered yet.
              </div>
            )}
            {specialties.map((spec, i) => (
              <motion.div
                key={spec.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{spec.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">{spec.count || 0} Specialists</span>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEdit(spec)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors" onClick={() => setDeleteConfirmation(spec)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            <motion.button
              onClick={() => {
                setEditingItem(null);
                setNewSpec({ name: '', count: 0 });
                setIsAdding(true);
              }}
              className="border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/30 transition-all p-6 min-h-[220px]"
            >
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-100">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold">Add Specialty</span>
            </motion.button>
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
                <h2 className="text-2xl font-black text-slate-900">{editingItem ? 'Update' : 'Add'} Specialty</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialty Name</label>
                  <input 
                    required
                    type="text"
                    value={newSpec.name}
                    onChange={(e) => setNewSpec({...newSpec, name: e.target.value})}
                    placeholder="e.g. Cardiology"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Specialist Count</label>
                  <input 
                    type="number"
                    value={newSpec.count}
                    onChange={(e) => setNewSpec({...newSpec, count: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <>{editingItem ? 'Update' : 'Save'} Specialty</>}
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
