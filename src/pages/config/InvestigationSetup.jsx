import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  TestTube2, 
  Search, 
  Plus, 
  Filter, 
  Activity,
  ChevronRight,
  MoreVertical,
  FlaskConical,
  Microscope
} from 'lucide-react';
import { motion } from 'framer-motion';
import { APP_CONFIG } from '../../config';

export default function InvestigationSetup() {
  const [activeTab, setActiveTab] = useState('Laboratory');
  
  const labs = [
    { name: 'Full Blood Count (FBC)', category: 'Hematology', code: 'L001', price: '1,200' },
    { name: 'Urinalysis', category: 'Biochemistry', code: 'L002', price: '500' },
    { name: 'Lipid Profile', category: 'Biochemistry', code: 'L003', price: '2,500' },
  ];

  const imaging = [
    { name: 'Chest X-Ray', category: 'Radiology', code: 'I001', price: '3,000' },
    { name: 'Abdominal Ultrasound', category: 'Ultrasonography', code: 'I002', price: '4,500' },
    { name: 'Brain MRI', category: 'MRI', code: 'I003', price: '25,000' },
  ];

  const currentList = activeTab === 'Laboratory' ? labs : imaging;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Investigation Catalogue</h1>
            <p className="text-slate-500 mt-1">Configure laboratory tests, imaging procedures, and their pricing.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg active:scale-95">
            <Plus className="h-5 w-5" />
            Add Investigation
          </button>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit">
          {['Laboratory', 'Imaging'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()} items by name or code...`}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Name & Code</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Department</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Unit Price</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentList.map((item, i) => (
                  <motion.tr 
                    key={item.code}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-5 px-4 font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              {activeTab === 'Laboratory' ? <FlaskConical className="h-4 w-4" /> : <Microscope className="h-4 w-4" />}
                           </div>
                           <div>
                              <p className="leading-tight">{item.name}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{item.code}</p>
                           </div>
                        </div>
                    </td>
                    <td className="py-5 px-4 text-xs font-bold text-slate-500">{item.category}</td>
                    <td className="py-5 px-4 font-black text-slate-900 text-sm">{APP_CONFIG.CURRENCY} {item.price}</td>
                    <td className="py-5 px-4 text-right">
                       <button className="p-2 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical className="h-4.5 w-4.5" />
                       </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
