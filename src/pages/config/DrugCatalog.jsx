import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Pill, 
  FlaskConical, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Package,
  Tag, 
  DollarSign,
  Box,
  CheckCircle2,
  Filter,
  Layers,
  X,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import medicalMasterService from '../../services/medicalMasterService';
import { useAuth } from '../../contexts/AuthContext';

export default function DrugCatalog() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('pharma');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', strength: '', form: '', price: '', taxable: false });

  useEffect(() => { fetchCatalog(); }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [pharma, nonPharma] = await Promise.all([
        medicalMasterService.getAll('pharma_masters'),
        medicalMasterService.getAll('non_pharma_masters'),
      ]);
      const tagged = [
        ...pharma.map(i => ({ ...i, type: 'pharma' })),
        ...nonPharma.map(i => ({ ...i, type: 'non-pharma' })),
      ];
      setItems(tagged);
    } catch (err) {
      console.error('Error fetching drug catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(i =>
    (activeTab === 'pharma' ? i.type === 'pharma' : i.type === 'non-pharma') &&
    (i.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: '', strength: '', form: '', price: '', taxable: false });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name || '', strength: item.strength || '', form: item.form || '', price: item.price || '', taxable: item.taxable || false });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      setSaving(true);
      const collection = activeTab === 'pharma' ? 'pharma_masters' : 'non_pharma_masters';
      const payload = { name: form.name, strength: form.strength, form: form.form, price: form.price, taxable: form.taxable };

      if (editingItem) {
        await medicalMasterService.update(collection, editingItem.id, payload);
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i));
      } else {
        const created = await medicalMasterService.create(collection, payload);
        setItems(prev => [...prev, { ...created, type: activeTab }]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const collection = deleteConfirm.type === 'pharma' ? 'pharma_masters' : 'non_pharma_masters';
      await medicalMasterService.delete(collection, deleteConfirm.id);
      setItems(prev => prev.filter(i => i.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Drug Catalog</h1>
            <p className="text-slate-500 mt-1">Manage the master list of pharmacological and non-pharma items.</p>
          </div>

          <div className="flex gap-3">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => setActiveTab('pharma')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'pharma' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Pharmacological
              </button>
              <button onClick={() => setActiveTab('non-pharma')}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'non-pharma' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Non-Pharma
              </button>
            </div>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
              <Plus className="h-5 w-5" /> New Item
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <input
                type="text"
                placeholder="Search catalog by name, strength or form..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm font-medium transition-all outline-none"
              />
            </div>
            <div className="px-4 py-3 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-semibold uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {filtered.length} Items
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 font-medium">Loading catalog...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-medium">No {activeTab === 'pharma' ? 'pharmaceutical' : 'non-pharma'} items yet.</p>
              <button onClick={openAdd} className="mt-4 px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-2xl hover:bg-primary-700 transition-all">
                Add First Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Item Name & Strength</th>
                    <th className="px-8 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Drug Form</th>
                    <th className="px-8 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">Base Price</th>
                    <th className="px-8 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">Taxable</th>
                    <th className="px-8 py-5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(item => (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="group hover:bg-slate-50/30 transition-all">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${activeTab === 'pharma' ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-500'}`}>
                            {activeTab === 'pharma' ? <Pill className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-tight">{item.strength}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold uppercase tracking-widest">
                          {item.form || '—'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <p className="font-medium text-slate-900">{item.price ? `MVR ${item.price}` : '—'}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <Tag className={`h-5 w-5 mx-auto ${item.taxable ? 'text-emerald-500' : 'text-slate-200'}`} />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openEdit(item)}
                            className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(item)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
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

        <div className="flex items-center gap-6 justify-center text-[10px] font-medium text-slate-300 uppercase tracking-widest p-4">
          <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Standardized Product Inventory</div>
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Dynamic Pricing Logic</div>
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-2"><Layers className="h-4 w-4" /> Pharma & Non-Pharma Masters</div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">{editingItem ? 'Edit' : 'Add'} {activeTab === 'pharma' ? 'Medicine' : 'Non-Pharma Item'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-5">
                {[
                  { label: 'Item Name', key: 'name', placeholder: 'e.g. Paracetamol', required: true },
                  { label: 'Strength / Size', key: 'strength', placeholder: 'e.g. 500mg or 7.5cm' },
                  { label: 'Drug Form / Category', key: 'form', placeholder: 'e.g. Tablet, Capsule, Roll' },
                  { label: 'Base Price (MVR)', key: 'price', placeholder: 'e.g. 5.00' },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                    <input
                      required={f.required}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-slate-50 border border-transparent focus:border-primary-200 rounded-2xl py-3.5 px-5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                  </div>
                ))}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.taxable} onChange={e => setForm(p => ({ ...p, taxable: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary-600" />
                  <span className="text-sm font-medium text-slate-700">Taxable item</span>
                </label>

                <button type="submit" disabled={saving}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-medium text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add to Catalog'}
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
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Remove Item?</h3>
              <p className="text-sm text-slate-500 mb-8">Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-100">
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
