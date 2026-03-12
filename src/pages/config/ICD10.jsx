import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, ListFilter, Plus, MoreVertical, FileText, Edit2, Trash2, X, Save, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import medicalMasterService from '../../services/medicalMasterService';

const CATEGORIES = [
  'Infectious Diseases', 'Viral Infections', 'Neoplasms', 'Metabolic Diseases',
  'Circulatory System', 'Respiratory System', 'Digestive System', 'Musculoskeletal',
  'Neurological', 'Mental Health', 'Genitourinary', 'Dermatology', 'Other'
];

const EMPTY_FORM = { code: '', description: '', category: '' };

export default function ICD10() {
  const [icdCodes, setIcdCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchCodes(); }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const data = await medicalMasterService.getAll('icd');
      setIcdCodes(data);
    } catch (err) {
      console.error('Error fetching ICD-10 codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = icdCodes.filter(icd => {
    const matchSearch =
      (icd.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (icd.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'All' || icd.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const categories = ['All', ...new Set(icdCodes.map(i => i.category).filter(Boolean))];

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ code: item.code || '', description: item.description || '', category: item.category || '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.description) return;
    try {
      setSaving(true);
      const payload = { code: form.code.trim().toUpperCase(), description: form.description.trim(), category: form.category };

      if (editingItem) {
        await medicalMasterService.update('icd', editingItem.id, payload);
        setIcdCodes(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i));
      } else {
        const created = await medicalMasterService.create('icd', payload);
        setIcdCodes(prev => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving ICD code:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await medicalMasterService.delete('icd', deleteConfirm.id);
      setIcdCodes(prev => prev.filter(i => i.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting ICD code:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">ICD-10 Catalogue</h1>
            <p className="text-slate-500 mt-1">Official WHO International Classification of Diseases for clinical diagnosis.</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
            <Plus className="h-5 w-5" /> Add Custom Code
          </button>
        </div>

        {/* Table */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          {/* Search + Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by ICD Code or Disease Description..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none font-medium"
              />
            </div>
            <div className="relative">
              <button onClick={() => setShowFilter(!showFilter)}
                className={`p-3.5 rounded-2xl transition-colors ${showFilter ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                <ListFilter className="h-5 w-5" />
              </button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => { setCategoryFilter(cat); setShowFilter(false); }}
                      className={`w-full text-left px-5 py-3 text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <Tag className="h-4 w-4" />
              <span>{filtered.length} {filtered.length === 1 ? 'code' : 'codes'} {categoryFilter !== 'All' ? `in "${categoryFilter}"` : 'total'}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-400 font-medium">Loading ICD-10 catalogue...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-medium">
                {icdCodes.length === 0 ? 'No ICD-10 codes yet. Add your first custom code.' : 'No codes match your search.'}
              </p>
              {icdCodes.length === 0 && (
                <button onClick={openAdd} className="mt-4 px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-2xl hover:bg-primary-700 transition-all">
                  Add First Code
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-50">
                    <th className="pb-4 font-semibold text-slate-400 text-[10px] uppercase tracking-widest px-4">ICD Code</th>
                    <th className="pb-4 font-semibold text-slate-400 text-[10px] uppercase tracking-widest px-4">Description</th>
                    <th className="pb-4 font-semibold text-slate-400 text-[10px] uppercase tracking-widest px-4">Category</th>
                    <th className="pb-4 font-semibold text-slate-400 text-[10px] uppercase tracking-widest px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((icd, i) => (
                    <motion.tr key={icd.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="group hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-4">
                        <span className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold">
                          {icd.code}
                        </span>
                      </td>
                      <td className="py-5 px-4 font-medium text-slate-700 text-sm max-w-md">{icd.description}</td>
                      <td className="py-5 px-4">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{icd.category}</span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openEdit(icd)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(icd)}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">{editingItem ? 'Edit' : 'Add'} ICD-10 Code</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">ICD Code *</label>
                  <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="e.g. A00.0 or E11.9"
                    className="w-full bg-slate-50 border border-transparent focus:border-primary-200 rounded-2xl py-3.5 px-5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 transition-all uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Disease Description *</label>
                  <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="e.g. Type 2 diabetes mellitus without complications"
                    rows={3}
                    className="w-full bg-slate-50 border border-transparent focus:border-primary-200 rounded-2xl py-3.5 px-5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 transition-all resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-transparent focus:border-primary-200 rounded-2xl py-3.5 px-5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 transition-all">
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={saving}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-medium text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : editingItem ? 'Update Code' : 'Add Code'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center">
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Remove ICD Code?</h3>
              <p className="text-sm text-slate-500 mb-8">Delete <strong>{deleteConfirm.code}</strong>? This cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-red-600 shadow-xl shadow-red-100">
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
