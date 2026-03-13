import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import facilityService from '../../services/facilityService';
import userService from '../../services/userService';
import auditService from '../../services/auditService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  CreditCard, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  Building2,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Shield,
  AlertTriangle,
  X,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const PLANS = [
  {
    id: 'essential',
    name: 'Essential',
    limits: { staff: 10, locations: 1 }
  },
  {
    id: 'professional',
    name: 'Professional',
    limits: { staff: 30, locations: 2 }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    limits: { staff: 75, locations: 5 }
  }
];
export default function Subscriptions() {
  const { userData } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState([]);
  const [staffCounts, setStaffCounts] = useState({});
  const [facilityOwners, setFacilityOwners] = useState({});

  // Form State
  const [editForm, setEditForm] = useState({
    planName: '',
    name: '',
    maxStaff: 0,
    maxLocations: 0,
    expiryDate: '',
    status: 'active',
    smsWalletBalance: 0,
    ownerEmail: '',
    ownerUid: '',
    features: {
      audioDictation: true,
      aiExtraction: false,
      multiBranch: true,
      smsNotifications: false
    }
  });

  // Wiring Modal State
  const [wiringModal, setWiringModal] = useState({
    isOpen: false,
    email: '',
    searching: false,
    foundUser: null
  });

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    facility: null,
    confirmText: '',
    isDeleting: false
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const [facData, reqData, allUsers] = await Promise.all([
        facilityService.getAllFacilities(),
        facilityService.getAllSubscriptionRequests(),
        userService.getAllUsers()
      ]);
      setFacilities(facData);
      setRequests(reqData || []);

      // Calculate Staff Counts & Find Owners
      const counts = {};
      const owners = {};

      facData.forEach(fac => {
        const facUsers = allUsers.filter(u => u.facilityId === fac.id);
        const owner = facUsers.find(u => u.role === 'clinic_owner');
        if (owner) {
          owners[fac.id] = { name: owner.name, email: owner.email, uid: owner.uid, isLinked: true };
        } else {
          // Check for "SYSTEM" ghost users that should belong here
          const systemUsers = allUsers.filter(u => u.facilityId === 'SYSTEM' || !u.facilityId);
          const potentialOwner = systemUsers.find(u => u.email === fac.email);
          if (potentialOwner) {
            owners[fac.id] = { 
               name: potentialOwner.name, 
               email: potentialOwner.email, 
               uid: potentialOwner.uid, 
               isLinked: false // DISCONNECTED
            };
          }
        }
        
        // Count all users except the owner as "Staff"
        counts[fac.id] = facUsers.filter(u => u.role !== 'clinic_owner').length;
      });

      setStaffCounts(counts);
      setFacilityOwners(owners);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (requestId) => {
    try {
      await facilityService.updateSubscriptionRequest(requestId, 'dismissed');
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'dismissed' } : r));
      
      const req = requests.find(r => r.id === requestId);
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'DISMISS_SUBSCRIPTION_REQUEST',
        module: 'GOVERNANCE',
        description: `Dismissed subscription upgrade request from ${req?.facilityName || 'Facility'}`,
        metadata: { requestId, facilityId: req?.facilityId }
      });

      success('Request dismissed.');
    } catch (error) {
      console.error("Error dismissing request:", error);
    }
  };

  const handleEdit = (facility) => {
    setSelectedFacility(facility);
    setEditForm({
      planName: facility.subscription?.planName || 'Custom Plan',
      name: facility.name || '',
      maxStaff: facility.subscription?.maxStaff || 5,
      maxLocations: facility.subscription?.maxLocations || 1,
      expiryDate: facility.subscription?.expiryDate ? facility.subscription.expiryDate.split('T')[0] : '',
      status: facility.subscription?.status || 'active',
      smsWalletBalance: facility.smsWalletBalance || 0,
      ownerEmail: facilityOwners[facility.id]?.email || '',
      ownerUid: facilityOwners[facility.id]?.uid || '',
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
    const selectedPlan = PLANS.find(p => p.name === planName);
    if (selectedPlan) {
      setEditForm(prev => ({
        ...prev,
        planName: selectedPlan.name,
        maxStaff: selectedPlan.limits.staff,
        maxLocations: selectedPlan.limits.locations
      }));
    } else {
      setEditForm(prev => ({ ...prev, planName: planName }));
    }
  };

  const handleSave = async () => {
    try {
      const { smsWalletBalance, name, ownerEmail, ownerUid, ...subData } = editForm;
      const updateData = {
        ...subData,
        planId: 'custom', 
        startDate: selectedFacility.subscription?.startDate || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update both subscription and root balance/name
      await facilityService.updateProfile(selectedFacility.id, {
          name,
          subscription: updateData,
          smsWalletBalance: parseInt(smsWalletBalance)
      });
      
      // Log the activity to Audit Trail
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Superadmin',
        action: 'UPDATE_SUBSCRIPTION',
        module: 'GOVERNANCE',
        description: `Updated subscription for ${selectedFacility.name} (Plan: ${editForm.planName}, Status: ${editForm.status})`,
        metadata: {
          facilityId: selectedFacility.id,
          facilityName: selectedFacility.name,
          newPlan: editForm.planName,
          status: editForm.status,
          limits: { staff: editForm.maxStaff, locations: editForm.maxLocations }
        }
      });

      setIsModalOpen(false);
      fetchFacilities(); // Refresh
      success('Subscription successfully updated!');
      
      // Auto-complete any pending requests for this facility
      const pendingReq = requests.find(r => r.facilityId === selectedFacility.id && r.status === 'pending');
      if (pendingReq) {
        await facilityService.updateSubscriptionRequest(pendingReq.id, 'completed');
        setRequests(prev => prev.map(r => r.id === pendingReq.id ? { ...r, status: 'completed' } : r));
      }
    } catch (error) {
      console.error("Update error:", error);
      toastError('Failed to update subscription.');
    }
  };

  const handleFixWiring = async (suggestedEmail = null) => {
    setWiringModal({
        isOpen: true,
        email: suggestedEmail || '',
        searching: false,
        foundUser: null
    });
  };

  const handleSearchUser = async () => {
    if (!wiringModal.email) return;
    try {
        setWiringModal(prev => ({ ...prev, searching: true, foundUser: null }));
        const allUsers = await userService.getAllUsers();
        const user = allUsers.find(u => u.email?.toLowerCase() === wiringModal.email.toLowerCase());
        
        if (!user) {
            toastError("User not found with that email.");
        } else {
            setWiringModal(prev => ({ ...prev, foundUser: user }));
        }
    } catch (err) {
        toastError("Search failed.");
    } finally {
        setWiringModal(prev => ({ ...prev, searching: false }));
    }
  };

  const executeWiringFix = async () => {
    if (!wiringModal.foundUser || !selectedFacility) return;
    try {
        await userService.updateUser(wiringModal.foundUser.uid, { facilityId: selectedFacility.id });
        success("Wiring fixed! User is now linked.");
        
        setEditForm(prev => ({
            ...prev,
            ownerEmail: wiringModal.foundUser.email,
            ownerUid: wiringModal.foundUser.uid
        }));
        
        setWiringModal({ isOpen: false, email: '', searching: false, foundUser: null });
        fetchFacilities();
    } catch (err) {
        toastError("Failed to link user.");
    }
  };

  const handleDeleteFacility = (fac) => {
    setDeleteModal({
        isOpen: true,
        facility: fac,
        confirmText: '',
        isDeleting: false
    });
  };

  const executeDeleteFacility = async () => {
    const fac = deleteModal.facility;
    if (!fac) return;

    const expected = `DELETE ${fac.name || ''}`.trim().toUpperCase();
    const actual = deleteModal.confirmText.trim().toUpperCase();

    if (actual !== expected) {
        toastError("Confirmation text does not match exactly.");
        return;
    }

    try {
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        await facilityService.deleteFacility(fac.id);
        
        await auditService.logActivity({
            userId: userData?.uid,
            userName: userData?.name || 'Superadmin',
            action: 'DELETE_ORGANIZATION',
            module: 'GOVERNANCE',
            description: `Permanently deleted organization: ${fac.name} (${fac.id})`,
            metadata: { facilityId: fac.id, facilityName: fac.name }
        });
        
        success("Organization permanently removed.");
        setDeleteModal({ isOpen: false, facility: null, confirmText: '', isDeleting: false });
        fetchFacilities();
    } catch (err) {
        console.error("Delete Error details:", err);
        toastError(`Failed to delete: ${err.message || 'Check permissions'}`);
    } finally {
        setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  if (userData?.role !== 'superadmin') {
    return <DashboardLayout><div>Access Denied</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Subscription Management</h1>
            <p className="text-slate-500 font-medium">Manage client plans, limits, and billing status.</p>
          </div>
        </div>

        {/* Pending Requests Section */}
        {requests.some(r => r.status === 'pending') && (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 space-y-4">
             <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                <Clock className="h-5 w-5" /> Pending Upgrade Requests
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {requests.filter(r => r.status === 'pending').map(req => {
                 const facility = facilities.find(f => f.id === req.facilityId);
                 return (
                   <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-900">{facility?.name || 'Unknown Facility'}</p>
                          <div className="flex flex-col gap-1 mt-1">
                            {facility?.email && (
                              <a href={`mailto:${facility.email}`} className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1.5 transition-colors">
                                <Mail className="h-3 w-3" /> {facility.email}
                              </a>
                            )}
                            {facility?.phone && (
                              <a href={`tel:${facility.phone}`} className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1.5 transition-colors">
                                <Phone className="h-3 w-3" /> {facility.phone}
                              </a>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase rounded-lg">Pending</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <p className="flex justify-between"><strong>Current:</strong> <span>{req.currentPlan}</span></p>
                         <p className="flex justify-between"><strong>Requested:</strong> <span className="text-primary-600 font-medium">{req.requestedPlan}</span></p>
                         <div className="h-px bg-slate-200 my-2"></div>
                         <p className="italic text-slate-500">"{req.message}"</p>
                         <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(req.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleDismiss(req.id)} className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200">Dismiss</button>
                         <button onClick={() => handleEdit(facility)} className="flex-1 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800">Process</button>
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-widest pl-6">Facility / Client</th>
                    <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-widest">Current Plan</th>
                    <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-widest">Usage Limits</th>
                    <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-widest">SMS Wallet</th>
                    <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-xs font-medium text-slate-500 uppercase tracking-widest text-right pr-6">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {facilities.map((fac) => (
                    <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="p-4 pl-6">
                          <div className="font-medium text-slate-900">{fac.name || 'Unnamed Facility'}</div>
                          <div className="flex flex-col gap-0.5">
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Profile Email: {fac.email}</div>
                             {facilityOwners[fac.id] ? (
                                <div className={`text-xs font-medium flex items-center gap-1 ${facilityOwners[fac.id].isLinked ? 'text-primary-600' : 'text-amber-600'}`}>
                                    <Users className="h-3 w-3" /> 
                                    Owner: {facilityOwners[fac.id].email}
                                    {!facilityOwners[fac.id].isLinked && (
                                       <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-[8px] rounded uppercase animate-pulse">
                                          <Shield className="h-2 w-2" /> Broken Link
                                       </span>
                                    )}
                                </div>
                             ) : (
                                <div className="text-[10px] text-red-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                                    <XCircle className="h-2.5 w-2.5" /> No User Linked
                                </div>
                             )}
                          </div>
                       </td>
                       <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                             {fac.subscription?.planName || 'N/A'}
                          </span>
                       </td>
                       <td className="p-4 text-sm font-medium text-slate-600">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3"/> Max {fac.subscription?.maxStaff || 0}</span>
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3"/> Max {fac.subscription?.maxLocations || 0}</span>
                          </div>
                       </td>
                       <td className="p-4">
                          <div className="flex items-center gap-2">
                             <div className={`h-2 w-2 rounded-full ${(fac.smsWalletBalance || 0) > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                             <span className="text-sm font-bold text-slate-700">{(fac.smsWalletBalance || 0).toLocaleString()} <span className="text-[10px] font-medium text-slate-400">Credits</span></span>
                          </div>
                       </td>
                       <td className="p-4">
                          {fac.subscription?.status === 'active' ? (
                             <span className="text-emerald-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Active</span>
                          ) : fac.subscription?.status === 'trial' ? (
                             <span className="text-blue-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3"/> Trial</span>
                          ) : fac.subscription?.status === 'suspended' ? (
                             <span className="text-orange-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><XCircle className="h-3 w-3"/> Suspended</span>
                          ) : (
                             <span className="text-red-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><XCircle className="h-3 w-3"/> {fac.subscription?.status}</span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1 font-medium">
                             Expires: {fac.subscription?.expiryDate ? new Date(fac.subscription.expiryDate).toLocaleDateString() : 'Never'}
                          </div>
                       </td>
                        <td className="p-4 text-right pr-6">
                           <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleEdit(fac)}
                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                title="Edit Subscription"
                              >
                                 <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteFacility(fac)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Organization"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           </div>
                        </td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Modify Subscription</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Adjust plan limits and system configuration</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XCircle className="h-5 w-5 text-slate-400" /></button>
               </div>
               
               <div className="p-8 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: BASIC INFO */}
                    <div className="space-y-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Basic Configuration</p>
                      
                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1.5 ml-1">Facility Identity</label>
                        <input 
                          type="text" 
                          value={editForm.name}
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1.5 ml-1">Service Plan</label>
                        <div className="space-y-2">
                          <select
                            value={PLANS.some(p => p.name === editForm.planName) ? editForm.planName : 'custom'}
                            onChange={(e) => {
                               if (e.target.value === 'custom') {
                                 setEditForm({...editForm, planName: 'Custom Plan'});
                               } else {
                                 handlePlanSelect(e.target.value);
                               }
                            }}
                            className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                          >
                             <option value="custom">Custom Plan</option>
                             {PLANS.map(p => (
                               <option key={p.id} value={p.name}>{p.name} (Max {p.limits.staff} Staff)</option>
                             ))}
                          </select>
                          <input 
                            type="text" 
                            value={editForm.planName}
                            onChange={e => setEditForm({...editForm, planName: e.target.value})}
                            placeholder="Enter custom plan name..."
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1.5 ml-1">Account Status</label>
                        <select 
                          value={editForm.status}
                          onChange={e => setEditForm({...editForm, status: e.target.value})}
                          className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all capitalize"
                        >
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="expired">Expired</option>
                            <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: LIMITS & FINANCIALS */}
                    <div className="space-y-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Limits & Financials</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1.5 ml-1">Max Staff</label>
                            <input 
                              type="number" 
                              value={editForm.maxStaff}
                              onChange={e => setEditForm({...editForm, maxStaff: parseInt(e.target.value)})}
                              className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase mb-1.5 ml-1">Max Branches</label>
                            <input 
                              type="number" 
                              value={editForm.maxLocations}
                              onChange={e => setEditForm({...editForm, maxLocations: parseInt(e.target.value)})}
                              className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1.5 ml-1">Plan Expiry Date</label>
                        <input 
                          type="date" 
                          value={editForm.expiryDate}
                          onChange={e => setEditForm({...editForm, expiryDate: e.target.value})}
                          className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-bold text-indigo-600 uppercase mb-1.5 ml-1 flex items-center gap-2">
                          <CreditCard className="h-3 w-3" /> SMS Wallet Balance
                        </label>
                        <div className="relative group">
                            <input 
                              type="number" 
                              value={editForm.smsWalletBalance}
                              onChange={e => setEditForm({...editForm, smsWalletBalance: parseInt(e.target.value) || 0})}
                              className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl font-bold text-sm text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-16"
                              placeholder="0"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-300 uppercase">Credits</div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 italic ml-1 leading-tight">Changes are immediately reflected in the clinic's dashboard.</p>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM SECTION: FULL WIDTH */}
                  <div className="mt-10 space-y-8">
                    {/* WIRING */}
                    <div className="pt-6 border-t-2 border-slate-50">
                       <div className="flex items-center justify-between mb-3">
                          <label className="block text-xs font-bold text-primary-600 uppercase tracking-tight flex items-center gap-2">
                             <Shield className="h-3.5 w-3.5" /> System Wiring (Identity Link)
                          </label>
                          <button 
                            onClick={() => handleFixWiring(editForm.ownerEmail)}
                            className="text-[10px] font-bold bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-all flex items-center gap-1.5 border border-primary-100"
                          >
                            {facilityOwners[selectedFacility?.id]?.isLinked ? 'Relink Account' : '🚀 AUTO-FIX BROKEN LINK'}
                          </button>
                       </div>
                       <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                             <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Clinic Owner Email</p>
                             <p className="font-bold text-sm text-slate-800">{editForm.ownerEmail || 'None'}</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                             <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Firestore User UID</p>
                             <p className="font-mono text-[11px] text-slate-500 truncate">{editForm.ownerUid || 'N/A'}</p>
                          </div>
                       </div>
                    </div>

                    {/* FEATURES */}
                    <div className="pt-6 border-t-2 border-slate-50">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Enterprise Feature Authorization</label>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.keys(editForm.features).map((flag) => (
                            <button
                              key={flag}
                              type="button"
                              onClick={() => setEditForm({
                                ...editForm,
                                features: { ...editForm.features, [flag]: !editForm.features[flag] }
                              })}
                              className={`flex flex-col items-start gap-2 p-3.5 rounded-2xl border-2 transition-all
                                ${editForm.features[flag] ? 'bg-primary-50 border-primary-200 text-primary-900' : 'bg-slate-50 border-transparent text-slate-400 md:grayscale'}
                              `}
                            >
                               <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${editForm.features[flag] ? 'bg-primary-600 border-primary-600' : 'bg-white border-slate-200'}`}>
                                  {editForm.features[flag] && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                               </div>
                               <span className="text-[9px] font-black uppercase tracking-wider">{flag.replace(/([A-Z])/g, ' $1')}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
               </div>

               <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest text-[10px]">Close</button>
                  <button onClick={handleSave} className="px-10 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-primary-600 shadow-xl shadow-slate-200 transition-all uppercase tracking-widest text-[10px]">Apply Parameters</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REFINED WIRING MODAL - MATCHES APP THEME */}
      <AnimatePresence>
        {wiringModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setWiringModal({ ...wiringModal, isOpen: false })}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">System Wiring</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Link owner identity to facility</p>
                  </div>
                  <button onClick={() => setWiringModal({ ...wiringModal, isOpen: false })} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
               </div>
               
               <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-2 ml-1">Search User Email</label>
                    <div className="relative">
                        <input 
                           type="email"
                           value={wiringModal.email}
                           onChange={e => setWiringModal({ ...wiringModal, email: e.target.value, foundUser: null })}
                           placeholder="e.g. owner@clinic.com"
                           className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all pr-24"
                        />
                        <button 
                           onClick={handleSearchUser}
                           disabled={wiringModal.searching || !wiringModal.email}
                           className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary-600 transition-all"
                        >
                           {wiringModal.searching ? '...' : 'Search'}
                        </button>
                    </div>
                  </div>

                  <div className="min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                    {wiringModal.foundUser ? (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full p-4 flex items-center gap-4">
                          <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold text-lg">
                             {wiringModal.foundUser.name[0]}
                          </div>
                          <div className="flex-1">
                             <p className="text-sm font-bold text-slate-900">{wiringModal.foundUser.name}</p>
                             <p className="text-[10px] text-slate-400 font-mono italic">{wiringModal.foundUser.uid}</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                       </motion.div>
                    ) : (
                       <p className="text-xs text-slate-400 font-medium italic">Enter email and click search</p>
                    )}
                  </div>
               </div>

               <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setWiringModal({ ...wiringModal, isOpen: false })} className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel</button>
                  <button 
                    onClick={executeWiringFix}
                    disabled={!wiringModal.foundUser}
                    className="px-8 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-primary-600 shadow-xl shadow-slate-200 transition-all uppercase tracking-widest disabled:opacity-30 disabled:shadow-none"
                  >
                    Confirm Link
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REFINED DELETE MODAL - MATCHES APP THEME */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => !deleteModal.isDeleting && setDeleteModal({ isOpen: false, facility: null, confirmText: '', isDeleting: false })}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Delete Organization</h3>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Permanent Removal Action</p>
                  </div>
                  <button onClick={() => setDeleteModal({ isOpen: false, facility: null, confirmText: '', isDeleting: false })} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
               </div>
               
               <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-red-900 font-medium leading-tight">
                        You are deleting <span className="font-bold">{deleteModal.facility?.name}</span>. This will remove the facility profile permanently.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 text-center">Safety Lock: Type matching text</label>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center mb-3">
                        <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">DELETE {deleteModal.facility?.name}</span>
                    </div>
                    <input 
                        type="text"
                        value={deleteModal.confirmText}
                        disabled={deleteModal.isDeleting}
                        onChange={e => setDeleteModal({ ...deleteModal, confirmText: e.target.value })}
                        placeholder="Type the message above..."
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm text-center outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-inner"
                    />
                  </div>
               </div>

               <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setDeleteModal({ isOpen: false, facility: null, confirmText: '', isDeleting: false })} className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel</button>
                  <button 
                    onClick={executeDeleteFacility}
                    disabled={deleteModal.confirmText.trim().toUpperCase() !== `DELETE ${deleteModal.facility?.name || ''}`.trim().toUpperCase() || deleteModal.isDeleting}
                    className="px-8 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all uppercase tracking-widest disabled:opacity-30 disabled:shadow-none"
                  >
                    {deleteModal.isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
