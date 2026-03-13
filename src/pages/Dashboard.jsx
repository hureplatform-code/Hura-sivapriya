import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Building2, 
  UserRound, 
  Users, 
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  History,
  AlertCircle,
  Calendar,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import userService from '../services/userService';
import appointmentService from '../services/appointmentService';
import billingService from '../services/billingService';
import auditService from '../services/auditService';
import patientService from '../services/patientService';
import medicalRecordService from '../services/medicalRecordService';
import facilityService from '../services/facilityService';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../config';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Dashboard() {
  const { currency } = useCurrency();
  const { userData } = useAuth();
  const role = userData?.role || 'clinic_owner';
  const [stats, setStats] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [role]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // SRS RULE: Superadmin CANNOT access patient records
      const isSuperadmin = role === 'superadmin' || role === 'platform_owner';
      
      const promises = [
        userService.getAllUsers(),
        appointmentService.getAllAppointments(isSuperadmin ? null : userData?.facilityId),
        billingService.getAllInvoices(isSuperadmin ? null : userData?.facilityId),
        billingService.getFinancialStats(isSuperadmin ? null : userData?.facilityId),
        auditService.getRecentLogs(6, isSuperadmin ? null : userData?.facilityId)
      ];
      
      if (!isSuperadmin) {
        promises.push(patientService.getAllPatients(userData?.facilityId));
        promises.push(medicalRecordService.getAllRecords(userData?.facilityId));
      } else {
        promises.push(Promise.resolve([])); // Patients placeholder
        promises.push(Promise.resolve([])); // Records placeholder
      }

      const [users, appointments, invoices, billingStats, logs, patients, allRecords] = await Promise.all(promises);

      const today = new Date().toLocaleDateString();
      const completedToday = appointments.filter(a => a.status === 'completed' && new Date(a.date).toLocaleDateString() === today).length;
      const pendingNotes = allRecords ? allRecords.filter(r => r.status === 'draft').length : 0;
      const overdueNotes = allRecords ? allRecords.filter(r => r.status === 'draft' && (new Date() - new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : Date.now())) > 86400000).length : 0;

      if (isSuperadmin) {
        // PLATFORM GOVERNANCE VIEW
        const allFacilities = await facilityService.getAllFacilities();
        const totalOrganizations = allFacilities.length;
        const activeSubscribers = allFacilities.filter(f => f.subscription?.status === 'active').length;
        const totalRevenueEstimate = allFacilities.reduce((sum, f) => {
           const plan = (f.subscription?.planName || 'Essential').toLowerCase();
           const monthly = plan === 'professional' ? 5000 : plan === 'enterprise' ? 15000 : 2500;
           return sum + monthly;
        }, 0);

        setStats([
          { label: 'Total Clinics', value: totalOrganizations.toString(), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Orgs', value: activeSubscribers.toString(), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Platform Revenue', value: `${currency} ${totalRevenueEstimate.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Global Audit Logs', value: logs.length.toString(), icon: History, color: 'text-slate-600', bg: 'bg-slate-50' },
        ]);
        setArrears([]); // Hide clinic arrears
      } else if (role === 'doctor') {
        setStats([
          { label: "Today's Patients", value: appointments.filter(a => new Date(a.date).toLocaleDateString() === today).length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Notes', value: pendingNotes.toString(), icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Avg Time/Visit', value: '15 min', icon: History, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Completed Today', value: completedToday.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ]);
        setArrears(invoices.filter(i => i.paymentStatus !== 'paid').slice(0, 4));
      } else {
        const arrearsRate = billingStats.revenue > 0 
          ? ((billingStats.outstanding / (billingStats.revenue + billingStats.outstanding)) * 100).toFixed(1) + '%' 
          : '0%';

        setStats([
          { label: 'Overdue Notes (>24h)', value: overdueNotes.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Active Doctors', value: users.filter(u => u.role === 'doctor').length.toString(), icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Monthly Revenue', value: `${currency} ${billingStats.revenue.toLocaleString()}`, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Arrears Rate', value: arrearsRate, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ]);
        setArrears(invoices.filter(i => i.paymentStatus !== 'paid').slice(0, 4));
      }

      setAuditLogs(logs || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <h1 className="text-2xl font-semibold text-slate-900 tracking-tight capitalize">
               {role === 'doctor' ? 'Clinical Overview' : 'Administrative Dashboard'}
             </h1>
             <p className="text-slate-500 mt-1">
               Welcome back, <span className="font-medium text-slate-900">{userData?.name || 'Jon Day'}</span>. Here's your {role} focus for today.
             </p>
           </div>
           <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
             <Calendar className="h-4 w-4 text-primary-500" />
             <span className="text-sm font-medium text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
           </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">{stat.value}</h3>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Visual Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 flex flex-col items-center justify-center relative overflow-hidden group">
            <h3 className="text-lg font-semibold text-slate-900 mb-8 self-start">Operations Efficiency</h3>
            <div className="relative h-64 w-64 z-10">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#4f46e5" strokeWidth="12" strokeDasharray="180 251" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Growth</span>
                <span className="text-2xl font-semibold text-slate-900">+72%</span>
              </div>
            </div>
            <div className="flex gap-8 mt-10">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-lg bg-indigo-600" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Current Quarter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-lg bg-slate-100" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Previous</span>
              </div>
            </div>
            <div className="absolute -left-20 -top-20 h-64 w-64 bg-primary-50/20 rounded-full blur-3xl" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-tight">Recent Activity Log</h3>
              <div className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400">
                <History className="h-5 w-5" />
              </div>
            </div>

            <div className="flex-1 space-y-6">
              {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group hover:bg-white border-2 border-transparent hover:border-emerald-100 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <ShieldCheck className={`h-6 w-6 ${log.module === 'CLINICAL' ? 'text-primary-500' : 'text-emerald-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{log.description}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{log.userName} • {log.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                       {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                   <p>Initial system boot complete. Waiting for clinical activity...</p>
                </div>
              )}
            </div>

            <button className="w-full mt-8 py-4 bg-slate-900 text-white font-medium text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
               Audit Full Ledger
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CheckCircle({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
