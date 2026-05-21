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
  ShoppingCart,
  Clock,
  ChevronDown,
  Search,
  Wallet,
  PauseCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

const VerificationModal = ({ isOpen, onClose, facilityId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const [data, setData] = useState({
    licenseBody: 'MOH',
    licenseNumber: '',
    location: '',
    licenseExpiry: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await facilityService.submitVerification(facilityId, data);
      success("Verification documents submitted for review.");
      onComplete();
      onClose();
    } catch (err) {
      error("Submission failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-10">
          <div className="h-16 w-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Facility Verification</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Please submit your licensing details to unlock full platform features after the trial period.</p>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Licensing Body</label>
                  <select value={data.licenseBody} onChange={e => setData({ ...data, licenseBody: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary-500 transition-all font-medium text-sm">
                    <option>MOH</option>
                    <option>KMPDU</option>
                    <option>PHB</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">License Number</label>
                  <input required type="text" value={data.licenseNumber} onChange={e => setData({ ...data, licenseNumber: e.target.value })} placeholder="REG-202X-XXXX" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary-500 transition-all font-medium text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Physical Location</label>
                <input required type="text" value={data.location} onChange={e => setData({ ...data, location: e.target.value })} placeholder="Building, Street, City" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary-500 transition-all font-medium text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">License Expiry Date</label>
                <input required type="date" value={data.licenseExpiry} onChange={e => setData({ ...data, licenseExpiry: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-primary-500 transition-all font-medium text-sm" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-primary-600 transition-all">
                {loading ? 'Submitting...' : 'Submit Documents'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default function Dashboard() {
  const { currency } = useCurrency();
  const { userData, actingRole } = useAuth();
  const navigate = useNavigate();
  const role = actingRole || userData?.role || 'clinic_owner';
  const [stats, setStats] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success, error: toastError } = useToast();
  const [facilityData, setFacilityData] = useState(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [allFacilities, setAllFacilities] = useState([]);

  useEffect(() => {
    if (userData) {
      fetchDashboardStats();
    }
  }, [userData, role]);

  const fetchDashboardStats = async () => {
    if (!userData) return;
    try {
      setLoading(true);
      const isSuperadmin = role === 'superadmin' || role === 'platform_owner';

      const promises = [
        userService.getAllUsers(userData?.facilityId),
        appointmentService.getAllAppointments(isSuperadmin ? null : userData?.facilityId),
        billingService.getAllInvoices(isSuperadmin ? null : userData?.facilityId),
        billingService.getFinancialStats(isSuperadmin ? null : userData?.facilityId),
        auditService.getRecentLogs(6, isSuperadmin ? null : userData?.facilityId)
      ];

      if (!isSuperadmin) {
        promises.push(patientService.getAllPatients(userData?.facilityId));
        promises.push(medicalRecordService.getAllRecords(userData?.facilityId));
      } else {
        promises.push(Promise.resolve([]));
        promises.push(Promise.resolve([]));
      }

      const [users, appointments, invoicesRes, billingStats, logs, patientsRes, allRecordsRes] = await Promise.all(promises);

      const invoices = invoicesRes || [];
      setInvoices(invoices);

      const patients = patientsRes?.patients || patientsRes || [];
      const allRecords = allRecordsRes?.records || allRecordsRes?.items || allRecordsRes || [];

      const today = new Date().toLocaleDateString('en-GB');
      const completedToday = (appointments || []).filter(a => a.status === 'completed' && new Date(a.date).toLocaleDateString('en-GB') === today).length;
      const pendingNotes = allRecords ? allRecords.filter(r => r.status === 'draft').length : 0;
      const overdueNotes = allRecords ? allRecords.filter(r => r.status === 'draft' && (new Date() - new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : Date.now())) > 86400000).length : 0;

      if (isSuperadmin) {
        const facilities = await facilityService.getAllFacilities();
        setAllFacilities(facilities);
        const totalOrganizations = facilities.length;
        const activeSubscribers = facilities.filter(f => f.subscription?.status === 'active' || f.status === 'active').length;
        const pendingVerification = facilities.filter(f => f.verificationStatus === 'submitted').length;
        const suspendedOrganizations = facilities.filter(f => f.subscription?.status === 'suspended' || f.status === 'suspended').length;
        
        const totalRevenueEstimate = facilities.reduce((sum, f) => {
          const plan = (f.subscription?.planName || 'Essential').toLowerCase();
          const monthly = plan === 'professional' ? 5000 : plan === 'enterprise' ? 15000 : 2500;
          return sum + monthly;
        }, 0);

        setStats([
          { label: 'Total Organizations', value: totalOrganizations.toString(), trend: '12%', up: true, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Organizations', value: activeSubscribers.toString(), trend: '10%', up: true, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Verification', value: pendingVerification.toString(), trend: '8%', up: false, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Suspended Organizations', value: suspendedOrganizations.toString(), trend: '3%', up: false, icon: PauseCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Monthly Revenue', value: `${currency} ${totalRevenueEstimate.toLocaleString()}`, trend: '12.5%', up: true, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Facilities', value: totalOrganizations.toString(), trend: '9%', up: true, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
        ]);
      } else if (role === 'doctor' || role === 'nurse' || role === 'receptionist') {
        const focusLabel = role === 'doctor' ? "Today's Focus" : "Today's Schedule";
        const activeToday = appointments.filter(a =>
          new Date(a.date).toLocaleDateString('en-GB') === today &&
          a.status !== 'cancelled'
        ).length;

        setStats([
          { label: focusLabel, value: activeToday.toString() + ' Patients', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/appointments' },
          { label: 'Clinical Documentation', value: pendingNotes.toString() + ' Pending', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', path: '/notes' },
          { label: 'Overdue Notes (>24h)', value: overdueNotes.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', path: '/notes', state: { filter: 'all' } },
          { label: 'Discharged Today', value: completedToday.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/appointments' },
        ]);
        const todayApts = appointments
          .filter(a => new Date(a.date).toLocaleDateString('en-GB') === today)
          .filter(a => (role === 'doctor' || role === 'nurse') ? a.status !== 'cancelled' : true)
          .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

        setArrears(todayApts.slice(0, 4));
      } else if (role === 'lab_tech') {
        const awaitingLab = appointments.filter(a => a.status === 'awaiting-lab').length;
        setStats([
          { label: "Today's Schedule", value: appointments.filter(a => new Date(a.date).toLocaleDateString('en-GB') === today).length.toString() + ' Patients', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/appointments' },
          { label: 'Awaiting Lab', value: awaitingLab.toString() + ' Patients', icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-50', path: '/lab/queue' },
          { label: 'Workload', value: awaitingLab > 5 ? 'High' : 'Normal', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', path: '/lab/queue' },
          { label: 'Tests Today', value: appointments.filter(a => a.labCompletedAt && new Date(a.labCompletedAt).toLocaleDateString('en-GB') === today).length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/lab/queue' },
        ]);
        setArrears(appointments.filter(a => new Date(a.date).toLocaleDateString('en-GB') === today && a.status !== 'cancelled').slice(0, 4));
      } else if (role === 'pharmacist' || role === 'pharmacist_admin') {
        const inventory = await inventoryService.getInventory(userData?.facilityId);
        const actualItems = inventory.items || inventory || [];
        const lowStock = actualItems.filter(i => (i.availableStock || i.stock || 0) < (i.reorderLevel || 10));
        
        setStats([
          { label: "Today's Schedule", value: appointments.filter(a => new Date(a.date).toLocaleDateString('en-GB') === today).length.toString() + ' Patients', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/appointments' },
          { label: 'Awaiting Pharmacy', value: appointments.filter(a => a.status === 'awaiting-pharmacy').length.toString() + ' Patients', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', path: '/pharmacy/queue' },
          { label: 'Low Stock Alerts', value: lowStock.length.toString() + ' Items', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', path: '/config/pharmacy' },
          { label: 'Total Inventory', value: actualItems.length.toString(), icon: Box, color: 'text-blue-600', bg: 'bg-blue-50', path: '/config/pharmacy' },
        ]);
        setLowStockItems(lowStock.slice(0, 4));
        setArrears(appointments.filter(a => new Date(a.date).toLocaleDateString('en-GB') === today && a.status !== 'cancelled').slice(0, 4));
      } else {
        setStats([
          { label: 'Overdue Notes (>24h)', value: overdueNotes.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', path: '/notes' },
          { label: 'Active Staff', value: users.length.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/master/users' },
          { label: 'Monthly Revenue', value: `${currency} ${billingStats.revenue.toLocaleString()}`, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', path: '/billing' },
          { label: 'Outstanding Billing', value: invoices.filter(i => i.status === 'pending').length.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', path: '/billing' },
        ]);
        setArrears(invoices.filter(i => i.paymentStatus !== 'paid').slice(0, 4));
      }

      const facData = await facilityService.getProfile(userData.facilityId);
      setFacilityData(facData);
      setAuditLogs(logs?.items || logs?.logs || (Array.isArray(logs) ? logs : []));
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
      fetchDashboardStats();
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

  const isSuperadmin = role === 'superadmin' || role === 'platform_owner';

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20">
        {/* Verification Banner for Clinics */}
        {!isSuperadmin && (facilityData?.verificationStatus === 'pending' || facilityData?.verificationStatus === 'submitted') && (role === 'clinic_owner' || role === 'admin') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
            <div className={`p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 border shadow-xl shadow-slate-100/50 ${facilityData?.verificationStatus === 'submitted' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-6">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${facilityData?.verificationStatus === 'submitted' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}`}>
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h4 className={`text-lg font-bold ${facilityData?.verificationStatus === 'submitted' ? 'text-blue-900' : 'text-amber-900'}`}>
                    {facilityData?.verificationStatus === 'submitted' ? 'Verification Under Review' : 'Facility Verification Required'}
                  </h4>
                  <p className={`text-sm font-medium ${facilityData?.verificationStatus === 'submitted' ? 'text-blue-700/70' : 'text-amber-700/70'}`}>
                    {facilityData?.verificationStatus === 'submitted'
                      ? 'Our compliance team is verifying your licensing documents. This usually takes 24-48 hours.'
                      : 'To ensure uninterrupted access after your 10-day trial, please submit your facility licensing documents.'}
                  </p>
                </div>
              </div>
              {facilityData?.verificationStatus === 'pending' && (
                <button onClick={() => setIsVerificationModalOpen(true)} className="px-8 py-4 bg-amber-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-800 transition-all shadow-lg shadow-amber-200 shrink-0">Verify Now</button>
              )}
            </div>
          </motion.div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight capitalize">
              {isSuperadmin ? 'Superadmin Dashboard' : (role === 'doctor' ? 'Clinical Overview' : role === 'lab_tech' ? 'Laboratory Command' : (role === 'pharmacist' || role === 'pharmacist_admin') ? 'Pharmacy Operations' : 'Administrative Dashboard')}
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Welcome back, <span className="font-semibold text-slate-900">{userData?.name || 'Jon Day'}</span>. {isSuperadmin ? "Here's what's happening on your platform today." : `Here's your ${role} focus for today.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isSuperadmin && role === 'receptionist' && (
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Book Appointment</span>
              </button>
            )}
            <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {isSuperadmin && <ChevronDown className="h-4 w-4 text-slate-300 ml-2" />}
            </div>
          </div>
        </header>

        {/* 3 columns for Superadmin (6 cards total), 4 columns for others (4 cards total) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${isSuperadmin ? '3' : '2'} lg:grid-cols-${isSuperadmin ? '3' : '4'} gap-5`}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => stat.path && navigate(stat.path, { state: stat.state })}
              className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group ${stat.path ? 'cursor-pointer active:scale-95' : ''}`}
            >
              <div className="flex items-center gap-5">
                <div className={`h-14 w-14 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm font-medium text-slate-500 truncate leading-none">{stat.label}</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight leading-none">{stat.value}</span>
                  {isSuperadmin && stat.trend && (
                    <span className={`text-xs font-semibold mt-1.5 flex items-center gap-0.5 leading-none ${stat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stat.up ? '↑' : '↓'} {stat.trend} vs last month
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {isSuperadmin ? (
          <>
            {/* Superadmin Middle Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 mb-6">Organizations by Plan</h3>
                <div className="flex-1 flex items-center gap-6">
                  <div className="relative h-32 w-32 shrink-0">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.6)} strokeLinecap="butt" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.25)} style={{ transform: 'rotate(216deg)', transformOrigin: '50% 50%' }} strokeLinecap="butt" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.15)} style={{ transform: 'rotate(306deg)', transformOrigin: '50% 50%' }} strokeLinecap="butt" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-slate-900 leading-none">{allFacilities.length}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Essential', count: Math.round(allFacilities.length * 0.6), perc: '60.9%', color: 'bg-blue-500' },
                      { label: 'Professional', count: Math.round(allFacilities.length * 0.26), perc: '26.6%', color: 'bg-indigo-500' },
                      { label: 'Enterprise', count: Math.round(allFacilities.length * 0.12), perc: '12.5%', color: 'bg-emerald-500' }
                    ].map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${p.color}`} />
                          <span className="text-[10px] font-semibold text-slate-500">{p.label}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-900">{p.count} <span className="text-slate-300 font-medium">({p.perc})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => navigate('/superadmin/subscriptions')} className="mt-6 text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">View full breakdown <ArrowRight className="h-3 w-3" /></button>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-900">Revenue Overview</h3>
                  <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                    This Month <ChevronDown className="h-2 w-2" />
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 leading-none">KES 7,500</p>
                      <p className="text-[9px] font-semibold text-slate-400 mt-1 uppercase">Total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-900 leading-none">KES 1,250</p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-1 uppercase">Paid</p>
                  </div>
                </div>

                <div className="flex-1 min-h-[120px] relative">
                   <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                     <defs>
                       <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                         <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                       </linearGradient>
                     </defs>
                     <path d="M0,35 C15,35 25,10 50,25 C75,40 85,5 100,20 V40 H0 Z" fill="url(#revGradient)" />
                     <path d="M0,35 C15,35 25,10 50,25 C75,40 85,5 100,20" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                   </svg>
                   <div className="absolute -bottom-1 w-full flex justify-between text-[7px] font-bold text-slate-300 uppercase tracking-tighter">
                     <span>May 1</span><span>May 15</span><span>May 29</span>
                   </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 mb-6">Subscription Status</h3>
                <div className="flex-1 space-y-4">
                  {[
                    { label: 'Active Subscriptions', count: '86', color: 'bg-emerald-500' },
                    { label: 'Free Trials', count: '20', color: 'bg-blue-500' },
                    { label: 'Failed Payments', count: '6', color: 'bg-red-500' },
                    { label: 'Suspended Subscriptions', count: '14', color: 'bg-orange-500' }
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                        <span className="text-[10px] font-semibold text-slate-500">{s.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-900">{s.count}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/superadmin/subscriptions')} className="mt-6 text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">View all subscriptions <ArrowRight className="h-3 w-3" /></button>
              </div>
            </div>

            {/* Superadmin Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-base font-bold text-slate-900">Recent Organizations</h3>
                    <button onClick={() => navigate('/superadmin/subscriptions')} className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-lg">View all</button>
                  </div>
                  <div className="space-y-6 flex-1">
                    {allFacilities.slice(0, 5).map((fac, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3.5">
                          <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><Building2 className="h-4 w-4" /></div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-[140px]">{fac.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{fac.email || 'info@justrise.bh'}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${fac.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : fac.status === 'suspended' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{fac.status || 'Trial'}</span>
                          <span className="text-[9px] text-slate-300 font-medium whitespace-nowrap">{i === 0 ? '2 hours ago' : i === 1 ? '5 hours ago' : '1 day ago'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/superadmin/subscriptions')} className="mt-8 text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">View all organizations <ArrowRight className="h-3 w-3" /></button>
               </div>

               <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-base font-bold text-slate-900">Verification Pending</h3>
                    <button onClick={() => navigate('/superadmin/subscriptions')} className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-lg">View all</button>
                  </div>
                  <div className="space-y-6 flex-1 flex flex-col justify-center">
                    {allFacilities.filter(f => f.verificationStatus === 'submitted').slice(0, 5).map((v, i) => (
                       <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-900">{v.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{i % 2 === 0 ? 'Business License • KRA PIN' : 'Facility License • Ownership Docs'}</p>
                          </div>
                          <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap italic">Submitted {i + 2}d ago</span>
                       </div>
                    ))}
                    {allFacilities.filter(f => f.verificationStatus === 'submitted').length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 opacity-40">
                        <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2"><CheckCircle2 className="h-5 w-5" /></div>
                        <p className="text-slate-400 text-[10px] font-medium">No pending verifications</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => navigate('/superadmin/subscriptions')} className="mt-8 text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">View all pending verifications <ArrowRight className="h-3 w-3" /></button>
               </div>

               <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
                    <button onClick={() => navigate('/superadmin/billing')} className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-lg">View all</button>
                  </div>
                  <div className="space-y-6 flex-1">
                    {invoices.slice(0, 5).map((t, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3.5">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${t.status === 'paid' ? 'bg-slate-50 text-slate-300' : 'bg-red-50 text-red-300'}`}>
                            {i % 3 === 1 ? <Plus className="h-3 w-3 text-emerald-500" /> : <CreditCard className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">{i % 3 === 1 ? 'Plan Upgrade' : 'Subscription Payment'}</p>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate max-w-[120px]">{t.facilityName || t.patientName || 'Jebin Jose'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-slate-900 leading-none">KES {t.total?.toLocaleString() || '1,000'}</p>
                          <span className={`inline-block px-1.5 py-0.5 rounded-md text-[7px] font-bold uppercase tracking-widest border mt-1 ${t.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{t.status === 'paid' ? 'Paid' : 'Failed'}</span>
                        </div>
                      </div>
                    ))}
                    {invoices.length === 0 && <div className="py-6 text-center text-slate-400 text-[10px] font-medium opacity-50">No recent transactions.</div>}
                  </div>
                  <button onClick={() => navigate('/superadmin/billing')} className="mt-8 text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">View all transactions <ArrowRight className="h-3 w-3" /></button>
               </div>
            </div>
          </>
        ) : (
          /* Clinic Dashboard (Rest of the original layout) */
          <div className={`grid grid-cols-1 ${role === 'lab_tech' ? '' : 'lg:grid-cols-2'} gap-8`}>
            <div className={`bg-white rounded-3xl border border-slate-100 p-8 flex flex-col ${role === 'lab_tech' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {role === 'doctor' ? 'Clinical Schedule' : role === 'lab_tech' ? 'Lab Intake Queue' : (role === 'pharmacist' || role === 'pharmacist_admin') ? 'Pharmacy Queue' : 'Financial Arrears'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Today's Focus</p>
                </div>
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  {role === 'doctor' ? <Calendar className="h-6 w-6" /> : role === 'lab_tech' ? <Activity className="h-6 w-6" /> : (role === 'pharmacist' || role === 'pharmacist_admin') ? <ClipboardList className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {arrears.length > 0 ? (
                  arrears.map((apt, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-4 rounded-2xl transition-all group" onClick={() => (role === 'lab_tech' || role === 'pharmacist') && navigate(role === 'lab_tech' ? '/lab/queue' : '/pharmacy/queue')}>
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center text-slate-400 font-bold">
                          <span className="text-[10px] leading-none uppercase">Tkt</span>
                          <span className="text-sm leading-none mt-1">{apt.tokenNumber || '0'}</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base leading-none uppercase tracking-tight">{apt.patient}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                             <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">{apt.type || 'Consultation'}</span>
                             <span className="text-[10px] text-slate-400 font-medium">ID: {apt.patientId?.substring(0, 8) || 'NEW'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 sm:mt-0">
                         {role === 'receptionist' && apt.status === 'scheduled' && (
                           <button onClick={(e) => { e.stopPropagation(); handleCheckIn(apt.id); }} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Check In</button>
                         )}
                         <div className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest border rounded-lg transition-all ${apt.status === 'arrived' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : apt.status === 'calling' ? 'bg-amber-50 border-amber-100 text-amber-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                           {apt.status.replace('-', ' ')}
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic py-10">No items in the current queue.</div>
                )}
              </div>
              <button onClick={() => navigate((role === 'doctor' || role === 'nurse' || role === 'receptionist') ? '/appointments' : role === 'lab_tech' ? '/lab/queue' : (role === 'pharmacist') ? '/pharmacy/queue' : '/billing')} className="w-full mt-8 py-4 bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all">Full Operations View</button>
            </div>

            {role !== 'lab_tech' && role !== 'pharmacist' && role !== 'pharmacist_admin' && (
               <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 flex flex-col">
                  <div className="flex items-center justify-between mb-8"><h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Recent Activity Log</h3><div className="h-12 w-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400"><History className="h-6 w-6" /></div></div>
                  <div className="flex-1 space-y-6">
                    {(Array.isArray(auditLogs) ? auditLogs : []).slice(0, 4).map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group hover:bg-white border-2 border-transparent hover:border-primary-100 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary-500"><ShieldCheck className="h-6 w-6" /></div>
                          <div><p className="font-bold text-slate-900 text-sm">{log.description}</p><p className="text-[10px] text-slate-400 font-semibold uppercase">{log.userName} • {log.action}</p></div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/superadmin/audit')} className="w-full mt-8 py-5 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">View Full Audit Trail</button>
               </div>
            )}
          </div>
        )}

        {/* Footer Branding */}
        <div className="flex items-center justify-between pt-12 border-t border-slate-100 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          <p>© 2026 Hure Care. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <button className="hover:text-slate-500 transition-colors">Privacy</button>
            <button className="hover:text-slate-500 transition-colors">Terms</button>
            <button className="hover:text-slate-500 transition-colors">Support</button>
          </div>
        </div>
      </div>

      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAppointment} />
      <VerificationModal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} facilityId={userData?.facilityId} onComplete={fetchDashboardStats} />
    </DashboardLayout>
  );
}
