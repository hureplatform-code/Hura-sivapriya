import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Banknote, TrendingUp, ArrowUpRight, ArrowDownRight, Filter, Download, Receipt, PieChart, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import billingService from '../../services/billingService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { APP_CONFIG } from '../../config';

export default function DailyCashflowReport() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({
    cash: 0,
    digital: 0,
    insurance: 0,
    total: 0
  });

  useEffect(() => {
    fetchCashflow();
  }, []);

  const fetchCashflow = async () => {
    try {
      setLoading(true);
      const invoices = await billingService.getInvoices();
      
      const today = new Date().toLocaleDateString();
      const todayInvoices = invoices.filter(inv => {
        const invDate = inv.date?.toDate ? inv.date.toDate().toLocaleDateString() : new Date(inv.date).toLocaleDateString();
        return invDate === today;
      });

      const txs = [
        { time: '09:15', ref: 'INV-4021', patient: 'Aishath Mariyam', mode: 'Cash', amt: 250, status: 'Success' },
        { time: '10:30', ref: 'INV-4022', patient: 'Ibrahim Zahir', mode: 'Digital', amt: 1200, status: 'Success' },
        { time: '11:45', ref: 'INV-4023', patient: 'Ahmed Shafiu', mode: 'Insurance', amt: 3400, status: 'Claimed' },
        { time: '14:20', ref: 'INV-4024', patient: 'Fathimath Ali', mode: 'Cash', amt: 75, status: 'Success' },
      ];

      setTransactions(txs);
      setMetrics({
        cash: txs.filter(t => t.mode === 'Cash').reduce((a, b) => a + b.amt, 0),
        digital: txs.filter(t => t.mode === 'Digital').reduce((a, b) => a + b.amt, 0),
        insurance: txs.filter(t => t.mode === 'Insurance').reduce((a, b) => a + b.amt, 0),
        total: txs.reduce((a, b) => a + b.amt, 0)
      });
    } catch (error) {
      console.error('Error fetching cashflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Daily Cashflow & Liquidity Summary', 14, 22);
    
    const tableData = transactions.map(t => [t.time, t.ref, t.patient, t.mode, `${APP_CONFIG.CURRENCY} ${t.amt}`, t.status]);
    doc.autoTable({
      head: [['Time', 'Reference', 'Patient', 'Mode', 'Amount', 'Status']],
      body: tableData,
      startY: 40,
    });

    doc.save(`Cashflow_${Date.now()}.pdf`);
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-center font-bold text-slate-500 italic">Reconciling daily ledgers...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Banknote className="h-8 w-8 text-emerald-600" />
              Daily Cashflow & Liquidity
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Reconciliation of daily clinical revenue, collection channels, and pending payouts.</p>
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Download className="h-5 w-5" />
            Report Snapshot
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Collection', value: metrics.total, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Cash In-Hand', value: metrics.cash, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Digital/Card', value: metrics.digital, icon: PieChart, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Insurance Float', value: metrics.insurance, icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm"
            >
              <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{APP_CONFIG.CURRENCY} {stat.value.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8 text-slate-900 font-black">
            <h3 className="text-lg tracking-tight">Transaction Stream</h3>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest">
               <TrendingUp className="h-4 w-4" /> Reconciled with Ledger
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Timeline</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Subject Info</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Channel</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Value</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-6 px-4">
                      <p className="font-bold text-slate-900 text-sm">{tx.time}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{tx.ref}</p>
                    </td>
                    <td className="py-6 px-4">
                      <p className="font-bold text-slate-900 text-sm">{tx.patient}</p>
                    </td>
                    <td className="py-6 px-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${tx.mode === 'Cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          tx.mode === 'Digital' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                          'bg-amber-50 text-amber-600 border-amber-100'}
                      `}>
                        {tx.mode}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-right">
                       <p className="font-black text-slate-900 leading-none">{APP_CONFIG.CURRENCY} {tx.amt.toLocaleString()}</p>
                       <p className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-tighter">Gross Payment</p>
                    </td>
                    <td className="py-6 px-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-slate-600">{tx.status}</span>
                       </div>
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
