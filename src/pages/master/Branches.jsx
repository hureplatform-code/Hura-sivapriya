import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MapPin, 
  Map, 
  Plus, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2, 
  ChevronRight,
  Building,
  Settings,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import facilityService from '../../services/facilityService';
import auditService from '../../services/auditService';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    status: 'Active'
  });

  const { userData, subscriptionStatus } = useAuth();
  const { warning, success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  React.useEffect(() => {
    if (userData?.facilityId) {
      fetchBranches();
    }
  }, [userData]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await facilityService.getBranches(userData.facilityId);
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (userData?.role === 'clinic_owner' && subscriptionStatus) {
       // maxLocations includes main clinic. Allowed branches = maxLocations - 1
       const allowedBranches = Math.max(0, (subscriptionStatus.maxLocations || 1) - 1);
       if (branches.length >= allowedBranches) {
           warning(`Plan Limit Reached! Your plan allows max ${subscriptionStatus.maxLocations} locations in total. Please upgrade your subscription to add more branches.`);
           return;
       }
    }
    
    setIsSaving(true);
    try {
      const result = await facilityService.addBranch(userData.facilityId, newBranch);
      
      await auditService.logActivity({
        userId: userData?.uid,
        userName: userData?.name || 'Clinic Owner',
        action: 'ADD_BRANCH',
        module: 'MASTER_SETUP',
        description: `Added new facility branch: ${newBranch.name} at ${newBranch.location}`,
        metadata: { branchId: result.id, branchName: newBranch.name, facilityId: userData.facilityId }
      });

      setShowAdd(false);
      setNewBranch({ name: '', location: '', phone: '', email: '', status: 'Active' });
      success('Branch successfully registered!');
      fetchBranches();
    } catch (error) {
      console.error('Error adding branch:', error);
      toastError('Failed to add branch.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBranch = async (id) => {
    const isConfirmed = await confirm({
      title: 'Remove Branch',
      message: 'Are you sure you want to completely remove this branch? Data linked to this branch will remain in the database but access will be severed.',
      confirmText: 'Remove Branch',
      cancelText: 'Cancel',
      isDestructive: true
    });
    
    if (isConfirmed) {
      try {
        const branchToDelete = branches.find(b => b.id === id);
        await facilityService.deleteBranch(id);
        
        await auditService.logActivity({
          userId: userData?.uid,
          userName: userData?.name || 'Clinic Owner',
          action: 'DELETE_BRANCH',
          module: 'MASTER_SETUP',
          description: `Removed facility branch: ${branchToDelete?.name || id}`,
          metadata: { branchId: id, branchName: branchToDelete?.name, facilityId: userData.facilityId }
        });

        success('Branch has been removed.');
        fetchBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        toastError('Failed to remove branch.');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Branch Management</h1>
            <p className="text-slate-500 mt-1">Manage multiple facility locations and site-specific records.</p>
          </div>
          <button 
            onClick={() => {
              if (userData?.role === 'clinic_owner' && subscriptionStatus) {
                 const allowedBranches = Math.max(0, (subscriptionStatus.maxLocations || 1) - 1);
                 if (branches.length >= allowedBranches) {
                     warning(`Plan Limit Reached! Your plan allows max ${subscriptionStatus.maxLocations} locations in total.`);
                     return;
                 }
              }
              setShowAdd(true);
            }}
            className="flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Add Location
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
             {branches.map((branch) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={branch.id}
                  className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                >
                   <div className="flex items-start justify-between">
                      <div className="flex items-center gap-6">
                         <div className="h-16 w-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                            <Building className="h-8 w-8" />
                         </div>
                         <div>
                            <div className="flex items-center gap-3">
                               <h3 className="font-medium text-slate-900 text-xl tracking-tight">{branch.name}</h3>
                               <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest ${branch.status === 'Active' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                  {branch.status}
                               </span>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-xs font-medium text-slate-400">
                               <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {branch.location}</span>
                               <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {branch.phone}</span>
                            </div>
                         </div>
                      </div>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                             <Trash2 className="h-5 w-5" />
                          </button>
                          <button className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                             <ChevronRight className="h-5 w-5" />
                          </button>
                       </div>
                   </div>
                </motion.div>
             ))}
          </div>

          <div className="space-y-4">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center space-y-4">
                 <div className="h-20 w-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto text-primary-600">
                    <Map className="h-10 w-10" />
                 </div>
                 <h5 className="font-medium text-slate-900">Map View API</h5>
                 <p className="text-xs text-slate-400 font-medium px-4">Integrate Google Maps for real-time fleet and location tracking across your enterprise.</p>
                 <button className="w-full py-4 bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all">
                    Configure API
                 </button>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Add New Branch</h2>
                  <p className="text-slate-500 text-sm">Register a new facility location.</p>
                </div>
                <button 
                  onClick={() => setShowAdd(false)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddBranch} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
                  <input 
                    required
                    type="text" 
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                    placeholder="e.g. Westside Clinic"
                    className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-500/10 rounded-2xl text-sm font-medium transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">Location</label>
                    <input 
                      type="text" 
                      value={newBranch.location}
                      onChange={(e) => setNewBranch({...newBranch, location: e.target.value})}
                      placeholder="e.g. Nairobi"
                      className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-500/10 rounded-2xl text-sm font-medium transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                    <input 
                      type="text" 
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
                      placeholder="+254..."
                      className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-500/10 rounded-2xl text-sm font-medium transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                  <input 
                    type="email" 
                    value={newBranch.email}
                    onChange={(e) => setNewBranch({...newBranch, email: e.target.value})}
                    placeholder="branch@hospital.com"
                    className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-500/10 rounded-2xl text-sm font-medium transition-all outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-500 font-medium rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-4 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'Create Branch'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
