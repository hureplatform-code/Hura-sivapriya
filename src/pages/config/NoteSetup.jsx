import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Settings, Plus, FileText, CheckCircle2, ChevronRight, Layout, X, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import medicalMasterService from '../../services/medicalMasterService';

export default function NoteSetup() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', type: 'Clinical' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await medicalMasterService.getAll('noteTemplates');
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching note templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await medicalMasterService.update('noteTemplates', editingItem.id, newTemplate);
        setTemplates(templates.map(t => t.id === editingItem.id ? { ...t, ...newTemplate } : t));
      } else {
        const result = await medicalMasterService.create('noteTemplates', {
          ...newTemplate,
          blocks: 4,
          status: 'Active'
        });
        setTemplates([...templates, result]);
      }
      setIsAdding(false);
      setEditingItem(null);
      setNewTemplate({ name: '', type: 'Clinical' });
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      await medicalMasterService.delete('noteTemplates', deleteConfirmation.id);
      setTemplates(templates.filter(t => t.id !== deleteConfirmation.id));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const startEdit = (temp) => {
    setEditingItem(temp);
    setNewTemplate({ name: temp.name, type: temp.type });
    setIsAdding(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Note Setup</h1>
            <p className="text-slate-500 mt-1">Configure and manage SOPE/Clinical note templates and data blocks.</p>
          </div>
          <button 
            onClick={() => {
              setEditingItem(null);
              setNewTemplate({ name: '', type: 'Clinical' });
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
          >
            <Plus className="h-5 w-5" />
            Create Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold">
              No templates created yet.
            </div>
          )}
          {templates.map((temp, i) => (
            <motion.div
              key={temp.id || i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <Layout className="h-6 w-6" />
              </div>
              
              <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{temp.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{temp.type}</span>
                <span className="h-1 w-1 rounded-full bg-slate-200" />
                <span className="text-xs font-bold text-slate-500">{temp.blocks || 0} Data Blocks</span>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${temp.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {temp.status || 'Active'}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => startEdit(temp)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all" onClick={() => setDeleteConfirmation(temp)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-slate-300" />
          </div>
          <h4 className="font-black text-slate-900">Custom Data Blocks</h4>
          <p className="text-sm text-slate-500 max-w-sm mt-2">Add reusable fields like Vital Signs, Physical Exam, and History of Illness to your templates.</p>
          <button className="mt-6 px-6 py-2.5 bg-white text-slate-900 font-bold text-sm rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            Manage Blocks
          </button>
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
                <h2 className="text-2xl font-black text-slate-900">{editingItem ? 'Update' : 'Create'} Template</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Name</label>
                  <input 
                    required
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="e.g. Daily Ward Round"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <select 
                    value={newTemplate.type}
                    onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  >
                    <option value="Clinical">Clinical</option>
                    <option value="Specialist">Specialist</option>
                    <option value="Nurse">Nursing</option>
                  </select>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <>{editingItem ? 'Update' : 'Save'} Template</>}
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
