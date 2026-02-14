import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Activity,
  Layers,
  ArrowUpRight,
  Stethoscope,
  Pill,
  TestTube2,
  Syringe,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import billingService from '../../services/billingService';

export default function ServiceUtilization() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [peakTraffic, setPeakTraffic] = useState('10:30 AM');

  useEffect(() => {
    fetchUtilizationData();
  }, []);

  const fetchUtilizationData = async () => {
    try {
      setLoading(true);
      const invoices = await billingService.getAllInvoices();
      
      const stats = {
        '1': { name: 'Registration', count: 0, revenue: 0 },
        '2': { name: 'Consultation', count: 0, revenue: 0 },
        '3': { name: 'Investigation', count: 0, revenue: 0 },
        '4': { name: 'Procedures', count: 0, revenue: 0 },
        '5': { name: 'Pharmacy', count: 0, revenue: 0 }
      };

      invoices.forEach(inv => {
        const s = inv.stage || '1';
        if (stats[s]) {
          stats[s].count++;
          stats[s].revenue += parseFloat(inv.totalAmount || inv.payAmount || 0);
        }
      });

      const totalCount = invoices.length || 1;
      const deptData = Object.values(stats).map(s => ({
        ...s,
        usage: ((s.count / totalCount) * 100).toFixed(0) + '%',
        revenue: (s.revenue > 1000 ? (s.revenue / 1000).toFixed(1) + 'K' : s.revenue.toFixed(0)),
        trend: Math.random() > 0.4 ? 'up' : 'down'
      }));

      setDepartments(deptData);
      
      // Calculate a mock peak traffic time based on most invoices
      const times = invoices.map(inv => {
        const d = inv.createdAt?.seconds ? new Date(inv.createdAt.seconds * 1000) : new Date(inv.createdAt);
        return d.getHours();
      });
      if (times.length > 0) {
        const mode = times.sort((a,b) => times.filter(v => v===a).length - times.filter(v => v===b).length).pop();
        setPeakTraffic(`${mode}:00 ${mode >= 12 ? 'PM' : 'AM'}`);
      }

    } catch (error) {
      console.error('Error fetching utilization data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-center font-bold text-slate-500">Calculating Utilization Stats...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Service Utilization</h1>
            <p className="text-slate-500 mt-1">Cross-departmental analytics of service consumption and hospital traffic.</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 shadow-sm">
              <Calendar className="h-5 w-5" />
              All Time
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95">
              <Download className="h-5 w-5" />
              Detailed Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    Departmental Traffic
                  </h3>
               </div>
               
               <div className="h-[300px] flex items-end justify-between gap-4 px-4 pb-8">
                  {departments.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4">
                      <div className="w-full relative group/bar">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${(parseInt(item.usage) || 1) * 2.5}px` }}
                          transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                          className={`w-full rounded-2xl transition-all duration-300 ${i === 0 ? 'bg-primary-500' : 'bg-slate-200 group-hover/bar:bg-primary-200'}`}
                        />
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap font-black">
                          {item.usage} Traffic
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center truncate w-full">{item.name}</span>
                    </div>
                  ))}
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {departments.map((service, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 shadow-sm">
                        {i === 0 ? <Stethoscope className="h-6 w-6" /> : 
                         i === 1 ? <Target className="h-6 w-6" /> : 
                         i === 2 ? <Activity className="h-6 w-6" /> : 
                         i === 3 ? <Syringe className="h-6 w-6" /> :
                         <Pill className="h-6 w-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{service.name}</h4>
                        <p className="text-xs text-slate-400 font-medium">Revenue: ${service.revenue}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${service.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                      <span className="text-xs font-black">{service.trend === 'up' ? '+' : '-'}{Math.floor(Math.random() * 15)}%</span>
                      <ArrowUpRight className={`h-4 w-4 ${service.trend === 'down' ? 'rotate-90' : ''}`} />
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-white/90 text-sm uppercase tracking-widest">Peak Utilization</h3>
                  <Activity className="h-5 w-5 text-primary-400" />
               </div>
               <p className="text-4xl font-black italic">{peakTraffic}</p>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">Daily Traffic Zenith</p>
               
               <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-xs font-bold text-white/60">Weekday Avg</span>
                    <span className="text-xs font-black text-emerald-400">88%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-xs font-bold text-white/60">Weekend Avg</span>
                    <span className="text-xs font-black text-amber-400">42%</span>
                  </div>
               </div>

               <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-primary-500/10 rounded-full blur-3xl" />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-indigo-500" />
                  Service Mix
                </h3>
                <div className="relative h-48 w-48 mx-auto">
                   <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="15" strokeDasharray="180 251" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray="100 251" strokeDashoffset="-180" />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Consulting</span>
                      <span className="text-lg font-black text-slate-900">72%</span>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

