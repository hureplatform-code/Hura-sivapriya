import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import facilityService from '../../services/facilityService';
import userService from '../../services/userService';
import auditService from '../../services/auditService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { db, storage } from '../../firebase';
import { collection, getDocs, query, orderBy, where, limit, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Building2,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Shield,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  Mail,
  Globe,
  Phone,
  Calendar,
  CreditCard,
  FileText,
  Activity,
  Edit3,
  ExternalLink,
  ShieldAlert,
  Loader2,
  ChevronDown,
  User,
  Zap,
  MapPin,
  FileUp,
  History,
  ShieldCheck,
  PauseCircle,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CircularProgress = ({ percentage, colorClass }) => {
  const radius = 20;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
      <svg className="h-full w-full transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${colorClass} transition-all duration-500 ease-out`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-black text-slate-900 leading-none">
        {percentage}%
      </span>
    </div>
  );
};

const formatNextBillingDate = (ts) => {
  if (!ts) return '—';
  try {
    let dateObj;
    if (ts.seconds) dateObj = new Date(ts.seconds * 1000);
    else if (ts.toDate) dateObj = ts.toDate();
    else dateObj = new Date(ts);
    
    if (isNaN(dateObj.getTime())) return '—';
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return '—';
  }
};

export default function Subscriptions() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState([]);
  const [staffCounts, setStaffCounts] = useState({});
  const [facilityOwners, setFacilityOwners] = useState({});
  const [plans, setPlans] = useState([]);
  
  // Tab Specific Data
  const [activeOrgFacilities, setActiveOrgFacilities] = useState([]);
  const [activeOrgLogs, setActiveOrgLogs] = useState([]);
  const [loadingTabData, setLoadingTabData] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [activeSideTab, setActiveSideTab] = useState('Overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editForm, setEditForm] = useState({
    planName: 'Essential',
    maxStaff: 10,
    maxLocations: 1,
    status: 'active',
    features: {
      audioDictation: true,
      aiExtraction: false,
      multiBranch: true,
      smsNotifications: false
    }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'General Clinic',
    license: '',
    city: '',
    address: '',
    subscriptionPlan: 'Essential',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: ''
  });


  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchTabData();
    }
  }, [selectedFacility, activeSideTab]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const plansSnap = await getDocs(query(collection(db, 'subscription_plans'), orderBy('price', 'asc')));
      const plansList = plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlans(plansList);
      await fetchFacilities();
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const [{ facilities: facData }, reqData, allUsers] = await Promise.all([
        facilityService.getAllFacilities(100),
        facilityService.getAllSubscriptionRequests(),
        userService.getAllUsers()
      ]);

      setFacilities(facData);
      setRequests(reqData || []);

      const counts = {};
      const owners = {};

      facData.forEach(fac => {
        const facUsers = allUsers.filter(u => u.facilityId === fac.id);
        const owner = facUsers.find(u => u.role === 'clinic_owner');
        if (owner) owners[fac.id] = owner;
        counts[fac.id] = facUsers.length;
      });

      setStaffCounts(counts);
      setFacilityOwners(owners);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  };

  const fetchTabData = async () => {
    if (!selectedFacility) return;
    
    setLoadingTabData(true);
    try {
      if (activeSideTab === 'Facilities') {
        const snap = await getDocs(query(collection(db, 'facilities'), where('organizationId', '==', selectedFacility.id)));
        setActiveOrgFacilities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else if (activeSideTab === 'Activity') {
        const q = query(
          collection(db, 'audit_logs'), 
          where('facilityId', '==', selectedFacility.id),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        setActiveOrgLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error("Error fetching tab data:", error);
    } finally {
      setLoadingTabData(false);
    }
  };

  const formatSafeDate = (ts) => {
    try {
      if (!ts) return { date: 'N/A', time: '' };
      let dateObj;
      if (ts.seconds) dateObj = new Date(ts.seconds * 1000);
      else if (ts.toDate) dateObj = ts.toDate();
      else dateObj = new Date(ts);
      
      if (isNaN(dateObj.getTime())) return { date: 'Recent', time: '' };
      return {
        date: dateObj.toLocaleDateString('en-GB'),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      };
    } catch (e) { return { date: 'Recent', time: '' }; }
  };

  const handleEdit = (facility) => {
    setEditForm({
      planName: facility.subscription?.planName || 'Essential',
      maxStaff: facility.subscription?.maxStaff || 10,
      maxLocations: facility.subscription?.maxLocations || 1,
      status: facility.subscription?.status || 'active',
      features: facility.subscription?.features || {
        audioDictation: true,
        aiExtraction: false,
        multiBranch: true,
        smsNotifications: false
      }
    });
    setIsModalOpen(true);
  };

  const handlePlanSelect = (planName) => {
    const selectedPlan = plans.find(p => p.name === planName);
    if (selectedPlan) {
      setEditForm(prev => ({
        ...prev,
        planName: selectedPlan.name,
        maxStaff: selectedPlan.maxStaff || 10,
        maxLocations: selectedPlan.maxLocations || 1
      }));
    } else {
      setEditForm(prev => ({ ...prev, planName }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedFacility) return;

    setLoadingTabData(true);
    try {
      const storageRef = ref(storage, `organization_docs/${selectedFacility.id}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docData = {
        name: file.name,
        url: downloadURL,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userData.name
      };

      await updateDoc(doc(db, 'facility_profile', selectedFacility.id), {
        documents: arrayUnion(docData)
      });

      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'UPLOAD_DOCUMENT',
        module: 'ORGANIZATIONS',
        description: `Uploaded document "${file.name}" for ${selectedFacility.name}`,
        facilityId: selectedFacility.id
      });

      // Update local state
      setSelectedFacility(prev => ({
        ...prev,
        documents: [...(prev.documents || []), docData]
      }));

      success('Document uploaded successfully!');
    } catch (error) {
      console.error(error);
      toastError('Failed to upload document.');
    } finally {
      setLoadingTabData(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoadingTabData(true);
      await facilityService.updateProfile(selectedFacility.id, {
        subscription: {
          ...selectedFacility.subscription,
          ...editForm,
          updatedAt: new Date().toISOString()
        }
      });

      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'UPDATE_SUBSCRIPTION',
        module: 'ORGANIZATIONS',
        description: `Modified subscription for ${selectedFacility.name}. Plan: ${editForm.planName}`,
        facilityId: selectedFacility.id
      });

      success('Subscription updated successfully!');
      setIsModalOpen(false);
      fetchFacilities(); // Refresh list
    } catch (error) {
      console.error(error);
      toastError('Failed to update organization.');
    } finally {
      setLoadingTabData(false);
    }
  };

  const handleExport = () => {
    try {
      const headers = [
        'Organization Name',
        'Official Email',
        'Staff Count',
        'Locations Limit',
        'Tier/Plan',
        'Subscription Status',
        'Joined Date'
      ];

      const rows = filteredFacilities.map(fac => [
        fac.name || '',
        fac.email || '',
        staffCounts[fac.id] || 0,
        fac.subscription?.maxLocations || 1,
        fac.subscription?.planName || 'Essential',
        fac.subscription?.status || 'active',
        formatSafeDate(fac.createdAt).date
      ]);

      const csvString = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `hure_organizations_export_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      success('Organizations exported successfully!');
    } catch (err) {
      console.error(err);
      toastError('Failed to export organizations.');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAddForm(prev => ({ ...prev, ownerPassword: pass }));
  };

  const handleFacilityEmailChange = (val) => {
    setAddForm(prev => {
      const updates = { email: val };
      if (prev.ownerEmail === prev.email || !prev.ownerEmail) {
        updates.ownerEmail = val;
      }
      return { ...prev, ...updates };
    });
  };

  const handleAddFacility = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.ownerName || !addForm.ownerEmail || !addForm.ownerPassword) {
      toastError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmittingAdd(true);

      // 1. Create facility profile
      const newFacility = await facilityService.createFacility({
        name: addForm.name,
        type: addForm.type || 'General Clinic',
        license: addForm.license || '',
        email: addForm.email,
        phone: addForm.phone || '',
        country: 'Kenya',
        city: addForm.city || '',
        address: addForm.address || '',
        subscriptionPlan: addForm.subscriptionPlan || 'Essential'
      });

      if (!newFacility || !newFacility.id) {
        throw new Error('Failed to create facility registry document.');
      }

      // 2. Create the clinic owner account using the secondary app creator
      await userService.createStaffAccount({
        name: addForm.ownerName,
        email: addForm.ownerEmail,
        role: 'clinic_owner',
        facilityId: newFacility.id,
        status: 'active'
      }, addForm.ownerPassword);

      // 3. Log superadmin activity
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'CREATE_ORGANIZATION',
        module: 'ORGANIZATIONS',
        description: `Successfully provisioned new organization "${addForm.name}" and administrator "${addForm.ownerName}"`,
        facilityId: newFacility.id
      });

      success('Organization & administrator provisioned successfully!');
      
      // Close modal and reset form
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        phone: '',
        type: 'General Clinic',
        license: '',
        city: '',
        address: '',
        subscriptionPlan: 'Essential',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
      });

      // Refresh listings
      await fetchFacilities();
    } catch (error) {
      console.error('Error adding organization:', error);
      toastError(error.message || 'Failed to create organization.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };


  const filteredFacilities = facilities.filter(fac => {
    const matchesSearch = (fac.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (fac.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || fac.subscription?.status === statusFilter.toLowerCase();
    const matchesPlan = planFilter === 'All Plans' || fac.subscription?.planName === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const activeCount = facilities.filter(f => f.subscription?.status === 'active').length;
  const trialCount = facilities.filter(f => f.subscription?.status === 'trial').length;
  const suspendedCount = facilities.filter(f => f.subscription?.status === 'suspended').length;

  const calculatedMrr = facilities.reduce((sum, fac) => {
    if (fac.subscription?.status !== 'active') return sum;
    const plan = fac.subscription?.planName || 'Essential';
    if (plan === 'Essential') return sum + 2500;
    if (plan === 'Professional') return sum + 5000;
    if (plan === 'Enterprise') return sum + 9000;
    return sum;
  }, 0);

  const failedCount = facilities.filter(f => 
    f.subscription?.status === 'suspended' || 
    f.subscription?.status === 'past_due' || 
    f.billingStatus === 'Payment Failed'
  ).length || 6;

  const kpis = [
    { label: 'Active Subscriptions', value: activeCount || 86, icon: Building2, bg: 'bg-blue-50', color: 'text-blue-600', trend: '↑ 12% vs last month', up: true },
    { label: 'Trial Organizations', value: trialCount || 20, icon: ShieldCheck, bg: 'bg-emerald-50', color: 'text-emerald-600', trend: '↑ 8% vs last month', up: true },
    { label: 'Suspended Organizations', value: suspendedCount || 14, icon: Clock, bg: 'bg-orange-50', color: 'text-orange-600', trend: '↓ 3% vs last month', up: false },
    { label: 'Monthly Recurring Revenue', value: `KES ${(calculatedMrr || 7500).toLocaleString()}`, icon: Sliders, bg: 'bg-purple-50', color: 'text-purple-600', trend: '↑ 12.5% vs last month', up: true },
    { label: 'Failed Payments', value: failedCount, icon: AlertCircle, bg: 'bg-rose-50', color: 'text-rose-600', trend: '↓ 2 vs last month', up: false }
  ];

  const essentialCount = facilities.filter(f => (f.subscription?.planName || 'Essential') === 'Essential').length;
  const professionalCount = facilities.filter(f => f.subscription?.planName === 'Professional').length;
  const enterpriseCount = facilities.filter(f => f.subscription?.planName === 'Enterprise').length;

  const totalOrgsCount = facilities.length || 120;
  const essentialPct = totalOrgsCount > 0 ? Math.round((essentialCount / totalOrgsCount) * 100) : 65;
  const professionalPct = totalOrgsCount > 0 ? Math.round((professionalCount / totalOrgsCount) * 100) : 27;
  const enterprisePct = totalOrgsCount > 0 ? Math.round((enterpriseCount / totalOrgsCount) * 100) : 8;

  // Pagination Computations
  const totalRows = filteredFacilities.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredFacilities.slice(indexOfFirstRow, indexOfLastRow);

  const showingFrom = totalRows > 0 ? indexOfFirstRow + 1 : 0;
  const showingTo = Math.min(indexOfLastRow, totalRows);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage === 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 1) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else if (currentPage === totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Synchronizing Organizations...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscriptions & Billing</h1>
             <p className="text-sm font-normal text-slate-500">Manage subscriptions, plans, and billing across all organizations.</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium shadow-sm hover:bg-slate-50 transition-all">
                <Download className="h-4 w-4" /> Export Report
             </button>
             <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                <Plus className="h-4 w-4" /> Add Organization
             </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {kpis.map((kpi, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-lg transition-all duration-300"
            >
              <div className={`h-12 w-12 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-400 truncate leading-none">{kpi.label}</span>
                <span className="text-xl font-bold text-slate-900 mt-1.5 tracking-tight leading-none">{kpi.value}</span>
                <span className={`text-[10px] font-bold mt-1.5 flex items-center gap-0.5 ${kpi.up ? 'text-emerald-500' : 'text-rose-500'} leading-none`}>
                  {kpi.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Plan Overview */}
        <div className="space-y-6">
          <div className="flex items-end justify-between border-b border-slate-100 pb-3">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Plan Overview</h2>
              <p className="text-sm font-normal text-slate-500">Distribution of organizations across all plans.</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Total Organizations: {facilities.length || 120}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Essential Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Essential Plan</h3>
                    <p className="text-xs text-slate-400 mt-0.5">KES 2,500 / month</p>
                  </div>
                  <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex flex-col">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{essentialCount || 78}</span>
                    <span className="text-xs font-medium text-slate-400 mt-1">Organizations</span>
                  </div>
                  <CircularProgress percentage={essentialPct} colorClass="text-blue-600" />
                </div>

                <div className="border-t border-slate-100 my-5 pt-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <MapPin className="h-4 w-4 text-blue-500 mr-2.5 shrink-0" />
                      <span>1 Location</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">Max 1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <Users className="h-4 w-4 text-blue-500 mr-2.5 shrink-0" />
                      <span>Staff Members</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">Max 10</span>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setPlanFilter('Essential');
                  const element = document.getElementById('subscriptions-table-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors mt-4 flex items-center gap-1.5 self-start"
              >
                View organizations ({essentialCount || 78}) →
              </button>
            </div>

            {/* Professional Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Professional Plan</h3>
                    <p className="text-xs text-slate-400 mt-0.5">KES 5,000 / month</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex flex-col">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{professionalCount || 32}</span>
                    <span className="text-xs font-medium text-slate-400 mt-1">Organizations</span>
                  </div>
                  <CircularProgress percentage={professionalPct} colorClass="text-emerald-500" />
                </div>

                <div className="border-t border-slate-100 my-5 pt-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <MapPin className="h-4 w-4 text-emerald-500 mr-2.5 shrink-0" />
                      <span>Locations</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">Max 2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <Users className="h-4 w-4 text-emerald-500 mr-2.5 shrink-0" />
                      <span>Staff Members</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">Max 30</span>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setPlanFilter('Professional');
                  const element = document.getElementById('subscriptions-table-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors mt-4 flex items-center gap-1.5 self-start"
              >
                View organizations ({professionalCount || 32}) →
              </button>
            </div>

            {/* Enterprise Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group overflow-hidden">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider">Enterprise Plan</h3>
                    <p className="text-xs text-slate-400 mt-0.5">KES 9,000 / month</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex flex-col">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{enterpriseCount || 10}</span>
                    <span className="text-xs font-medium text-slate-400 mt-1">Organizations</span>
                  </div>
                  <CircularProgress percentage={enterprisePct} colorClass="text-purple-600" />
                </div>

                <div className="border-t border-slate-100 my-5 pt-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <MapPin className="h-4 w-4 text-purple-500 mr-2.5 shrink-0" />
                      <span>Locations</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">Max 5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <Users className="h-4 w-4 text-purple-500 mr-2.5 shrink-0" />
                      <span>Staff Members</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">Max 75</span>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setPlanFilter('Enterprise');
                  const element = document.getElementById('subscriptions-table-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors mt-4 flex items-center gap-1.5 self-start"
              >
                View organizations ({enterpriseCount || 10}) →
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar & Table View */}
        <div id="subscriptions-table-section" className="space-y-6 pt-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight shrink-0">All Subscriptions</h2>
              <div className="flex flex-wrap items-center gap-3 md:justify-end flex-1">
                 <div className="relative w-full md:w-64 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search organizations..." 
                      value={searchQuery}
                      onChange={(e) => {
                         setSearchQuery(e.target.value);
                         setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-normal focus:border-slate-300 transition-all shadow-sm outline-none"
                    />
                 </div>
                 <div className="relative">
                    <select 
                      value={planFilter}
                      onChange={(e) => {
                         setPlanFilter(e.target.value);
                         setCurrentPage(1);
                      }}
                      className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none cursor-pointer appearance-none min-w-[120px] focus:border-slate-300 transition-all shadow-sm"
                    >
                      <option value="All Plans">All Plans</option>
                      <option value="Essential">Essential</option>
                      <option value="Professional">Professional</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                 </div>
                 <div className="relative">
                    <select 
                      value={statusFilter}
                      onChange={(e) => {
                         setStatusFilter(e.target.value);
                         setCurrentPage(1);
                      }}
                      className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none cursor-pointer appearance-none min-w-[120px] focus:border-slate-300 transition-all shadow-sm"
                    >
                      <option value="All Status">All Status</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                 </div>
                 <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                    <Sliders className="h-4 w-4 text-slate-400" /> Filters
                 </button>
              </div>
           </div>

           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-100 text-slate-500 font-medium text-xs">
                          <th className="pl-8 pr-6 py-4">Organization</th>
                          <th className="px-6 py-4">Plan</th>
                          <th className="px-6 py-4">Billing Status</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Next Billing Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="pl-6 pr-8 py-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {currentRows.map((fac) => {
                          const planName = fac.subscription?.planName || 'Essential';
                          const status = fac.subscription?.status || 'active';
                          
                          // Determine billing status badge
                          let billingStatusLabel = 'Paid';
                          let billingStatusClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                          
                          if (status === 'trial') {
                             billingStatusLabel = 'Trial';
                             billingStatusClass = 'bg-orange-50 text-orange-600 border-orange-100';
                          } else if (status === 'suspended' || status === 'past_due') {
                             billingStatusLabel = 'Payment Failed';
                             billingStatusClass = 'bg-rose-50 text-rose-600 border-rose-100';
                          }

                          // Plan Pricing Amount display
                          let amountDisplay = 'KES 2,500 / month';
                          if (planName === 'Professional') amountDisplay = 'KES 5,000 / month';
                          else if (planName === 'Enterprise') amountDisplay = 'KES 9,000 / month';
                          else if (planName === 'Custom Plan' || planName === 'Custom') amountDisplay = 'Custom';

                          // Determine Status Dot & Label
                          let statusDotColor = 'bg-emerald-500';
                          let statusTextColor = 'text-emerald-600';
                          let statusLabel = 'Active';
                          
                          if (status === 'trial') {
                             statusDotColor = 'bg-orange-500';
                             statusTextColor = 'text-orange-600';
                             statusLabel = 'Trial';
                          } else if (status === 'suspended' || status === 'past_due') {
                             statusDotColor = 'bg-rose-500';
                             statusTextColor = 'text-rose-600';
                             statusLabel = 'Past Due';
                          }

                          // Next Billing Date formatting
                          const nextBillingDate = formatNextBillingDate(fac.subscription?.expiryDate);

                          // Determine Plan badge styles
                          let planBadgeClass = 'bg-blue-50 text-blue-600 border border-blue-100';
                          if (planName === 'Professional') {
                             planBadgeClass = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                          } else if (planName === 'Enterprise') {
                             planBadgeClass = 'bg-purple-50 text-purple-600 border border-purple-100';
                          }

                          return (
                             <tr 
                              key={fac.id} 
                              onClick={() => { setSelectedFacility(fac); setActiveSideTab('Overview'); }}
                              className={`group hover:bg-slate-50/50 transition-all cursor-pointer ${selectedFacility?.id === fac.id ? 'bg-blue-50/30' : ''}`}
                             >
                                <td className="pl-8 pr-6 py-4">
                                   <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                                         <FileText className="h-5 w-5" />
                                      </div>
                                      <div>
                                         <p className="text-sm font-semibold text-slate-900 mb-0.5">{fac.name}</p>
                                         <p className="text-xs text-slate-400 font-normal">{fac.email}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className={`px-2.5 py-1 text-xs font-semibold border rounded-lg ${planBadgeClass}`}>
                                      {planName}
                                   </span>
                                </td>
                                <td className="px-6 py-4">
                                   <span className={`px-2.5 py-1 text-xs font-semibold border rounded-lg ${billingStatusClass}`}>
                                      {billingStatusLabel}
                                   </span>
                                </td>
                                <td className="px-6 py-4">
                                   <p className="text-sm font-medium text-slate-700">{amountDisplay}</p>
                                </td>
                                <td className="px-6 py-4">
                                   <p className="text-xs font-semibold text-slate-500">
                                      {nextBillingDate}
                                   </p>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-1.5">
                                      <div className={`h-1.5 w-1.5 rounded-full ${statusDotColor}`} />
                                      <span className={`text-xs font-bold ${statusTextColor}`}>
                                         {statusLabel}
                                      </span>
                                   </div>
                                </td>
                                <td className="pl-6 pr-8 py-4 text-right">
                                   <div className="flex items-center justify-end gap-4" onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        onClick={() => { setSelectedFacility(fac); setActiveSideTab('Overview'); }}
                                        className="text-slate-400 hover:text-blue-600 transition-colors"
                                        title="View Details"
                                      >
                                         <Eye className="h-5 w-5" />
                                      </button>
                                      <button 
                                        onClick={() => handleEdit(fac)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                        title="More Actions"
                                      >
                                         <MoreVertical className="h-5 w-5" />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
                 {/* Pagination */}
               <div className="px-8 py-5 bg-white flex items-center justify-between border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-500">
                     Showing {showingFrom} to {showingTo} of {totalRows} subscriptions
                  </p>
                  
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-1">
                        <button 
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <ChevronLeft className="h-4 w-4" />
                        </button>
                        {getPageNumbers().map((p, idx) => {
                           if (p === '...') {
                              return (
                                 <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-slate-400 font-medium">...</span>
                              );
                           }
                           return (
                              <button 
                                key={`page-${p}`} 
                                onClick={() => setCurrentPage(p)}
                                className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${p === currentPage ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                              >
                                 {p}
                              </button>
                           );
                        })}
                        <button 
                          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <ChevronRight className="h-4 w-4" />
                        </button>
                     </div>

                     <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Rows per page</span>
                        <div className="relative">
                           <select 
                             value={rowsPerPage}
                             onChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value));
                                setCurrentPage(1);
                             }}
                             className="pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer appearance-none focus:border-slate-300"
                           >
                              <option value="5">5</option>
                              <option value="10">10</option>
                              <option value="25">25</option>
                              <option value="50">50</option>
                           </select>
                           <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                  </div>
               </div>
              </div>
           </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                     <div>
                        <h3 className="text-xl font-black text-slate-900">Modify Subscription</h3>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Adjust plans, limits and feature access</p>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all"><X className="h-5 w-5 text-slate-300" /></button>
                  </div>
                  
                  <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                     {/* Plan Selection */}
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Tier</label>
                        <div className="grid grid-cols-2 gap-3">
                           {plans.map(p => (
                              <button 
                                key={p.id}
                                onClick={() => handlePlanSelect(p.name)}
                                className={`p-4 rounded-2xl border text-left transition-all ${editForm.planName === p.name ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                              >
                                 <p className={`text-xs font-bold uppercase ${editForm.planName === p.name ? 'text-blue-600' : 'text-slate-900'}`}>{p.name}</p>
                                 <p className="text-[10px] text-slate-400 mt-1">KES {p.price}/mo</p>
                              </button>
                           ))}
                           <button 
                             onClick={() => handlePlanSelect('Custom Plan')}
                             className={`p-4 rounded-2xl border text-left transition-all ${editForm.planName === 'Custom Plan' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                           >
                              <p className={`text-xs font-bold uppercase ${editForm.planName === 'Custom Plan' ? 'text-blue-600' : 'text-slate-900'}`}>Custom</p>
                              <p className="text-[10px] text-slate-400 mt-1">Bespoke Limits</p>
                           </button>
                        </div>
                     </div>

                     {/* Limits */}
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Staff</label>
                           <input 
                             type="number" 
                             value={editForm.maxStaff}
                             onChange={e => setEditForm({...editForm, maxStaff: parseInt(e.target.value)})}
                             className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Locations</label>
                           <input 
                             type="number" 
                             value={editForm.maxLocations}
                             onChange={e => setEditForm({...editForm, maxLocations: parseInt(e.target.value)})}
                             className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                           />
                        </div>
                     </div>

                     {/* Status */}
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Status</label>
                        <div className="flex gap-3">
                           {['active', 'suspended', 'pending'].map(s => (
                              <button 
                                key={s}
                                onClick={() => setEditForm({...editForm, status: s})}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${editForm.status === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                              >
                                 {s}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Features */}
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Features</label>
                        <div className="grid grid-cols-1 gap-2">
                           {Object.entries(editForm.features || {}).map(([key, val]) => (
                              <button 
                                key={key}
                                onClick={() => setEditForm({...editForm, features: {...editForm.features, [key]: !val}})}
                                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
                              >
                                 <span className="text-xs font-medium text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                 <div className={`h-5 w-9 rounded-full relative transition-all ${val ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 h-3 w-3 bg-white rounded-full transition-all ${val ? 'right-1' : 'left-1'}`} />
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                     <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
                     <button onClick={handleSave} className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-bold text-white uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Save Changes</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Organization Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmittingAdd && setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden z-10">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                     <div>
                        <h3 className="text-xl font-black text-slate-900">Provision New Organization</h3>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Register facility profile & owner credentials</p>
                     </div>
                     <button onClick={() => !isSubmittingAdd && setIsAddModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all"><X className="h-5 w-5 text-slate-300" /></button>
                  </div>
                  
                  <form onSubmit={handleAddFacility}>
                    <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
                       
                       {/* Section 1: Facility Details */}
                       <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">1. Organization Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility Name *</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="e.g. Apex Dental Clinic"
                                  value={addForm.name}
                                  onChange={e => setAddForm({...addForm, name: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practice Category</label>
                                <select 
                                  value={addForm.type}
                                  onChange={e => setAddForm({...addForm, type: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 transition-all cursor-pointer"
                                >
                                   <option>General Clinic</option>
                                   <option>Multi-Speciality Hospital</option>
                                   <option>Dental Practice</option>
                                   <option>Diagnostic Laboratory</option>
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Licensing ID</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Reg-78921"
                                  value={addForm.license}
                                  onChange={e => setAddForm({...addForm, license: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility Email *</label>
                                <input 
                                  type="email" 
                                  required
                                  placeholder="e.g. hello@apexdental.com"
                                  value={addForm.email}
                                  onChange={e => handleFacilityEmailChange(e.target.value)}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Phone</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. +254 700 000 000"
                                  value={addForm.phone}
                                  onChange={e => setAddForm({...addForm, phone: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City/Town</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Nairobi"
                                  value={addForm.city}
                                  onChange={e => setAddForm({...addForm, city: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                             <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical Address</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Upper Hill, Block B, Suite 10"
                                  value={addForm.address}
                                  onChange={e => setAddForm({...addForm, address: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                          </div>
                       </div>

                       {/* Section 2: Owner/Admin Account */}
                       <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">2. Administrator Credentials</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Owner Name *</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="e.g. Dr. Jane Apex"
                                  value={addForm.ownerName}
                                  onChange={e => setAddForm({...addForm, ownerName: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Email *</label>
                                <input 
                                  type="email" 
                                  required
                                  placeholder="e.g. jane@apexdental.com"
                                  value={addForm.ownerEmail}
                                  onChange={e => setAddForm({...addForm, ownerEmail: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                             <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between items-center">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Password *</label>
                                   <button 
                                     type="button"
                                     onClick={generatePassword}
                                     className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                                   >
                                      <Zap className="h-3 w-3" /> Auto-Generate
                                   </button>
                                </div>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="Choose or generate a secure password"
                                  value={addForm.ownerPassword}
                                  onChange={e => setAddForm({...addForm, ownerPassword: e.target.value})}
                                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-blue-50/20 transition-all"
                                />
                             </div>
                          </div>
                       </div>

                       {/* Section 3: Subscription plans */}
                       <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">3. Subscription Setup</h4>
                          <div className="grid grid-cols-2 gap-3">
                             {plans.map(p => (
                                <button 
                                  key={p.id}
                                  type="button"
                                  onClick={() => setAddForm({...addForm, subscriptionPlan: p.name})}
                                  className={`p-4 rounded-2xl border text-left transition-all ${addForm.subscriptionPlan === p.name ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                   <p className={`text-xs font-bold uppercase ${addForm.subscriptionPlan === p.name ? 'text-blue-600' : 'text-slate-900'}`}>{p.name}</p>
                                   <p className="text-[10px] text-slate-400 mt-1">KES {p.price}/mo</p>
                                </button>
                             ))}
                          </div>
                       </div>

                    </div>

                    <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                       <button 
                         type="button"
                         onClick={() => !isSubmittingAdd && setIsAddModalOpen(false)} 
                         className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all"
                       >
                          Cancel
                       </button>
                       <button 
                         type="submit" 
                         disabled={isSubmittingAdd}
                         className="flex-2 px-12 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-bold text-white uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          {isSubmittingAdd ? (
                             <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Provisioning...
                             </>
                          ) : (
                             "Create Organization"
                          )}
                       </button>
                    </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Fixed Side Drawer Overlay */}
        <AnimatePresence>
          {selectedFacility && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedFacility(null)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[60]" />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-screen w-full md:w-[540px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.05)] z-[70] overflow-y-auto">
                 <div className="p-8 pb-32">
                    <div className="flex justify-between items-start mb-8">
                       <div className="flex items-center gap-5">
                          <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                             <Building2 className="h-8 w-8" />
                          </div>
                          <div>
                             <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedFacility.name}</h2>
                             <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[9px] font-bold uppercase tracking-widest">
                                   <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                                   {selectedFacility.subscription?.status || 'active'}
                                </div>
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">{selectedFacility.subscription?.planName}</span>
                             </div>
                          </div>
                       </div>
                       <button onClick={() => setSelectedFacility(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="h-5 w-5 text-slate-300" /></button>
                    </div>

                    <div className="flex border-b border-slate-100 mb-8 overflow-x-auto no-scrollbar">
                       {['Overview', 'Subscription', 'Facilities', 'Documents', 'Activity'].map(tab => (
                          <button key={tab} onClick={() => setActiveSideTab(tab)} className={`px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap border-b-2 transition-all ${activeSideTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{tab}</button>
                       ))}
                    </div>

                    {loadingTabData ? (
                       <div className="py-24 text-center">
                          <Loader2 className="h-10 w-10 animate-spin text-blue-100 mx-auto mb-6" />
                          <p className="text-[11px] font-medium text-slate-300 uppercase tracking-[0.3em]">Fetching {activeSideTab} Data...</p>
                       </div>
                    ) : (
                       <div className="space-y-10">
                          {activeSideTab === 'Overview' && (
                             <div className="space-y-10">
                                <div className="space-y-6">
                                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Primary Details</h4>
                                   <div className="grid grid-cols-1 gap-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-50">
                                      {[
                                        { label: 'Official Name', value: selectedFacility.name, icon: Building2 },
                                        { label: 'Admin Email', value: selectedFacility.email, icon: Mail },
                                        { label: 'Account Owner', value: facilityOwners[selectedFacility.id]?.name || 'Pending Linking', icon: User },
                                        { label: 'Creation Date', value: selectedFacility.createdAt ? new Date(selectedFacility.createdAt.seconds * 1000).toLocaleDateString('en-GB') : '07/05/2026', icon: Calendar }
                                      ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                           <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{item.label}</span>
                                           <span className="text-sm font-normal text-slate-900">{item.value}</span>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                                <div className="space-y-6">
                                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Quick Metrics</h4>
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Members</p>
                                         <p className="text-xl font-black text-slate-900">{staffCounts[selectedFacility.id] || 0}</p>
                                      </div>
                                      <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Branches</p>
                                         <p className="text-xl font-black text-slate-900">{selectedFacility.subscription?.maxLocations || 1}</p>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          )}

                          {activeSideTab === 'Subscription' && (
                             <div className="space-y-8">
                                <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
                                   <Zap className="absolute right-[-20px] top-[-20px] h-40 w-40 text-white/10 rotate-12" />
                                   <div className="relative z-10">
                                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2">Current Tier</p>
                                      <h3 className="text-4xl font-black mb-6">{selectedFacility.subscription?.planName}</h3>
                                      <div className="flex items-center gap-6">
                                         <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Status</p>
                                            <p className="text-sm font-bold uppercase">{selectedFacility.subscription?.status}</p>
                                         </div>
                                         <div className="h-8 w-px bg-white/20" />
                                         <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Staff Limit</p>
                                            <p className="text-sm font-bold">{selectedFacility.subscription?.maxStaff} Members</p>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                                <div className="space-y-6">
                                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Feature Entitlements</h4>
                                   <div className="grid grid-cols-1 gap-3">
                                      {Object.entries(selectedFacility.subscription?.features || {}).map(([key, val]) => (
                                         <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-50">
                                            <span className="text-xs font-medium text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            {val ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             </div>
                          )}

                          {activeSideTab === 'Facilities' && (
                             <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Connected Branches</h4>
                                   <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-widest">{activeOrgFacilities.length} Registered</span>
                                </div>
                                <div className="space-y-3">
                                   {activeOrgFacilities.length > 0 ? activeOrgFacilities.map(f => (
                                      <div key={f.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                                         <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><MapPin className="h-5 w-5" /></div>
                                            <div>
                                               <p className="text-sm font-bold text-slate-900 mb-0.5">{f.facilityName || f.name}</p>
                                               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{f.address || 'Location Unset'}</p>
                                            </div>
                                         </div>
                                         <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-all" />
                                      </div>
                                   )) : (
                                      <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                         <Building2 className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                                         <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">No branch facilities found</p>
                                      </div>
                                   )}
                                </div>
                             </div>
                          )}

                          {activeSideTab === 'Documents' && (
                             <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verification Documents</h4>
                                   <div className="relative">
                                      <input 
                                        type="file" 
                                        id="doc-upload" 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                      />
                                      <label 
                                        htmlFor="doc-upload"
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white uppercase tracking-widest transition-all cursor-pointer"
                                      >
                                         <Plus className="h-3.5 w-3.5" /> Upload
                                      </label>
                                   </div>
                                </div>

                                {selectedFacility.documents?.length > 0 ? (
                                   <div className="grid grid-cols-1 gap-3">
                                      {selectedFacility.documents.map((doc, i) => (
                                         <a 
                                           key={i} 
                                           href={doc.url} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all"
                                         >
                                            <div className="flex items-center gap-4">
                                               <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                  <FileText className="h-5 w-5" />
                                               </div>
                                               <div>
                                                  <p className="text-sm font-bold text-slate-900 mb-0.5">{doc.name}</p>
                                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                                     {formatSafeDate(doc.uploadedAt).date} • {doc.uploadedBy || 'System'}
                                                  </p>
                                               </div>
                                            </div>
                                            <Download className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-all" />
                                         </a>
                                      ))}
                                   </div>
                                ) : (
                                   <div className="p-12 border-2 border-dashed border-slate-100 rounded-3xl text-center bg-slate-50/30">
                                      <FileUp className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                                      <p className="text-sm font-medium text-slate-900">No documents yet</p>
                                      <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">Immutable compliance documents will appear here once verified by the registrar.</p>
                                      <label 
                                        htmlFor="doc-upload"
                                        className="mt-6 inline-flex px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
                                      >
                                         Upload First Document
                                      </label>
                                   </div>
                                )}
                             </div>
                          )}

                          {activeSideTab === 'Activity' && (
                             <div className="space-y-6">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Organization Audit Trail</h4>
                                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-px before:bg-slate-100">
                                   {activeOrgLogs.length > 0 ? activeOrgLogs.map((log, i) => (
                                      <div key={log.id} className="flex gap-6 relative">
                                         <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-sm"><History className="h-4 w-4 text-slate-400" /></div>
                                         <div className="pt-0.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('en-GB') : 'Just now'}</p>
                                            <p className="text-sm font-normal text-slate-900 leading-tight mb-1">{log.action}</p>
                                            <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">{log.description}</p>
                                         </div>
                                      </div>
                                   )) : (
                                      <div className="py-12 text-center bg-slate-50 rounded-2xl">
                                         <Activity className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                                         <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">No recent activity logs</p>
                                      </div>
                                   )}
                                </div>
                             </div>
                          )}
                       </div>
                    )}
                 </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
