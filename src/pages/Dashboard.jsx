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
  CheckCircle2,
  Activity,
  ChevronRight,
  Plus,
  Volume2,
  Play,
  ArrowRight,
  Thermometer,
  Package,
  Box,
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import userService from '../services/userService';
import appointmentService from '../services/appointmentService';
import billingService from '../services/billingService';
import auditService from '../services/auditService';
import patientService from '../services/patientService';
import medicalRecordService from '../services/medicalRecordService';
import facilityService from '../services/facilityService';
import inventoryService from '../services/inventoryService';
import medicalMasterService from '../services/medicalMasterService';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../config';
import { useCurrency } from '../contexts/CurrencyContext';
import AppointmentModal from '../components/modals/AppointmentModal';
import { useToast } from '../contexts/ToastContext';

export default function Dashboard() {
  const { currency } = useCurrency();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const role = userData?.role || 'clinic_owner';
  const [stats, setStats] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    if (userData) {
      fetchDashboardStats();
    }
  }, [userData, role]);

  const fetchDashboardStats = async () => {
    if (!userData) return;
    try {
      setLoading(true);
      
      // SRS RULE: Superadmin CANNOT access patient records
      const isSuperadmin = role === 'superadmin' || role === 'platform_owner';
      
      const promises = [
        userService.getAllUsers(),
        appointmentService.getAllAppointments(isSuperadmin ? null : userData?.facilityId),
        billingService.getAllInvoices(isSuperadmin ? null : userData?.facilityId),
        billingService.getFinancialStats(isSuperadmin ? null : userData?.facilityId),
        auditService.getRecentLogs(4, isSuperadmin ? null : userData?.facilityId)
      ];
      
      if (!isSuperadmin) {
        promises.push(patientService.getAllPatients(userData?.facilityId));
        promises.push(medicalRecordService.getAllRecords(userData?.facilityId));
      } else {
        promises.push(Promise.resolve([])); // Patients placeholder
        promises.push(Promise.resolve([])); // Records placeholder
      }

      const [users, appointments, invoices, billingStats, logs, patientsRes, allRecordsRes] = await Promise.all(promises);

      // Handle paginated responses if necessary
      const patients = patientsRes?.patients || patientsRes || [];
      const allRecords = allRecordsRes?.records || allRecordsRes?.items || allRecordsRes || [];

      const today = new Date().toLocaleDateString();
      const completedToday = (appointments || []).filter(a => a.status === 'completed' && new Date(a.date).toLocaleDateString() === today).length;
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

        // Fetch AT Balance for dashboard widget
        let providerBal = 'N/A';
        try {
          const smsService = await import('../services/smsSettingsService');
          providerBal = await smsService.default.getAtBalance() || 'N/A';
        } catch (e) { console.error("Error loading sms service", e); }

        setStats([
          { label: 'Total Clinics', value: totalOrganizations.toString(), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', path: '/superadmin/subscriptions' },
          { label: 'Active Orgs', value: activeSubscribers.toString(), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/superadmin/subscriptions' },
          { label: 'Platform Revenue', value: `${currency} ${totalRevenueEstimate.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', path: '/accounting' },
          { label: 'AT Master Balance', value: providerBal, icon: History, color: providerBal.includes('-') ? 'text-red-600' : 'text-slate-600', bg: providerBal.includes('-') ? 'bg-red-50' : 'bg-slate-50', path: '/config/sms' },
        ]);
        setArrears([]); // Hide clinic arrears
      } else if (role === 'doctor' || role === 'nurse' || role === 'receptionist') {
        const focusLabel = role === 'doctor' ? "Today's Focus" : "Today's Schedule";
        setStats([
          { label: focusLabel, value: appointments.filter(a => new Date(a.date).toLocaleDateString() === today).length.toString() + ' Patients', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/appointments' },
          { label: 'Clinical Documentation', value: pendingNotes.toString() + ' Pending', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', path: '/notes' },
          { label: 'Workload Status', value: 'Steady', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', path: '/appointments' },
          { label: 'Discharged Today', value: completedToday.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/appointments' },
        ]);
        const todayApts = appointments
          .filter(a => new Date(a.date).toLocaleDateString() === today)
          .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

        setArrears(todayApts.slice(0, 4));
      } else if (role === 'lab_tech') {
        const awaitingLab = appointments.filter(a => a.status === 'awaiting-lab').length;
        setStats([
          { label: 'Awaiting Lab', value: awaitingLab.toString() + ' Patients', icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-50', path: '/lab/queue' },
          { label: 'Workload', value: awaitingLab > 5 ? 'High' : 'Normal', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', path: '/lab/queue' },
          { label: 'Tests Today', value: appointments.filter(a => a.labCompletedAt && new Date(a.labCompletedAt).toLocaleDateString() === today).length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/lab/queue' },
          { label: 'System Health', value: 'Online', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', path: '/' },
        ]);
        const labQueue = appointments.filter(a => a.status === 'awaiting-lab').slice(0, 4);
        setArrears(labQueue);
      } else if (role === 'pharmacist' || role === 'pharmacist_admin') {
        const [inventory, pharmaMaster, nonPharmaMaster] = await Promise.all([
          inventoryService.getInventory(userData?.facilityId),
          medicalMasterService.getAll('pharma'),
          medicalMasterService.getAll('nonPharma')
        ]);

        const allItems = [...inventory, ...pharmaMaster, ...nonPharmaMaster];

        const lowStock = allItems.filter(i => {
          const s = i.availableStock ?? i.availableLevel ?? i.stock ?? i.quantity ?? 0;
          const stockNum = typeof s === 'string' ? parseFloat(s) : s;
          const threshold = i.reorderLevel || 10;
          return stockNum <= threshold && stockNum > 0;
        });
        const outOfStock = allItems.filter(i => {
          const s = i.availableStock ?? i.availableLevel ?? i.stock ?? i.quantity ?? 0;
          const stockNum = typeof s === 'string' ? parseFloat(s) : s;
          return stockNum <= 0;
        });
        
        const awaitingPharmacy = appointments.filter(a => a.status === 'awaiting-pharmacy').length;

        setStats([
          { label: 'Awaiting Pharmacy', value: awaitingPharmacy.toString() + ' Patients', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', path: '/pharmacy/queue' },
          { label: 'Out of Stock', value: outOfStock.length.toString() + ' Items', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', path: '/config/pharmacy' },
          { label: 'Low Stock Alerts', value: lowStock.length.toString() + ' Items', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', path: '/config/pharmacy' },
          { label: 'Inventory Health', value: allItems.length > 0 ? (((allItems.length - outOfStock.length) / allItems.length) * 100).toFixed(0) + '%' : '100%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/config/pharmacy' },
        ]);

        setLowStockItems([...outOfStock, ...lowStock].slice(0, 4));
        setArrears(appointments.filter(a => a.status === 'awaiting-pharmacy').slice(0, 4));
      } else {
        const arrearsRate = billingStats.revenue > 0 
          ? ((billingStats.outstanding / (billingStats.revenue + billingStats.outstanding)) * 100).toFixed(1) + '%' 
          : '0%';

        setStats([
          { label: 'Overdue Notes (>24h)', value: overdueNotes.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', path: '/notes' },
          { label: 'Active Doctors', value: users.filter(u => u.role === 'doctor').length.toString(), icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/master/users' },
          { label: 'Monthly Revenue', value: `${currency} ${billingStats.revenue.toLocaleString()}`, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', path: '/billing' },
          { label: 'Arrears Rate', value: arrearsRate, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', path: '/billing' },
        ]);
        setArrears(invoices.filter(i => i.paymentStatus !== 'paid').slice(0, 4));
      }

      setAuditLogs(logs?.slice(0, 4) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallIn = async (appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, 'calling');
      success('Patient called in. Showing on TV.');
      fetchDashboardStats();
    } catch (error) {
       console.error("Error calling patient:", error);
    }
  };

  const handleStartSession = async (apt) => {
    try {
      await appointmentService.updateAppointmentStatus(apt.id, 'in-session');
      success('Consultation session started.');
      navigate('/notes', { 
        state: { 
          autoCreate: true,
          patientId: apt.patientId || '',
          patientName: apt.patient,
          appointmentId: apt.id
        } 
      });
    } catch (error) {
       console.error("Error starting session:", error);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, 'arrived');
      success('Patient checked in successfully!');
      fetchDashboardStats();
    } catch (error) {
      console.error("Error checking in patient:", error);
    }
  };

  const handleSaveAppointment = async (data) => {
    try {
      await appointmentService.bookAppointment(data);
      success('Appointment booked successfully!');
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      console.error("Error booking appointment:", error);
    }
    setIsModalOpen(false);
  };

  if (loading || !userData) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse text-sm">Synchronizing Clinical Data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <h1 className="text-2xl font-semibold text-slate-900 tracking-tight capitalize">
               {role === 'doctor' ? 'Clinical Overview' : role === 'lab_tech' ? 'Laboratory Command' : (role === 'pharmacist' || role === 'pharmacist_admin') ? 'Pharmacy Operations' : 'Administrative Dashboard'}
             </h1>
             <p className="text-slate-500 mt-1">
               Welcome back, <span className="font-medium text-slate-900">{userData?.name || 'Jon Day'}</span>. Here's your {role} focus for today.
             </p>
           </div>
            <div className="flex items-center gap-3">
               {role === 'receptionist' && (
                 <button 
                   onClick={() => setIsModalOpen(true)}
                   className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
                 >
                   <Plus className="h-4 w-4" />
                   <span className="text-sm">Book Appointment</span>
                 </button>
               )}
               <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
                 <Calendar className="h-4 w-4 text-primary-500" />
                 <span className="text-sm font-medium text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
               </div>
            </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => stat.path && navigate(stat.path)}
              className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group ${stat.path ? 'cursor-pointer active:scale-95' : ''}`}
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

        <div className={`grid grid-cols-1 ${role === 'lab_tech' ? '' : 'lg:grid-cols-2'} gap-8`}>
          {/* Main Visual Section */}
          <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-10 flex flex-col ${role === 'lab_tech' ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-tight">
              {role === 'doctor' ? 'Clinical Schedule' : role === 'lab_tech' ? 'Lab Intake Queue' : (role === 'pharmacist' || role === 'pharmacist_admin') ? 'Pharmacy Queue' : 'Financial Arrears'}
            </h3>
            <div className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400">
              {role === 'doctor' ? <Calendar className="h-5 w-5" /> : role === 'lab_tech' ? <Activity className="h-5 w-5" /> : (role === 'pharmacist' || role === 'pharmacist_admin') ? <ClipboardList className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {(role === 'doctor' || role === 'nurse' || role === 'receptionist' || role === 'lab_tech' || role === 'pharmacist' || role === 'pharmacist_admin') ? (
              arrears.length > 0 ? (
                <div className={role === 'lab_tech' ? "space-y-4" : "space-y-4"}>
                  {arrears.map((apt, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[2rem] group transition-all cursor-pointer border-2 ${role === 'lab_tech' ? 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-xl' : (role === 'pharmacist' || role === 'pharmacist_admin') ? 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-xl' : 'bg-slate-50 border-transparent hover:bg-white hover:border-primary-100'}`}
                      onClick={() => (role === 'lab_tech' || role === 'pharmacist' || role === 'pharmacist_admin') && navigate(role === 'lab_tech' ? '/lab/queue' : '/pharmacy/queue')}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border shadow-sm ${role === 'lab_tech' ? 'bg-orange-50 border-orange-100 text-orange-600' : (role === 'pharmacist' || role === 'pharmacist_admin') ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-primary-50 border-primary-100 text-primary-600'}`}>
                           <span className="text-lg font-black tracking-tighter">T-{apt.tokenNumber || '0'}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg leading-tight">{apt.patient}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PATIENT ID</span>
                               <span className="text-[10px] font-bold text-slate-700">{apt.patientId || 'NEW'}</span>
                            </div>
                            {(apt.patientPhone || apt.phoneNumber || apt.mobile) && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MOB</span>
                                 <span className="text-[10px] font-bold text-slate-700">{apt.patientPhone || apt.phoneNumber || apt.mobile}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">{apt.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         {role === 'lab_tech' && (
                           <div className="text-right hidden sm:block">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Protocol</p>
                              <p className="text-[10px] font-bold text-orange-600 uppercase">Emergency</p>
                           </div>
                         )}

                        {role === 'receptionist' && apt.status === 'scheduled' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCheckIn(apt.id); }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                          >
                            Check In
                          </button>
                        )}

                        {role === 'doctor' && (apt.status === 'arrived' || apt.status === 'triage') && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCallIn(apt.id); }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
                          >
                            Call In
                          </button>
                        )}

                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest 
                          ${apt.status === 'arrived' ? 'bg-indigo-50 text-indigo-600' : 
                            apt.status === 'calling' ? 'bg-amber-50 text-amber-600 animate-pulse' :
                            apt.status === 'in-session' ? 'bg-emerald-50 text-emerald-600' :
                            apt.status === 'awaiting-lab' ? 'bg-orange-50 text-orange-600' :
                            apt.status === 'awaiting-pharmacy' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-50 text-slate-500'}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                  <p>No patients scheduled for this window.</p>
                </div>
              )
            ) : (
              arrears.length > 0 ? arrears.map((inv, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate('/billing')}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group hover:bg-white border-2 border-transparent hover:border-red-100 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <CreditCard className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{inv.patientName}</p>
                      <p className="text-[10px] text-red-500 font-bold uppercase">{currency} {inv.total?.toLocaleString()}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                  <p>Outstanding ledger is clear.</p>
                </div>
              )
            )}
          </div>

          <button 
            onClick={() => navigate((role === 'doctor' || role === 'nurse' || role === 'receptionist') ? '/appointments' : role === 'lab_tech' ? '/lab/queue' : (role === 'pharmacist' || role === 'pharmacist_admin') ? '/pharmacy/queue' : '/billing')}
            className="w-full mt-8 py-4 bg-slate-50 text-slate-900 font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
          >
            {(role === 'doctor' || role === 'nurse' || role === 'receptionist') ? 'Manage Calendar' : role === 'lab_tech' ? 'View Lab Queue' : (role === 'pharmacist' || role === 'pharmacist_admin') ? 'Manage Pharmacy Queue' : 'View All Invoices'}
          </button>
        </div>

          {role !== 'lab_tech' && role !== 'pharmacist' && role !== 'pharmacist_admin' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-tight">Recent Activity Log</h3>
                <div className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400">
                  <History className="h-5 w-5" />
                </div>
              </div>

              <div className="flex-1 space-y-6">
                {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                  <div 
                    key={i} 
                    onClick={() => navigate('/superadmin/audit')}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group hover:bg-white border-2 border-transparent hover:border-emerald-100 transition-all cursor-pointer active:scale-[0.98]"
                  >
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

              <button 
                onClick={() => navigate('/superadmin/audit')}
                className="w-full mt-8 py-4 bg-slate-900 text-white font-medium text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                 Audit Full Ledger
              </button>
            </div>
          )}

          {(role === 'pharmacist' || role === 'pharmacist_admin') && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-tight">Stock Alert Console</h3>
                <div className="h-10 w-10 flex items-center justify-center bg-red-50 rounded-xl text-red-500">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="flex-1 space-y-6">
                {lowStockItems.length > 0 ? lowStockItems.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => navigate('/config/pharmacy')}
                    className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] group hover:bg-white border-2 border-transparent hover:border-red-100 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm ${ (item.availableStock ?? item.stock ?? 0) <= 0 ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{item.brandName || item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.genericName || 'Medical Component'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-xs font-black tracking-tighter ${ (item.availableStock ?? item.availableLevel ?? item.stock ?? 0) <= 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          {(item.availableStock ?? item.availableLevel ?? item.stock ?? 0) <= 0 ? 'OUT OF STOCK' : `${item.availableStock ?? item.availableLevel ?? item.stock} UNITS LEFT`}
                       </p>
                       <p className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">Threshold: {item.reorderLevel || 10}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                     <p>All stock levels are optimal. Zero alerts today.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => navigate('/config/pharmacy')}
                className="w-full mt-8 py-4 bg-slate-900 text-white font-medium text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                 Manage Inventory Master
              </button>
            </div>
          )}
        </div>
      </div>

      <AppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
      />
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
