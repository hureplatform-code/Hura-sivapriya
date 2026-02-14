import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  Layers,
  ShoppingBag,
  Trash2,
  X,
  PlusCircle,
  Hash,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import inventoryService from '../../services/inventoryService';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      setItems(data);
    } catch (e) {
      console.error('Error fetching inventory:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.batch?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (category === 'All' || item.category === category)
  );

  const stats = [
    { label: 'Total Items', value: items.length, icon: Package, color: 'text-slate-900', bg: 'bg-slate-50' },
    { label: 'Low Stock', value: items.filter(i => i.stock < 20).length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Expiring Soon', value: items.filter(i => new Date(i.expiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)).length, icon: Calendar, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Categories', value: 2, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pharmacy Inventory</h1>
            <p className="text-slate-500 font-medium mt-1">Manage stocks, batches, and categorical supplies.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
          >
            <PlusCircle className="h-5 w-5" />
            Stock Inbound
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
             <motion.div 
               key={stat.label}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
             >
               <div className={`h-14 w-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                 <stat.icon className="h-7 w-7" />
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
               <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
             </motion.div>
          ))}
        </div>

        {/* Table Area */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search inventory by name or batch hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-[2rem] text-sm font-bold transition-all outline-none"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              {['All', 'Pharmacological', 'Non-Pharmacological'].map(cat => (
                 <button
                   key={cat}
                   onClick={() => setCategory(cat)}
                   className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                     ${category === cat ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}
                   `}
                 >
                   {cat}
                 </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50 text-slate-400">
                  <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-6">Product / Dosage</th>
                  <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-6 text-center">In Stock</th>
                  <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-6">Batch ID</th>
                  <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-6">Expiry</th>
                  <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-6 text-right">Unit Price</th>
                  <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item, i) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner
                          ${item.category === 'Pharmacological' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}
                        `}>
                          {item.category === 'Pharmacological' ? <Activity className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <div className="inline-flex flex-col items-center">
                         <p className={`text-xl font-black ${item.stock < 20 ? 'text-amber-500' : 'text-slate-900'}`}>{item.stock}</p>
                         <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(dot => (
                               <div key={dot} className={`h-1 w-3 rounded-full ${item.stock > (dot * 20) ? 'bg-slate-200' : (item.stock < 20 && dot === 1) ? 'bg-amber-200' : 'bg-slate-100'}`} />
                            ))}
                         </div>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-slate-300" />
                        <span className="font-bold text-slate-600 text-sm tracking-tighter uppercase">{item.batch || 'UNTRACKED'}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                       <span className={`text-xs font-black uppercase tracking-tight
                         ${new Date(item.expiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? 'text-red-500' : 'text-slate-500'}
                       `}>
                         {new Date(item.expiry).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                       </span>
                    </td>
                    <td className="py-6 px-6 text-right">
                      <p className="font-black text-slate-900 text-base">{APP_CONFIG.CURRENCY} {item.price.toFixed(2)}</p>
                    </td>
                    <td className="py-6 px-6 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-xl shadow-sm border border-slate-100 transition-all">
                             <Edit2Icon className="h-4.5 w-4.5" />
                          </button>
                          <button className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-xl shadow-sm border border-slate-100 transition-all">
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

      <AnimatePresence>
        {isAdding && (
          <InboundModal 
            onClose={() => setIsAdding(false)} 
            onSave={() => { setIsAdding(false); fetchInventory(); }}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function InboundModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Pharmacological',
    stock: 0,
    batch: '',
    expiry: '',
    price: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await inventoryService.addStock(formData);
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-white"
      >
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-5">
              <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl">
                 <Package className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Stock Inbound</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Inventory Logistics Portal</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
             <X className="h-6 w-6" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Product Name & Specifics</label>
            <input 
              required
              placeholder="e.g. Amoxicillin 500mg (Cap)"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2rem] text-sm font-bold outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Classification</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2rem] text-sm font-bold outline-none appearance-none"
              >
                <option>Pharmacological</option>
                <option>Non-Pharmacological</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Quantity (Units)</label>
              <input 
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2rem] text-sm font-bold outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Batch Number</label>
              <input 
                required
                placeholder="B-2026-X"
                value={formData.batch}
                onChange={(e) => setFormData({...formData, batch: e.target.value})}
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2rem] text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Expiry Date</label>
              <input 
                type="date"
                required
                value={formData.expiry}
                onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                className="w-full p-6 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-[2rem] text-sm font-bold outline-none" 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-slate-100 transition-all">Cancel</button>
            <button type="submit" className="flex-1 px-8 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200">Commit to Stock</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const Edit2Icon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
