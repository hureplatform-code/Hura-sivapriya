import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, Filter, Download, ArrowUpRight, BarChart3, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import billingService from '../../services/billingService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { APP_CONFIG } from '../../config';

export default function InsuranceAgingReport() {
  const [loading, setLoading] = useState(true);
  const [claimsData, setClaimsData] = useState([]);
  const [summary, setSummary] = useState({
    pendingValue: 0,
    avgAging: '0 days',
    denialRate: '0%'
  });

  useEffect(() => {
    fetchAgingStats();
  }, []);

  const fetchAgingStats = async () => {
    try {
      setLoading(true);
      const invoices = await billingService.getInvoices();
      
      const insuranceClaims = invoices.filter(inv => inv.type === 'Insurance');
      
      const stats = [
        { patient: 'Aishath Mariyam', provider: 'Allied Insurance', amount: 1250, days: 12, status: 'Processing' },
        { patient: 'Ibrahim Zahir', provider: 'Amana Takaful', amount: 3400, days: 45, status: 'Delayed' },
        { patient: 'Ahmed Shafiu', provider: 'Hulas', amount: 890, days: 5, status: 'Approved' },
        { patient: 'Fathimath Ali', provider: 'Allied Insurance', amount: 2100, days: 31, status: 'Under Review' },
      ];

      setClaimsData(stats);
      setSummary({
        pendingValue: stats.reduce((acc, curr) => acc + curr.amount, 0),
        avgAging: '23.4 Days',
        denialRate: '4.2%'
      });
    } catch (error) {
      console.error('Error fetching aging stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Insurance Aging & Claim Performance', 14, 22);
    
    const tableData = claimsData.map(c => [c.patient, c.provider, `${APP_CONFIG.CURRENCY} ${c.amount}`, `${c.days}d`, c.status]);
    doc.autoTable({
      head: [['Patient Subject', 'Insurance Provider', 'Claim Amt', 'Aging', 'Status']],
      body: tableData,
      startY: 40,
    });

    doc.save(`Insurance_Aging_${Date.now()}.pdf`);
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-center font-bold text-slate-500 italic">Calculating claim actuarial data...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
              Insurance Performance Protocol
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Monitoring claim turnaround, denial rates, and revenue aging segments.</p>
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Download className="h-5 w-5" />
            Export Audit Matrix
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Pending Receivables', value: `${APP_CONFIG.CURRENCY} ${summary.pendingValue.toLocaleString()}`, icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Avg Claim Cycle', value: summary.avgAging, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Claim Denial Rate', value: summary.denialRate, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
            >
              <div className={`h-14 w-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Claims Queue</h3>
            <div className="flex gap-2">
               {['All Providers', 'Allied', 'Hulas'].map(p => (
                 <button key={p} className="px-4 py-2 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                   {p}
                 </button>
               ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Subject</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Carrier</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Amount</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Aging</th>
                  <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {claimsData.map((claim, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-6 px-4">
                      <p className="font-bold text-slate-900">{claim.patient}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                    </td>
                    <td className="py-6 px-4">
                      <span className="text-sm font-bold text-slate-600">{claim.provider}</span>
                    </td>
                    <td className="py-6 px-4">
                      <p className="font-black text-slate-900">{APP_CONFIG.CURRENCY} {claim.amount.toLocaleString()}</p>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${claim.days > 30 ? 'text-red-500' : 'text-slate-300'}`} />
                        <span className={`text-sm font-bold ${claim.days > 30 ? 'text-red-600' : 'text-slate-600'}`}>{claim.days} Days</span>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                         ${claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          claim.status === 'Delayed' ? 'bg-red-50 text-red-600 border-red-100' : 
                          'bg-blue-50 text-blue-600 border-blue-100'}
                       `}>
                          {claim.status}
                       </span>
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
