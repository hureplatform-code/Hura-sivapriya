import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, Download, BarChart3, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import billingService from '../../services/billingService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_CONFIG } from '../../config';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function InsuranceAgingReport() {
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [claimsData, setClaimsData] = useState([]);
  const [summary, setSummary] = useState({ pendingValue: 0, avgAging: '0 days', denialRate: '0%' });

  useEffect(() => { fetchAgingStats(); }, []);

  const fetchAgingStats = async () => {
    try {
      setLoading(true);
      const invoices = await billingService.getAllInvoices();

      // Filter insurance invoices
      const insuranceClaims = invoices.filter(inv =>
        inv.payMode === 'Insurance' || inv.paymentMode === 'Insurance' || inv.type === 'Insurance'
      );

      const now = new Date();
      const processed = insuranceClaims.map(inv => {
        const created = inv.createdAt?.seconds
          ? new Date(inv.createdAt.seconds * 1000)
          : new Date(inv.createdAt || inv.date);
        const days = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
        const statusMap = {
          paid: 'Approved',
          pending: days > 30 ? 'Delayed' : 'Processing',
          overdue: 'Under Review',
        };
        return {
          patient: inv.patientName || 'Unknown Patient',
          provider: inv.insuranceProvider || inv.vendor || 'Insurance Provider',
          amount: parseFloat(inv.totalAmount || inv.payAmount || 0),
          days,
          status: statusMap[inv.paymentStatus] || (days > 30 ? 'Delayed' : 'Processing'),
          id: inv.id,
        };
      });

      const pending = processed.filter(c => c.status !== 'Approved');
      const pendingValue = pending.reduce((acc, c) => acc + c.amount, 0);
      const avgDays = processed.length > 0
        ? (processed.reduce((a, c) => a + c.days, 0) / processed.length).toFixed(1)
        : 0;
      const denied = processed.filter(c => c.status === 'Delayed' || c.status === 'Under Review').length;
      const denialRate = processed.length > 0 ? ((denied / processed.length) * 100).toFixed(1) + '%' : '0%';

      setClaimsData(processed.sort((a, b) => b.days - a.days));
      setSummary({ pendingValue, avgAging: `${avgDays} Days`, denialRate });
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
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    const tableData = claimsData.map(c => [c.patient, c.provider, `${currency} ${c.amount.toLocaleString()}`, `${c.days}d`, c.status]);
    autoTable(doc, { head: [['Patient Subject', 'Insurance Provider', 'Claim Amt', 'Aging', 'Status']], body: tableData, startY: 40 });
    doc.save(`Insurance_Aging_${Date.now()}.pdf`);
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center text-slate-500 italic font-medium">Calculating claim actuarial data...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
              Insurance Performance Protocol
            </h1>
            <p className="text-slate-500 mt-1">Monitoring claim turnaround, denial rates, and revenue aging segments.</p>
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-2xl hover:bg-slate-800 transition-all shadow-xl">
            <Download className="h-5 w-5" /> Export Audit Matrix
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Pending Receivables', value: `${currency} ${summary.pendingValue.toLocaleString()}`, icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Avg Claim Cycle', value: summary.avgAging, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Claim Denial Rate', value: summary.denialRate, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className={`h-14 w-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-slate-900 tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-400" />
              Active Claims Queue
            </h3>
          </div>

          {claimsData.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="font-medium">No insurance claims found in the system yet.</p>
              <p className="text-xs mt-2">Insurance-billed invoices will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-50">
                    {['Subject', 'Carrier', 'Amount', 'Aging', 'Protocol'].map(h => (
                      <th key={h} className="pb-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {claimsData.map((claim, i) => (
                    <motion.tr key={claim.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-6 px-4">
                        <p className="font-medium text-slate-900">{claim.patient}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">ID: {claim.id?.slice(-6).toUpperCase() || '—'}</p>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-sm font-medium text-slate-600">{claim.provider}</span>
                      </td>
                      <td className="py-6 px-4">
                        <p className="font-semibold text-slate-900">{currency} {claim.amount.toLocaleString()}</p>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className={`h-4 w-4 ${claim.days > 30 ? 'text-red-500' : 'text-slate-300'}`} />
                          <span className={`text-sm font-medium ${claim.days > 30 ? 'text-red-600' : 'text-slate-600'}`}>{claim.days} Days</span>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest border
                          ${claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            claim.status === 'Delayed' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {claim.status}
                        </span>
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
