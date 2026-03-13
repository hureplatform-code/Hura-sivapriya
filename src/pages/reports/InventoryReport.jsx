import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  History, 
  Download, 
  Search,
  ArrowUpRight,
  ShoppingCart,
  Zap,
  Box,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import inventoryService from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_CONFIG } from '../../config';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function InventoryReport() {
  const { userData } = useAuth();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory(userData?.facilityId);
      setInventory(data || []);

      // Calculate Low Stock
      const low = data.filter(i => parseInt(i.stock) <= 20);
      setLowStock(low);

      // Top Items (Mock logic: just sorted by stock for this view since we don't have dispense logs yet)
      const sortedByStock = [...data].sort((a, b) => b.stock - a.stock).slice(0, 5);
      setTopItems(sortedByStock);

    } catch (error) {
      console.error('Error fetching inventory report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Pharmacy Consumption & Stock Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = inventory.map(item => [
      item.name,
      item.category,
      item.stock,
      `${currency} ${item.price}`,
      item.status
    ]);

    autoTable(doc, {
      head: [['Item Name', 'Category', 'Quantity', 'Price/Unit', 'Status']],
      body: tableData,
      startY: 40,
    });

    doc.save('Inventory_Report.pdf');
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-screen text-slate-400 font-semibold uppercase tracking-widest">Generating Stock Analytics...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Inventory Intelligence</h1>
            <p className="text-slate-500 font-medium mt-1">Pharmacy consumption trends and critical stock alerts.</p>
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-10 py-5 bg-slate-900 text-white font-medium text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
          >
            <Download className="h-5 w-5" />
            Export Monthly Ledger
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Asset Valuation', value: `${currency} ${(inventory.reduce((sum, i) => sum + (i.stock * i.price), 0)).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Critical SKUs', value: lowStock.length.toString(), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Total Stock Units', value: inventory.reduce((sum, i) => sum + parseInt(i.stock), 0).toLocaleString(), icon: Box, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Medication Categories', value: new Set(inventory.map(i => i.category)).size.toString(), icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
            >
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 uppercase tracking-tight flex items-center gap-3">
                 <Package className="h-6 w-6 text-primary-500" />
                 Highest Stock Distribution
              </h3>
            </div>
            <div className="space-y-6">
               {topItems.map((item, i) => (
                 <div key={item.id} className="group">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-sm font-medium text-slate-800 uppercase tracking-tight">{item.name}</span>
                       <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{item.stock} Units left</span>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.stock / topItems[0].stock) * 100}%` }}
                        className="h-full bg-primary-500 rounded-full"
                       />
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-semibold text-slate-900 uppercase tracking-tight flex items-center gap-3">
               <AlertTriangle className="h-6 w-6 text-red-500" />
               Critical Stock Alerts
            </h3>
            <div className="space-y-4">
               {lowStock.length > 0 ? lowStock.map(item => (
                 <div key={item.id} className="flex items-center justify-between p-6 bg-red-50 border border-red-100 rounded-[2rem]">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                          <Package className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-medium text-red-900">{item.name}</p>
                          <p className="text-[10px] font-medium text-red-600 uppercase tracking-widest">{item.category}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-medium text-red-900">{item.stock}</p>
                       <p className="text-[10px] font-medium text-red-400 uppercase tracking-widest">Units Left</p>
                    </div>
                 </div>
               )) : (
                 <div className="py-20 text-center text-slate-400 space-y-4">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-100" />
                    <p className="text-sm font-medium">All stock levels are optimal.</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
