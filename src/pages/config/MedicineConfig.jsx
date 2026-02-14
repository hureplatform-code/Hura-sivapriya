import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Pill, 
  FlaskConical, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Search,
  Activity,
  Box,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import medicalMasterService from '../../services/medicalMasterService';

export default function MedicineConfig() {
  const [dosages, setDosages] = useState([]);
  const [drugForms, setDrugForms] = useState([]);
  const [activeTab, setActiveTab] = useState('dosage');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dData, fData] = await Promise.all([
        medicalMasterService.getAll('dosages'),
        medicalMasterService.getAll('drugForms')
      ]);
      setDosages(dData);
      setDrugForms(fData);
    } catch (error) {
      console.error("Error fetching medicine config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newItemName) return;
    setLoading(true);
    try {
      const type = activeTab === 'dosage' ? 'dosages' : 'drugForms';
      const payload = { name: newItemName };

      if (editingItem) {
        await medicalMasterService.update(type, editingItem.id, payload);
        if (activeTab === 'dosage') {
          setDosages(dosages.map(d => d.id === editingItem.id ? { ...d, ...payload } : d));
        } else {
          setDrugForms(drugForms.map(f => f.id === editingItem.id ? { ...f, ...payload } : f));
        }
      } else {
        const result = await medicalMasterService.create(type, payload);
        if (activeTab === 'dosage') {
          setDosages([...dosages, result]);
        } else {
          setDrugForms([...drugForms, result]);
        }
      }
      setIsAdding(false);
      setEditingItem(null);
      setNewItemName('');
    } catch (error) {
      console.error("Error saving medicine config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      const type = activeTab === 'dosage' ? 'dosages' : 'drugForms';
      await medicalMasterService.delete(type, deleteConfirmation.id);
      if (activeTab === 'dosage') {
        setDosages(dosages.filter(d => d.id !== deleteConfirmation.id));
      } else {
        setDrugForms(drugForms.filter(f => f.id !== deleteConfirmation.id));
      }
      setDeleteConfirmation(null);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setIsAdding(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Medicine Config</h1>
            <p className="text-slate-500 mt-1">Configure dosage frequencies and pharmacological categories.</p>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('dosage')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dosage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Dosage Frequencies
            </button>
            <button 
              onClick={() => setActiveTab('category')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'category' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Drug Forms
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-end pr-4">
            <button 
              onClick={() => {
                setEditingItem(null);
                setNewItemName('');
                setIsAdding(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Add {activeTab === 'dosage' ? 'Frequency' : 'Form'}
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="px-8 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Registered {activeTab === 'dosage' ? 'Frequencies' : 'Categories'}
              </span>
              <div className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                {activeTab === 'dosage' ? dosages.length : drugForms.length} Total
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {(activeTab === 'dosage' ? dosages : drugForms).map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="px-8 py-5 flex items-center justify-between group hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                       <div className="h-2 w-2 rounded-full bg-primary-400" />
                       <span className="font-bold text-slate-800 text-lg">{item.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => startEdit(item)}
                        className="p-2.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmation(item)}
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center text-[11px] font-black text-slate-300 uppercase tracking-widest pt-4">
             <ShieldCheck className="h-4 w-4" /> Feature Parity: Master/Doase & Master/Category
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
                <h2 className="text-2xl font-black text-slate-900">{editingItem ? 'Update' : 'Add'} {activeTab === 'dosage' ? 'Frequency' : 'Form'}</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                  <input 
                    required
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={activeTab === 'dosage' ? "e.g. 1 x 2 or Morning Only" : "e.g. Tablets or Capsules"}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary-100 focus:ring-2 transition-all"
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <>{editingItem ? 'Update' : 'Save'}</>}
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
