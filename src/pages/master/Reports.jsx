import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  FileBarChart, 
  TrendingUp, 
  Users, 
  Package, 
  History, 
  ShieldCheck,
  Building2,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const isSuper = userData?.role === 'superadmin';

  const reportCategories = isSuper ? [
    {
      title: 'Platform Analytics',
      description: 'Global clinic growth, revenue distribution, and subscription health.',
      icon: Building2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      reports: [
        { name: 'Clinic Adoption Velocity', description: 'Monthly on-boarding trends', path: '/reports/adoption' },
        { name: 'Global Revenue Streams', description: 'Aggregate subscription income', path: '/accounting' }
      ]
    },
    {
      title: 'Governance & Compliance',
      description: 'Audit trail summaries and platform-wide security logs.',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      reports: [
        { name: 'Global Audit Summary', description: 'Anomalies and security events', path: '/superadmin/audit' },
        { name: 'Resource Utilization', description: 'Storage and compute usage per org', path: '/reports/usage' }
      ]
    }
  ] : [
    {
      title: 'Clinical Outcomes',
      description: 'Patient recovery stats, diagnosis frequency, and treatment success rates.',
      icon: History,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      reports: [
        { name: 'Diagnosis Frequency', description: 'Most common reoccurring cases', path: '/reports/outpatient' },
        { name: 'Clinical Efficacy', description: 'Outcome reports and patient recovery', path: '/reports/outcome' }
      ]
    },
    {
      title: 'Financial Revenue',
      description: 'Daily billing, outstanding invoices, and expense distribution.',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      reports: [
        { name: 'Daily Cashflow', description: 'Real-time billing analytics', path: '/reports/daily-cashflow' },
        { name: 'Insurance Performance', description: 'Claim turnaround and aging', path: '/reports/insurance-aging' }
      ]
    },
    {
      title: 'Inventory & Pharmacy',
      description: 'Stock consumption, expiry reports, and supplier analysis.',
      icon: Package,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      reports: [
        { name: 'Stock Consumption', description: 'Item-level usage trends', path: '/reports/inventory' },
        { name: 'Expiry Protocol', description: 'Critical stock expiration alerts', path: '/reports/inventory' }
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence & Reports</h1>
             <p className="text-slate-500 font-medium mt-1">Data-driven insights for {isSuper ? 'Platform Governance' : 'Clinical Excellence'}.</p>
          </div>
          <div className="flex bg-slate-100 p-2 rounded-2xl">
             <div className="px-6 py-2 bg-white rounded-xl shadow-sm text-xs font-black uppercase tracking-widest text-slate-900">
               {isSuper ? 'Global Overview' : 'Organization Context'}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {reportCategories.map((cat, i) => (
            <motion.div 
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8"
            >
              <div className="flex items-start gap-6">
                 <div className={`h-16 w-16 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center`}>
                    <cat.icon className="h-8 w-8" />
                 </div>
                 <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{cat.title}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">{cat.description}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {cat.reports.map(report => (
                    <button 
                      key={report.name}
                      onClick={() => navigate(report.path)}
                      className="group flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-[2rem] transition-all"
                    >
                       <div className="text-left">
                          <p className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors">{report.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{report.description}</p>
                       </div>
                       <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-primary-600 group-hover:border-primary-100 transition-all shadow-sm">
                          <ArrowUpRight className="h-5 w-5" />
                       </div>
                    </button>
                 ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
