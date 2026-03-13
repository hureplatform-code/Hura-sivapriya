import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Banknote, TrendingUp, ArrowUpRight, Filter, Download, Receipt, PieChart, Activity, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import billingService from '../../services/billingService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_CONFIG } from '../../config';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';

export default function DailyCashflowReport() {
  const { userData } = useAuth();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({ cash: 0, digital: 0, insurance: 0, total: 0 });

  useEffect(() => { fetchCashflow(); }, []);

  const fetchCashflow = async () => {
    try {
      setLoading(true);
      const invoices = await billingService.getAllInvoices(userData?.facilityId);

      const today = new Date().toLocaleDateString();
      const todayInvoices = invoices.filter(inv => {
        const d = inv.createdAt?.seconds
          ? new Date(inv.createdAt.seconds * 1000)
          : new Date(inv.createdAt || inv.date);
        return d.toLocaleDateString() === today;
      });

      const txs = todayInvoices.map(inv => {
        const payMode = inv.payMode || inv.paymentMode || 'Cash';
        const time = inv.createdAt?.seconds
          ? new Date(inv.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--:--';
        return {
          time,
          ref: inv.invoiceNo || inv.id?.slice(-6).toUpperCase() || '—',
          patient: inv.patientName || 'Patient',
          mode: payMode,
          amt: parseFloat(inv.totalAmount || inv.payAmount || 0),
          status: inv.paymentStatus === 'paid' ? 'Paid' : inv.type === 'Insurance' ? 'Claimed' : 'Pending',
        };
      }).sort((a, b) => b.time.localeCompare(a.time));

      setTransactions(txs);
      setMetrics({
        cash: txs.filter(t => t.mode === 'Cash').reduce((a, b) => a + b.amt, 0),
        digital: txs.filter(t => ['Card', 'Digital', 'Online'].includes(t.mode)).reduce((a, b) => a + b.amt, 0),
        insurance: txs.filter(t => t.mode === 'Insurance').reduce((a, b) => a + b.amt, 0),
        total: txs.reduce((a, b) => a + b.amt, 0),
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
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    const tableData = transactions.map(t => [t.time, t.ref, t.patient, t.mode, `${currency} ${t.amt.toLocaleString()}`, t.status]);
    autoTable(doc, { head: [['Time', 'Reference', 'Patient', 'Mode', 'Amount', 'Status']], body: tableData, startY: 40 });
    doc.save(`Cashflow_${Date.now()}.pdf`);
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center text-slate-500 italic font-medium">Reconciling daily ledgers...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <Banknote className="h-8 w-8 text-emerald-600" />
              Daily Cashflow & Liquidity
            </h1>
            <p className="text-slate-500 mt-1">Reconciliation of today's clinical revenue, collection channels, and pending payouts.</p>
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-2xl hover:bg-slate-800 transition-all shadow-xl">
            <Download className="h-5 w-5" /> Report Snapshot
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Collection', value: metrics.total, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Cash In-Hand', value: metrics.cash, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Digital / Card', value: metrics.digital, icon: PieChart, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Insurance Float', value: metrics.insurance, icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xs font-semibold text-slate-400">{currency}</span>
                <p className="text-2xl font-semibold text-slate-900 tracking-tighter">{stat.value.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Transaction Stream</h3>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest">
              <TrendingUp className="h-4 w-4" /> Today — {new Date().toLocaleDateString()}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="font-medium">No transactions recorded for today yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-50">
                    {['Timeline', 'Subject Info', 'Channel', 'Value', 'Protocol'].map(h => (
                      <th key={h} className={`pb-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4${h === 'Value' ? ' text-right' : h === 'Protocol' ? ' text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((tx, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-6 px-4">
                        <p className="font-medium text-slate-900 text-sm">{tx.time}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">{tx.ref}</p>
                      </td>
                      <td className="py-6 px-4">
                        <p className="font-medium text-slate-900 text-sm">{tx.patient}</p>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest border
                          ${tx.mode === 'Cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            tx.mode === 'Insurance' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {tx.mode}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <p className="font-medium text-slate-900">{currency} {tx.amt.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-medium mt-1">Gross Payment</p>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {tx.status === 'Paid' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-400" />}
                          <span className="text-[10px] font-medium uppercase text-slate-600">{tx.status}</span>
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
    </DashboardLayout>
  );
}
