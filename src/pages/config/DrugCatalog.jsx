import React, { useState } from 'react';
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
  AlertCircle,
  Box,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DrugCatalog() {
  const [activeTab, setActiveTab] = useState('pharma');
  const [items, setItems] = useState([
    { id: 1, name: 'Paracetamol', strength: '500mg', form: 'Tablet', type: 'pharma', price: '5.00', taxable: true },
    { id: 2, name: 'Amoxicillin', strength: '250mg', form: 'Capsule', type: 'pharma', price: '12.00', taxable: true },
    { id: 3, name: 'Surgical Gloves', strength: 'Size 7.5', form: 'Latex', type: 'non-pharma', price: '150.00', taxable: false },
    { id: 4, name: 'Cotton Wool', strength: '500g', form: 'Roll', type: 'non-pharma', price: '80.00', taxable: false }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = items.filter(i => 
    (activeTab === 'pharma' ? i.type === 'pharma' : i.type === 'non-pharma') &&
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Drug Catalog</h1>
            <p className="text-slate-500 mt-1">Manage the master list of pharmacological and surgical items.</p>
          </div>
          
          <div className="flex gap-3">
             <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('pharma')}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pharma' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Pharmacological
                </button>
                <button 
                  onClick={() => setActiveTab('non-pharma')}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'non-pharma' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Non-Pharma
                </button>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
                <Plus className="h-5 w-5" /> New Item
              </button>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <input 
                  type="text"
                  placeholder="Search catalog by name, strength or form..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm font-bold transition-all outline-none"
                />
             </div>
             <div className="flex gap-2">
                <button className="p-3 bg-white text-slate-400 rounded-xl hover:text-slate-900 transition-all">
                  <Filter className="h-5 w-5" />
                </button>
                <div className="px-4 py-3 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {filtered.length} Items Listed
                </div>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name & Strength</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Drug Form</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Base Price</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Taxable</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${activeTab === 'pharma' ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-500'}`}>
                             {activeTab === 'pharma' ? <Pill className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                          </div>
                          <div>
                             <p className="font-black text-slate-900">{item.name}</p>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.strength}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {item.form}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <p className="font-black text-slate-900">${item.price}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center">
                          {item.taxable ? (
                             <Tag className="h-5 w-5 text-emerald-500" />
                          ) : (
                             <Tag className="h-5 w-5 text-slate-200" />
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                             <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                             <Trash2 className="h-4 w-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-6 justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest pt-4 bg-slate-100/30 p-4 rounded-3xl">
           <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Standardized Product Inventory</div>
           <div className="w-1 h-1 bg-slate-200 rounded-full" />
           <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Dynamic Pricing Logic</div>
           <div className="w-1 h-1 bg-slate-200 rounded-full" />
           <div className="flex items-center gap-2"><Layers className="h-4 w-4" /> Parity Check: Legacy Product_Model Integrated</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
