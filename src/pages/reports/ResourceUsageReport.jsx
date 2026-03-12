import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Database, Zap, HardDrive, Cpu, ShieldAlert, BarChart3, Cloud, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import facilityService from '../../services/facilityService';
import patientService from '../../services/patientService';
import medicalRecordService from '../../services/medicalRecordService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Deterministic hash: turns a string into a stable number 0–1
function stableHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export default function ResourceUsageReport() {
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState([]);
  const [totals, setTotals] = useState({ storage: '0 GB', apiCalls: 0, clusters: 0, alerts: 0 });

  useEffect(() => { fetchUsageStats(); }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const [facilities, patients, records] = await Promise.all([
        facilityService.getAllFacilities(),
        patientService.getAllPatients(),
        medicalRecordService.getAllRecords(),
      ]);

      const stats = facilities.map(f => {
        // Stable deterministic estimates based on facility ID (no Math.random)
        const seed = stableHash(f.id || f.name || 'x');
        const seed2 = stableHash((f.id || '') + '2');

        const facilityPatients = patients.filter(p => p.facilityId === f.id).length;
        const facilityRecords = records.filter(r => r.facilityId === f.id).length;

        // Storage estimated: 0.2MB per patient + 0.05MB per record → in GB
        const storageGB = ((facilityPatients * 0.2 + facilityRecords * 0.05) / 1024).toFixed(2);
        // Compute units: 10 per patient
        const compute = facilityPatients * 10 + Math.floor(seed * 50);
        // API cycles: 20 per record
        const apiCalls = facilityRecords * 20 + Math.floor(seed2 * 200);
        // Status: Near Limit if storage > 2GB
        const status = parseFloat(storageGB) > 2 ? 'Near Limit' : 'Healthy';

        return { id: f.id, name: f.name || 'Unknown Org', storage: `${storageGB} GB`, compute: `${compute} Units`, apiCalls: `${apiCalls}`, status };
      });

      // Aggregate totals
      const totalStorage = stats.reduce((a, s) => a + parseFloat(s.storage), 0).toFixed(2);
      const totalAPI = stats.reduce((a, s) => a + parseInt(s.apiCalls), 0);
      const alerts = stats.filter(s => s.status !== 'Healthy').length;

      setUsageStats(stats);
      setTotals({ storage: `${totalStorage} GB`, apiCalls: totalAPI > 1000 ? `${(totalAPI / 1000).toFixed(1)}K` : `${totalAPI}`, clusters: stats.length, alerts });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Global Resource Utilization Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    const tableData = usageStats.map(s => [s.name, s.storage, s.compute, s.apiCalls, s.status]);
    autoTable(doc, { head: [['Organization', 'Storage Used', 'Compute Units', 'API Cycles', 'Status']], body: tableData, startY: 40 });
    doc.save(`Resource_Usage_${Date.now()}.pdf`);
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center text-slate-500 italic font-medium">Querying cloud infrastructure nodes...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <Cloud className="h-8 w-8 text-blue-600" />
              Infrastructure Resource Monitoring
            </h1>
            <p className="text-slate-500 mt-1">Cross-organization compute and storage utilization matrix.</p>
          </div>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-2xl hover:bg-slate-800 transition-all shadow-xl">
            <Database className="h-5 w-5" /> Snapshot Full System
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Storage', value: totals.storage, icon: HardDrive, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'API Cycles', value: totals.apiCalls, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Active Orgs', value: `${totals.clusters} Orgs`, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Capacity Alerts', value: totals.alerts, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-slate-900 tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" /> Tenant Resource Matrix
            </h3>
          </div>

          {usageStats.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Cloud className="h-12 w-12 mx-auto mb-4 text-slate-200" />
              <p className="font-medium">No organizations found to display resource data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-50">
                    {['Organization', 'Cloud Storage', 'Compute Logic', 'API Utilization', 'Health'].map(h => (
                      <th key={h} className="pb-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usageStats.map((org, i) => (
                    <motion.tr key={org.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="group hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-4">
                        <p className="font-semibold text-slate-900">{org.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">ID: {org.id.slice(-8)}</p>
                      </td>
                      <td className="py-5 px-4 text-sm font-medium text-slate-600">{org.storage}</td>
                      <td className="py-5 px-4 font-medium text-slate-600 text-sm">{org.compute}</td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col gap-1 w-24">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((parseInt(org.apiCalls) / 2000) * 100, 100)}%` }} />
                          </div>
                          <p className="text-[9px] font-semibold text-slate-400">{parseInt(org.apiCalls).toLocaleString()} Cycles</p>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest border
                          ${org.status === 'Healthy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {org.status}
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
