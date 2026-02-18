import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import facilityService from '../../services/facilityService';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  Building2,

  Edit2,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    limits: { staff: 2, locations: 1 }
  },
  {
    id: 'growth',
    name: 'Growth',
    limits: { staff: 5, locations: 2 }
  },
  {
    id: 'pro',
    name: 'Pro',
    limits: { staff: 20, locations: 5 }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    limits: { staff: 999, locations: 999 }
  }
];
export default function Subscriptions() {
  const { userData } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [requests, setRequests] = useState([]);
  const [staffCounts, setStaffCounts] = useState({});
  const [facilityOwners, setFacilityOwners] = useState({});

  // Form State
  const [editForm, setEditForm] = useState({
    planName: '',
    maxStaff: 0,
    maxLocations: 0,
    expiryDate: '',
    status: 'active'
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
        if (owner) owners[fac.id] = owner.name;
        
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
      setNotification({ type: 'success', message: 'Request dismissed.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error dismissing request:", error);
    }
  };

  const handleEdit = (facility) => {
    setSelectedFacility(facility);
    setEditForm({
      planName: facility.subscription?.planName || 'Custom Plan',
      maxStaff: facility.subscription?.maxStaff || 5,
      maxLocations: facility.subscription?.maxLocations || 1,
      expiryDate: facility.subscription?.expiryDate ? facility.subscription.expiryDate.split('T')[0] : '',
      status: facility.subscription?.status || 'active'
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
      await facilityService.updateSubscription(selectedFacility.id, {
        ...editForm,
        planId: 'custom', // For now
        startDate: selectedFacility.subscription?.startDate || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      fetchFacilities(); // Refresh
      setNotification({ type: 'success', message: 'Subscription successfully updated!' });
      
      // Auto-complete any pending requests for this facility
      const pendingReq = requests.find(r => r.facilityId === selectedFacility.id && r.status === 'pending');
      if (pendingReq) {
        await facilityService.updateSubscriptionRequest(pendingReq.id, 'completed');
        setRequests(prev => prev.map(r => r.id === pendingReq.id ? { ...r, status: 'completed' } : r));
      }
      
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Update error:", error);
      setNotification({ type: 'error', message: 'Failed to update subscription.' });
      setTimeout(() => setNotification(null), 3000);
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Management</h1>
            <p className="text-slate-500 font-medium">Manage client plans, limits, and billing status.</p>
          </div>
        </div>

        {/* Pending Requests Section */}
        {requests.some(r => r.status === 'pending') && (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 space-y-4">
             <h3 className="text-lg font-black text-amber-900 flex items-center gap-2">
                <Clock className="h-5 w-5" /> Pending Upgrade Requests
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {requests.filter(r => r.status === 'pending').map(req => {
                 const facility = facilities.find(f => f.id === req.facilityId);
                 return (
                   <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-900">{facility?.name || 'Unknown Facility'}</p>
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
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-lg">Pending</span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <p className="flex justify-between"><strong>Current:</strong> <span>{req.currentPlan}</span></p>
                         <p className="flex justify-between"><strong>Requested:</strong> <span className="text-primary-600 font-bold">{req.requestedPlan}</span></p>
                         <div className="h-px bg-slate-200 my-2"></div>
                         <p className="italic text-slate-500">"{req.message}"</p>
                         <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(req.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handleDismiss(req.id)} className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200">Dismiss</button>
                         <button onClick={() => handleEdit(facility)} className="flex-1 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800">Process</button>
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
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest pl-6">Facility / Client</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Current Plan</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Usage Limits</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right pr-6">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {facilities.map((fac) => (
                    <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900">{fac.name}</div>
                          <div className="text-xs text-slate-500">{fac.email}</div>
                       </td>
                       <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
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
                          {fac.subscription?.status === 'active' ? (
                             <span className="text-green-600 text-xs font-black uppercase tracking-wider flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Active</span>
                          ) : (
                             <span className="text-red-500 text-xs font-black uppercase tracking-wider flex items-center gap-1"><XCircle className="h-3 w-3"/> {fac.subscription?.status}</span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1 font-bold">
                             Expires: {fac.subscription?.expiryDate ? new Date(fac.subscription.expiryDate).toLocaleDateString() : 'Never'}
                          </div>
                       </td>
                       <td className="p-4 text-right pr-6">
                          <button 
                            onClick={() => handleEdit(fac)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          >
                             <Edit2 className="h-4 w-4" />
                          </button>
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
               className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-black text-slate-900">Modify Subscription</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><XCircle className="h-5 w-5 text-slate-400" /></button>
               </div>
               
               <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Name</label>
                    <div className="relative">
                      <select
                        value={PLANS.some(p => p.name === editForm.planName) ? editForm.planName : 'custom'}
                        onChange={(e) => {
                           if (e.target.value === 'custom') {
                             setEditForm({...editForm, planName: 'Custom Plan'});
                           } else {
                             handlePlanSelect(e.target.value);
                           }
                        }}
                        className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 mb-2 appearance-none"
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
                        placeholder="Or enter custom plan name..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Staff</label>
                        <input 
                        type="number" 
                        value={editForm.maxStaff}
                        onChange={e => setEditForm({...editForm, maxStaff: parseInt(e.target.value)})}
                        className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Locations</label>
                        <input 
                        type="number" 
                        value={editForm.maxLocations}
                        onChange={e => setEditForm({...editForm, maxLocations: parseInt(e.target.value)})}
                        className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                    <input 
                      type="date" 
                      value={editForm.expiryDate}
                      onChange={e => setEditForm({...editForm, expiryDate: e.target.value})}
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                    <select 
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value})}
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="suspended">Suspended</option>
                    </select>
                  </div>
               </div>

               <div className="p-6 bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-primary-600 transition-colors">Save Changes</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
             <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
             </div>
             {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
