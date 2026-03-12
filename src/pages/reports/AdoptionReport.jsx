import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Building2, TrendingUp, Users, BarChart3, Globe, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import facilityService from '../../services/facilityService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_CONFIG } from '../../config';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdoptionReport() {
  const [loading, setLoading] = useState(true);
  const [adoptionData, setAdoptionData] = useState([]);
  const [summary, setSummary] = useState({ totalClinics: 0, growthRate: '0%', activeTenants: 0 });

  useEffect(() => { fetchAdoptionStats(); }, []);

  const fetchAdoptionStats = async () => {
    try {
      setLoading(true);
      const facilities = await facilityService.getAllFacilities();

      const now = new Date();
      // Build last 6 months labels
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
      }

      // Count registrations per month from createdAt field
      const monthCounts = months.map(m => {
        const count = facilities.filter(f => {
          const created = f.createdAt?.seconds
            ? new Date(f.createdAt.seconds * 1000)
            : f.createdAt ? new Date(f.createdAt) : null;
          return created && created.getMonth() === m.month && created.getFullYear() === m.year;
        }).length;
        return { month: m.label, count };
      });

      // Revenue estimate: each clinic on a subscription plan
      const withRevenue = monthCounts.map(d => ({
        ...d,
        revenue: d.count * (APP_CONFIG.BASE_PLAN_PRICE || 250),
      }));

      // Growth rate: compare last month vs 2 months ago
      const last = withRevenue[withRevenue.length - 1]?.count || 0;
      const prev = withRevenue[withRevenue.length - 2]?.count || 0;
      const growthRate = prev > 0 ? `${last >= prev ? '+' : ''}${(((last - prev) / prev) * 100).toFixed(1)}%` : last > 0 ? '+100%' : 'N/A';

      setAdoptionData(withRevenue);
      setSummary({
        totalClinics: facilities.length,
        growthRate,
        activeTenants: facilities.filter(f => f.subscription?.status === 'active' || f.status === 'active').length,
      });
    } catch (error) {
      console.error('Error fetching adoption stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Clinic Adoption Velocity Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    const tableData = adoptionData.map(d => [d.month, d.count, `${APP_CONFIG.CURRENCY} ${d.revenue}`]);
    autoTable(doc, { head: [['Month', 'New Clinics', 'Est. Revenue']], body: tableData, startY: 40 });
    doc.save(`Adoption_Report_${Date.now()}.pdf`);
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center text-slate-500 italic font-medium">Synthesizing global growth metrics...</div></DashboardLayout>;

  const maxCount = Math.max(...adoptionData.map(d => d.count), 1);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <Globe className="h-8 w-8 text-indigo-600" />
              Clinic Adoption Velocity
            </h1>
            <p className="text-slate-500 mt-1">Platform-level on-boarding and subscription growth analysis.</p>
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-2xl hover:bg-slate-800 transition-all shadow-xl">
            <TrendingUp className="h-5 w-5" /> Export Growth PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Clinics', value: summary.totalClinics, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Active Tenants', value: summary.activeTenants, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Growth Velocity', value: summary.growthRate, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <div className={`h-16 w-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" /> Monthly Acquisition Trend
          </h3>

          <div className="flex items-end justify-between h-56 gap-4 px-4">
            {adoptionData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full relative flex flex-col justify-end" style={{ height: '100%' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / maxCount) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                    className="w-full bg-indigo-600 rounded-t-2xl shadow-lg shadow-indigo-100 group-hover:bg-indigo-500 transition-all min-h-[4px]"
                  />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap">
                    {d.count} clinic{d.count !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{d.month}</span>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-sm font-medium text-slate-900 mb-1">Platform Summary</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {summary.totalClinics} registered organizations, {summary.activeTenants} currently active on subscription.
                Month-over-month growth velocity is <strong>{summary.growthRate}</strong>.
              </p>
            </div>
            <div className="flex items-center gap-6 p-8">
              <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-emerald-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Est. Monthly Revenue</p>
                <p className="text-xl font-semibold text-emerald-600 mt-0.5">
                  {APP_CONFIG.CURRENCY} {(summary.activeTenants * (APP_CONFIG.BASE_PLAN_PRICE || 250)).toLocaleString()}
                </p>
                <p className="text-xs font-medium text-slate-400">Projected from active subscriptions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
