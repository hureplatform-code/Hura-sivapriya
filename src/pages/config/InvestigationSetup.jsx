import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Search, Plus, FlaskConical, Microscope, 
  Edit2, Trash2, X, Save, CheckCircle2, Activity,
  Sparkles, Loader2, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import { useCurrency } from '../../contexts/CurrencyContext';
import medicalMasterService from '../../services/medicalMasterService';
import { LAB_STANDARDS, IMAGING_STANDARDS } from '../../constants/investigationStandards';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_FORM = { name: '', category: '', code: '', price: '', fields: [] };

export default function InvestigationSetup() {
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState('labs');
  const [labs, setLabs] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const { success, error: toastError } = useToast();
  const { userData } = useAuth();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [labData, imgData] = await Promise.all([
        medicalMasterService.getAll('labs', null, null, null, userData?.facilityId),
        medicalMasterService.getAll('imaging', null, null, null, userData?.facilityId),
      ]);
      setLabs(labData);
      setImaging(imgData);
    } catch (err) {
      console.error('Error fetching investigation catalogue:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentList = (activeTab === 'labs' ? labs : imaging).filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ 
      name: item.name || '', 
      category: item.category || '', 
      code: item.code || '', 
      price: item.price || '',
      fields: item.fields || []
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      setSaving(true);
      const type = activeTab; // 'labs' or 'imaging'
      const payload = { 
        name: form.name, 
        category: form.category, 
        code: form.code, 
        price: form.price,
        fields: form.fields || [],
        facilityId: userData?.facilityId
      };

      if (editingItem) {
        await medicalMasterService.update(type, editingItem.id, payload);
        const setter = activeTab === 'labs' ? setLabs : setImaging;
        setter(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i));
      } else {
        const created = await medicalMasterService.create(type, payload);
        const setter = activeTab === 'labs' ? setLabs : setImaging;
        setter(prev => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving investigation:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await medicalMasterService.delete(activeTab, deleteConfirm.id);
      const setter = activeTab === 'labs' ? setLabs : setImaging;
      setter(prev => prev.filter(i => i.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting investigation:', err);
    }
  };

  const handleImportStandards = async () => {
    try {
      setImporting(true);
      const standards = activeTab === 'labs' ? LAB_STANDARDS : IMAGING_STANDARDS;
      const existingItems = activeTab === 'labs' ? labs : imaging;
      
      const promises = standards.map(async (item) => {
        const payload = {
          name: item.name,
          category: item.category,
          code: item.code,
          price: item.price || 0,
          fields: item.fields || [],
          facilityId: userData?.facilityId
        };
        
        // Find if code already exists
        const existing = (existingItems || []).find(ex => ex.code === item.code);
        if (existing) {
          return medicalMasterService.update(activeTab, existing.id, payload);
        } else {
          return medicalMasterService.create(activeTab, payload);
        }
      });

      await Promise.all(promises);
      success(`Successfully processed ${standards.length} standard items.`);
      await fetchAll();
    } catch (err) {
      console.error('Import failed:', err);
      toastError("Failed to update standards.");
    } finally {
      setImporting(false);
    }
  };

  const addField = () => {
    setForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), { id: Date.now().toString(), label: '', unit: '', ref: '' }]
    }));
  };

  const removeField = (id) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  };

  const updateField = (id, key, value) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, [key]: value } : f)
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Investigation Catalogue</h1>
            <p className="text-slate-500 mt-1">Configure laboratory tests, imaging procedures, and their pricing.</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all shadow-lg active:scale-95">
            <Plus className="h-5 w-5" /> Add Investigation
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm w-fit">
          {[{ key: 'labs', label: 'Laboratory' }, { key: 'imaging', label: 'Imaging' }].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
              className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab === 'labs' ? 'laboratory' : 'imaging'} items by name or code...`}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 font-medium">Loading catalogue...</div>
          ) : currentList.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center max-w-md mx-auto">
              <div className="h-20 w-20 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-xl shadow-primary-50/50">
                {activeTab === 'labs' ? <FlaskConical className="h-10 w-10" /> : <Microscope className="h-10 w-10" />}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No {activeTab === 'labs' ? 'laboratory' : 'imaging'} items found</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Your database for this department is currently empty. You can add items manually or import our standard medical portfolio to get started instantly.</p>
              
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={handleImportStandards} 
                  disabled={importing}
                  className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-emerald-400" />}
                  {importing ? 'Processing Database...' : 'Import Standard Portfolio'}
                </button>
                <button onClick={openAdd} className="w-full px-8 py-4 bg-white border border-slate-100 text-slate-900 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all">
                  Manual Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-50">
                    <th className="pb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4">Name & Code</th>
                    <th className="pb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4">Department</th>
                    <th className="pb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4">Unit Price</th>
                    <th className="pb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentList.map(item => (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            {activeTab === 'labs' ? <FlaskConical className="h-4 w-4" /> : <Microscope className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm leading-tight">{item.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">{item.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-sm font-medium text-slate-500">{item.category || '—'}</td>
                      <td className="py-5 px-4 font-medium text-slate-900 text-sm">{item.price ? `${currency} ${item.price}` : '—'}</td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 transition-all">
                          <button onClick={() => openEdit(item)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(item)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingItem ? 'Edit' : 'Add'} {activeTab === 'labs' ? 'Lab Test' : 'Imaging Procedure'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 pt-8">
                <div className="grid grid-cols-12 gap-10">
                  {/* Left Side: Basic Info */}
                  <div className="col-span-12 md:col-span-4 space-y-6">
                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-5">
                      {[
                        { label: 'Test / Procedure Name', key: 'name', placeholder: activeTab === 'labs' ? 'e.g. Full Blood Count (FBC)' : 'e.g. Chest X-Ray', required: true },
                        { label: 'Code / Reference No.', key: 'code', placeholder: activeTab === 'labs' ? 'e.g. L001' : 'e.g. I001' },
                        { label: 'Department', key: 'category', placeholder: activeTab === 'labs' ? 'e.g. Hematology' : 'e.g. Radiology' },
                        { label: `Price (${currency})`, key: 'price', placeholder: 'e.g. 1200' },
                      ].map(f => (
                        <div key={f.key} className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                          <input
                            required={f.required}
                            value={form[f.key]}
                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full bg-white border border-slate-200 focus:border-primary-300 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary-100/50 transition-all"
                          />
                        </div>
                      ))}
                    </div>

                    <button type="submit" disabled={saving}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-medium text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : editingItem ? 'Update Test' : 'Create Entry'}
                    </button>
                    <div className="h-4 md:hidden" /> {/* Spacing for mobile */}
                  </div>

                  {/* Right Side: Parameters */}
                  <div className="col-span-12 md:col-span-8 space-y-6">
                    {activeTab === 'labs' ? (
                      <div className="space-y-4 h-full flex flex-col">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Activity className="h-3 w-3" /> Test Parameters (Readings & Ranges)
                          </label>
                          <button 
                            type="button" 
                            onClick={addField}
                            className="h-8 px-4 bg-primary-50 text-[10px] font-bold text-primary-600 uppercase tracking-tight flex items-center gap-1.5 hover:bg-primary-100 rounded-lg transition-all active:scale-95"
                          >
                             <Plus className="h-3.5 w-3.5" /> Add New Field
                          </button>
                        </div>
    
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar content-start pb-4">
                           {!form.fields || form.fields.length === 0 ? (
                             <div className="col-span-2 py-16 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No reading parameters added</p>
                               <p className="text-[10px] text-slate-300 mt-1 uppercase">Click "Add New Field" to start</p>
                             </div>
                           ) : (
                             form.fields.map((field, idx) => (
                               <motion.div 
                                 initial={{ opacity: 0, x: -5 }} 
                                 animate={{ opacity: 1, x: 0 }}
                                 key={field.id} 
                                 className="p-4 bg-white rounded-2xl flex flex-col gap-3 group border border-slate-100 hover:border-slate-200 transition-all shadow-sm hover:shadow-md"
                               >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">#0{idx + 1} Parameter</span>
                                    <button type="button" onClick={() => removeField(field.id)} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    <input 
                                      placeholder="Label (e.g. Hemoglobin)"
                                      value={field.label}
                                      onChange={e => updateField(field.id, 'label', e.target.value)}
                                      className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input 
                                        placeholder="Unit (g/dL)"
                                        value={field.unit}
                                        onChange={e => updateField(field.id, 'unit', e.target.value)}
                                        className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                                      />
                                      <input 
                                        placeholder="Ref (13-17)"
                                        value={field.ref}
                                        onChange={e => updateField(field.id, 'ref', e.target.value)}
                                        className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                                      />
                                    </div>
                                  </div>
                               </motion.div>
                             ))
                           )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                        <Microscope className="h-12 w-12 text-slate-200 mb-4" />
                        <h3 className="text-sm font-semibold text-slate-900">Imaging Configuration</h3>
                        <p className="text-xs text-slate-500 mt-2 max-w-[240px]">Imaging procedures typically use the standard result reporting template. No custom fields are required.</p>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl text-center">
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Remove Item?</h3>
              <p className="text-sm text-slate-500 mb-8">Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white font-medium text-xs uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-xl shadow-red-100">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
