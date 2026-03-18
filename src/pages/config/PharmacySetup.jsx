import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical,
  Pill,
  ShieldCheck,
  Shapes,
  Stethoscope,
  Microscope,
  Box,
  Binary,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../contexts/CurrencyContext';
import medicalMasterService from '../../services/medicalMasterService';
import { useAuth } from '../../contexts/AuthContext';

export default function PharmacySetup() {
  const { currency } = useCurrency();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('pharma');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allTabs = [
    { id: 'pharma', icon: Pill, label: 'Pharmacological' },
    { id: 'nonPharma', icon: Shapes, label: 'Non-Pharma' },
    { id: 'categories', icon: Filter, label: 'Categories' },
    { id: 'icd', icon: Binary, label: 'ICD-10 Catalogue' },
    { id: 'labs', icon: Microscope, label: 'Lab Master Repository' },
    { id: 'imaging', icon: Stethoscope, label: 'Imaging Master Repository' }
  ];

  // Role-based filtering: Hide Labs and Imaging for Pharmacists
  const tabs = allTabs.filter(tab => {
    if ((userData?.role === 'pharmacist' || userData?.role === 'pharmacist_admin') && 
        (tab.id === 'labs' || tab.id === 'imaging')) {
      return false;
    }
    return true;
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await medicalMasterService.getAll(activeTab);
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching masters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchQuery(''); // Reset search when switching tabs
    fetchItems();
  }, [activeTab]);

  // Real-time server-side search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else if (searchQuery.trim().length === 0) {
        fetchItems(); // Reset to default view
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const results = await medicalMasterService.search(activeTab, searchQuery, userData?.facilityId);
      setItems(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      const id = deleteConfirmation.id;
      await medicalMasterService.delete(activeTab, id);
      setItems(items.filter(item => item.id !== id));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting master:', error);
    }
  };

  const getColumns = () => {
    switch(activeTab) {
      case 'pharma':
        return ['Medicine / Code', 'Form', 'Stock', 'Price', 'Classification'];
      case 'nonPharma':
        return ['Item / Code', 'Unit', 'Stock', 'Price', 'Re-order'];
      case 'categories':
        return ['Name', 'Category Type', 'Code', 'Status'];
      case 'icd':
        return ['Code', 'Description', 'Chapter', 'Group'];
      case 'labs':
        return ['Test Name', 'Dept', 'Sample', 'Cost'];
      case 'imaging':
        return ['Test Name', 'Modality', 'Region', 'Cost'];
      default:
        return ['Name', 'Category', 'Type'];
    }
  };

  const currentTabLabel = tabs.find(tab => tab.id === activeTab)?.label || activeTab;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Pharmacy Setup</h1>
            <p className="text-slate-500 mt-1">Manage categories, product types, and drug master data.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add Master Record
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all border-2 ${activeTab === tab.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-500 border-transparent hover:border-slate-100 hover:bg-slate-50'}`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-primary-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-medium text-slate-900 tracking-tight text-lg">{currentTabLabel} Repository</h3>
               <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder={`Search ${currentTabLabel}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-50">
                    {getColumns().map(col => (
                      <th key={col} className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4">{col}</th>
                    ))}
                    <th className="pb-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={getColumns().length + 1} className="py-12 text-center text-[10px] font-medium text-slate-300 uppercase tracking-[0.2em]">Synchronizing Master Data...</td></tr>
                  ) : items.map((item, i) => (
                    <motion.tr 
                      key={item.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      {activeTab === 'pharma' && (
                        <>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900 leading-tight">{item.brandName || item.name}</span>
                                  {item.code && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">#{item.code}</span>}
                               </div>
                               <span className="text-[10px] text-slate-400 font-medium italic">{item.genericName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                             {item.form} 
                             <div className="text-[9px] text-slate-400 font-medium normal-case">{item.dosage}{item.unit}</div>
                          </td>
                          <td className="py-4 px-4">
                             {(() => {
                                const s = item.availableStock ?? item.stock ?? item.quantity ?? 0;
                                const stockNum = typeof s === 'string' ? parseFloat(s) : s;
                                const reorder = item.reorderLevel || 10;
                                const isLow = stockNum <= reorder;
                                return (
                                   <div className={`flex flex-col items-start gap-1 p-2 rounded-xl border border-dashed transition-all ${!isLow ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
                                      <span className={`text-[10px] font-black tracking-tight ${!isLow ? 'text-emerald-700' : 'text-red-700'}`}>
                                         {stockNum} UNITS
                                      </span>
                                      <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                         <div 
                                            className={`h-full rounded-full ${!isLow ? 'bg-emerald-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(100, (stockNum / (reorder * 2)) * 100)}%` }}
                                         />
                                      </div>
                                   </div>
                                );
                             })()}
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{currency} {item.price || 0}</span>
                              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Selling Price</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">
                             <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                {item.classification || 'General'}
                             </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'nonPharma' && (
                        <>
                          <td className="py-4 px-4 font-bold text-slate-900">
                             <div className="flex items-center gap-2">
                                <span className="text-sm">{item.name}</span>
                                {item.code && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">#{item.code}</span>}
                             </div>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{item.unit}</td>
                           <td className="py-4 px-4">
                             {(() => {
                                const s = item.availableLevel ?? item.stock ?? item.quantity ?? 0;
                                const stockNum = typeof s === 'string' ? parseFloat(s) : s;
                                const reorder = item.reorderLevel || 5;
                                const isLow = stockNum <= reorder;
                                return (
                                   <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${!isLow ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                                      {stockNum} ITEMS
                                   </span>
                                );
                             })()}
                           </td>
                           <td className="py-4 px-4 text-sm font-bold text-slate-900">
                             {currency} {item.price || 0}
                           </td>
                          <td className="py-4 px-4 text-xs font-bold text-amber-600">
                             {item.reorderLevel || 'Not Set'}
                          </td>
                        </>
                      )}
                      {activeTab === 'categories' && (
                        <>
                          <td className="py-4 px-4 font-medium text-slate-900 text-sm">{item.name}</td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-semibold uppercase tracking-widest text-slate-600">{item.type}</span>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">{item.code || 'CAT-01'}</td>
                          <td className="py-4 px-4 text-xs font-medium text-emerald-500">Active</td>
                        </>
                      )}
                      {activeTab === 'icd' && (
                        <>
                          <td className="py-4 px-4 font-medium text-slate-900 text-sm">{item.code}</td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500 max-w-xs truncate">{item.description}</td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">{item.chapter}</td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">{item.group}</td>
                        </>
                      )}
                      {activeTab === 'labs' && (
                        <>
                          <td className="py-4 px-4 font-medium text-slate-900 text-sm">{item.testName}</td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">{item.department}</td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">{item.sampleType}</td>
                          <td className="py-4 px-4 font-medium text-slate-900 text-xs">{currency} {parseFloat(item.cost || 0).toFixed(2)}</td>
                        </>
                      )}
                      {activeTab === 'imaging' && (
                        <>
                          <td className="py-4 px-4 font-medium text-slate-900 text-sm">{item.testName}</td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">{item.modality}</td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500">{item.bodyPart}</td>
                          <td className="py-4 px-4 font-medium text-slate-900 text-xs">{currency} {parseFloat(item.cost || 0).toFixed(2)}</td>
                        </>
                      )}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
                            title="Edit Record"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmation(item)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isAdding && (
          <PharmacyMasterModal
            type={activeTab}
            onClose={() => setIsAdding(false)}
            onSave={async (data) => {
              await medicalMasterService.create(activeTab, data);
              setIsAdding(false);
              fetchItems();
            }}
          />
        )}

        {editingItem && (
          <PharmacyMasterModal
            type={activeTab}
            initialData={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={async (data) => {
              await medicalMasterService.update(activeTab, editingItem.id, data);
              setEditingItem(null);
              fetchItems();
            }}
          />
        )}

        {deleteConfirmation && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl text-center"
            >
              <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">Confirm Deletion</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">
                Are you sure you want to delete this record? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-xl shadow-red-100"
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

function PharmacyMasterModal({ type, onClose, onSave, initialData }) {
  const { currency } = useCurrency();
  const [formData, setFormData] = useState(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving master:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = () => {
    switch(type) {
      case 'pharma':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Commercial / Brand</label>
                <input 
                  required
                  placeholder="e.g. Panadol"
                  value={formData.brandName || ''}
                  onChange={e => setFormData({...formData, brandName: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clinical / Generic</label>
                <input 
                  required
                  placeholder="e.g. Paracetamol"
                  value={formData.genericName || ''}
                  onChange={e => setFormData({...formData, genericName: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-1 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Drug Form</label>
                <select 
                  value={formData.form || ''}
                  onChange={e => setFormData({...formData, form: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none appearance-none shadow-inner cursor-pointer"
                >
                  <option value="">Select...</option>
                  {['Tablet', 'Syrup', 'Injection', 'Capsule', 'Cream', 'Ointment', 'Inhaler', 'Drops'].map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Standard Dosage</label>
                  <input 
                    placeholder="e.g. 500"
                    value={formData.dosage ?? ''}
                    onChange={e => setFormData({...formData, dosage: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner"
                  />
                </div>
                <div className="w-24 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                  <select 
                    value={formData.unit ?? ''}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none appearance-none shadow-inner cursor-pointer"
                  >
                    {['mg', 'ml', 'g', 'mcg', 'IU', 'puffs'].map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Product ID / Code</label>
                  <input 
                    placeholder="e.g. PH-001"
                    value={formData.code ?? ''}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Therapeutic Classification</label>
                  <input 
                    placeholder="e.g. Analgesic"
                    value={formData.classification ?? ''}
                    onChange={e => setFormData({...formData, classification: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner uppercase tracking-wider text-[11px]"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Current Stock Level (Units)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 500"
                    value={formData.availableStock ?? ''}
                    onChange={e => setFormData({...formData, availableStock: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-white border-2 border-transparent focus:border-blue-500 rounded-xl text-sm font-bold transition-all outline-none shadow-sm"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Selling Price ({currency})</label>
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={formData.price ?? ''}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Low Stock Alert Level</label>
                  <input 
                    type="number"
                    placeholder="10"
                    value={formData.reorderLevel ?? ''}
                    onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:border-2 rounded-2xl text-sm font-bold transition-all outline-none shadow-inner"
                  />
               </div>
            </div>
          </div>
        );
      case 'nonPharma':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Item Name" value={formData.name} onChange={val => setFormData({...formData, name: val})} required />
              <TextField label="Product ID / Code" value={formData.code} onChange={val => setFormData({...formData, code: val})} placeholder="e.g. NP-001" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Unit" options={['Box', 'Piece', 'Pair', 'Pack', 'Roll']} value={formData.unit} onChange={val => setFormData({...formData, unit: val})} />
              <TextField label="Selling Price" value={formData.price} onChange={val => setFormData({...formData, price: Number(val)})} type="number" />
              <TextField label="Current Stock" value={formData.availableLevel} onChange={val => setFormData({...formData, availableLevel: Number(val)})} type="number" />
            </div>
            <div className="grid grid-cols-1">
              <TextField label="Low Stock Level" value={formData.reorderLevel} onChange={val => setFormData({...formData, reorderLevel: Number(val)})} type="number" />
            </div>
          </>
        );
      case 'categories':
        return (
          <>
            <TextField label="Category Name" value={formData.name} onChange={val => setFormData({...formData, name: val})} required />
            <SelectField label="Category Type" options={['Pharmacological', 'Non-Pharmacological']} value={formData.type} onChange={val => setFormData({...formData, type: val})} />
            <TextField label="Category Code" value={formData.code} onChange={val => setFormData({...formData, code: val})} placeholder="e.g. CAT-001" />
          </>
        );
      case 'icd':
        return (
          <>
            <div className="grid grid-cols-4 gap-4">
              <TextField label="ICD Code" value={formData.code} onChange={val => setFormData({...formData, code: val})} required className="col-span-1" />
              <TextField label="Description" value={formData.description} onChange={val => setFormData({...formData, description: val})} required className="col-span-3" />
            </div>
            <TextField label="Chapter / Classification" value={formData.chapter} onChange={val => setFormData({...formData, chapter: val})} />
            <TextField label="Group" value={formData.group} onChange={val => setFormData({...formData, group: val})} />
          </>
        );
      case 'labs':
        return (
          <>
            <TextField label="Investigation / Test Name" value={formData.testName} onChange={val => setFormData({...formData, testName: val})} required />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Department" options={['Hematology', 'Biochemistry', 'Microbiology', 'Serology']} value={formData.department} onChange={val => setFormData({...formData, department: val})} />
              <TextField label="Sample Type" value={formData.sampleType} onChange={val => setFormData({...formData, sampleType: val})} placeholder="e.g. Blood, Urine" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Normal Range" value={formData.normalRange} onChange={val => setFormData({...formData, normalRange: val})} />
              <TextField label={`Cost (${currency})`} value={formData.cost} onChange={val => setFormData({...formData, cost: val})} type="number" />
            </div>
          </>
        );
      case 'imaging':
        return (
          <>
            <TextField label="Imaging Modality" value={formData.testName} onChange={val => setFormData({...formData, testName: val})} required />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Modality Type" options={['X-Ray', 'CT Scan', 'MRI', 'Ultrasound']} value={formData.modality} onChange={val => setFormData({...formData, modality: val})} />
              <TextField label="Body Region" value={formData.bodyPart} onChange={val => setFormData({...formData, bodyPart: val})} placeholder="e.g. Chest, Abdomen" />
            </div>
            <TextField label={`Cost (${currency})`} value={formData.cost} onChange={val => setFormData({...formData, cost: val})} type="number" />
          </>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 tracking-tight">{initialData ? 'Update' : 'New'} {type.toUpperCase()} Master</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Medical Repository Configuration</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-900">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {renderFields()}
          
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-500 font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Cancel</button>
            <button 
              disabled={isSubmitting}
              type="submit" 
              className="flex-1 py-4 bg-slate-900 text-white font-medium text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              {isSubmitting ? 'Syncing...' : (initialData ? 'Update Master' : 'Save Master')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TextField({ label, value, onChange, required, type = "text", placeholder, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
      <input 
        required={required}
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-100 rounded-xl text-sm font-medium transition-all outline-none"
      />
    </div>
  );
}

function SelectField({ label, options, value, onChange, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
      <select 
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-100 rounded-xl text-sm font-medium transition-all outline-none appearance-none"
      >
        <option value="">Select...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
