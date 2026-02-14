import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Pill, 
  Search, 
  Filter, 
  Plus, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  History,
  TrendingUp,
  MoreVertical,
  Minus,
  Download,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import inventoryService from '../../services/inventoryService';

const inventory = [];

export default function Pharmacy() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching pharmacy inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pharmacy Inventory</h1>
            <p className="text-slate-500 mt-1">Monitor stock levels, dispense medications, and manage supplier orders.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200 shadow-sm active:scale-95">
              <History className="h-5 w-5" />
              Dispense Log
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95">
              <Plus className="h-5 w-5" />
              Add Stock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Items', value: inventory.length.toLocaleString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Low Stock', value: inventory.filter(i => i.status === 'Low Stock').length.toString(), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Out of Stock', value: inventory.filter(i => i.status === 'Out of Stock').length.toString(), icon: Minus, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Daily Revenue', value: APP_CONFIG.CURRENCY + ' 42K', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
            >
              <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search medications by name or category..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm transition-all outline-none text-slate-600 font-bold appearance-none min-w-[140px]">
                <option>All Categories</option>
                <option>Analgesics</option>
                <option>Antibiotics</option>
                <option>Antihistamines</option>
              </select>
              <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>

          {loading ? (
             <div className="text-center py-12 text-slate-500">Loading inventory...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {inventory.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                      ${item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600' : 
                        item.status === 'Low Stock' ? 'bg-amber-50 text-amber-600' : 
                        'bg-red-50 text-red-600'}
                    `}>
                      {item.status}
                    </span>
                  </div>

                  <div className="h-12 w-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Pill className="h-6 w-6" />
                  </div>

                  <h3 className="font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-tighter">{item.category}</p>
                  
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-900 leading-none">{item.stock}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary-600">{APP_CONFIG.CURRENCY} {item.price}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">per unit</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="flex-1 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest">
                      Dispense
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                        className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 rounded-xl transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      <AnimatePresence>
                        {activeMenu === item.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20"
                            >
                              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                <ExternalLink className="h-4 w-4" />
                                View Inventory
                              </button>
                              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                <Download className="h-4 w-4" />
                                Export Specs
                              </button>
                              <div className="h-px bg-slate-50 my-1"></div>
                              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 transition-colors">
                                <History className="h-4 w-4" />
                                Restock Record
                              </button>
                              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                                <AlertTriangle className="h-4 w-4" />
                                Report Anomaly
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
