import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users as UsersIcon,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Shield,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Bell,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserModal from '../../components/modals/UserModal';
import PermissionsEditor from '../../components/modals/PermissionsEditor';
import userService from '../../services/userService';
import facilityService from '../../services/facilityService';
import auditService from '../../services/auditService';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { APP_CONFIG } from '../../config';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permUserId, setPermUserId] = useState(null);
  const { success, error: toastError, warning } = useToast();
  const { confirm } = useConfirm();
  const [facilities, setFacilities] = useState({});
  const [facilityUsage, setFacilityUsage] = useState({}); // { facilityId: { count: 3, max: 5, plan: 'Pro' } }

  const { currentUser, userData, activeStaffCount, subscriptionStatus } = useAuth(); // Get userData for facilityId

  useEffect(() => {
    if (userData) {
        fetchUsers();
    }
  }, [userData]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let data = [];
      const stats = {};
      const facMap = {};

      // STRICT DATA ISOLATION:
      if (userData?.role === 'superadmin') {
         // Fetch all users AND all facilities to map subscriptions
         const [allUsers, allFacilities] = await Promise.all([
           userService.getAllUsers(),
           facilityService.getAllFacilities()
         ]);

         // Filter: Show only Clinic Owners and Superadmins. Hide doctors/staff.
         data = allUsers.filter(u => ['superadmin', 'clinic_owner'].includes(u.role));

         // Calculate Usage Stats
         allFacilities.forEach(fac => {
           facMap[fac.id] = fac;
           const staffCount = allUsers.filter(u => u.facilityId === fac.id && u.role !== 'clinic_owner').length;
           stats[fac.id] = {
             count: staffCount,
             max: fac.subscription?.maxStaff || 1,
             plan: fac.subscription?.planName || 'Free'
           };
         });
         
      } else if (userData?.facilityId && userData.facilityId !== 'SYSTEM') {
          // CLINIC ISOLATION: 
          const facUsers = await userService.getUsersByFacility(userData.facilityId);
          // Safety Filter: Never show Superadmins to Clinic Owners/Staff
          data = facUsers.filter(u => u.role !== 'superadmin');
       } else if (userData?.facilityId === 'SYSTEM') {
          // If still in SYSTEM mode, only show themselves to avoid seeing other SYSTEM users (like Jebin)
          data = [userData];
       } else {
          data = [];
       }
       setUsers(data);
       setFacilityUsage(stats);
       setFacilities(facMap);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (userData?.role === 'clinic_owner' && subscriptionStatus) {
       if (activeStaffCount >= subscriptionStatus.maxStaff) {
          warning(`Plan Limit Reached! Your plan allows max ${subscriptionStatus.maxStaff} staff members.`);
          return;
       }
    }
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userForm) => {
    try {
      // FORCE FACILITY ID:
      const finalData = { 
        ...userForm, 
        facilityId: userData.facilityId // Link to creator's facility
      };

      if (selectedUser) {
        // Exclude password from updates if it somehow sneaks in
        const { password, ...updateData } = finalData;
        await userService.updateUser(selectedUser.id, updateData);
        
        await auditService.logActivity({
          userId: userData?.uid,
          userName: userData?.name || 'Admin',
          action: 'UPDATE_USER',
          module: 'GOVERNANCE',
          description: `Updated user profile for ${updateData.name} (${updateData.email})`,
          metadata: { targetUserId: selectedUser.id, role: updateData.role, status: updateData.status }
        });

        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updateData } : u));
        success('User updated successfully!');
      } else {
        const { password, ...profileData } = finalData;
        
        // Prevent Clinic Owners from creating Superadmins
        if (userData.role === 'clinic_owner' && profileData.role === 'superadmin') {
            throw new Error("You cannot create Superadmin accounts.");
        }

        // --- CHECK STAFF LIMITS (Subscription Enforcement) ---
        if (userData?.role === 'clinic_owner' && subscriptionStatus) {
             if (activeStaffCount >= subscriptionStatus.maxStaff) {
                 throw new Error(`Plan Limit Reached! Your plan allows max ${subscriptionStatus.maxStaff} staff members. Please upgrade your subscription.`);
             }
        }
        // -----------------------------------------------------

        if (password) {
           const savedUser = await userService.createStaffAccount(profileData, password);
           
           await auditService.logActivity({
             userId: userData?.uid,
             userName: userData?.name || 'Admin',
             action: 'CREATE_USER',
             module: 'GOVERNANCE',
             description: `Created new ${profileData.role} account: ${profileData.name} (${profileData.email})`,
             metadata: { targetUserId: savedUser.id, role: profileData.role, facilityId: profileData.facilityId }
           });

           setUsers(prev => [savedUser, ...prev]);
           success('Staff account and profile created!');
        } else {
           // Fallback for cases where password might be missing (should be required in modal)
           const savedUser = await userService.createUser(profileData);

           await auditService.logActivity({
             userId: userData?.uid,
             userName: userData?.name || 'Admin',
             action: 'CREATE_USER_PROFILE',
             module: 'GOVERNANCE',
             description: `Created user profile (No Auth) for ${profileData.name}`,
             metadata: { targetUserId: savedUser.id, role: profileData.role }
           });

           setUsers(prev => [savedUser, ...prev]);
           success('Profile created (No Auth Account)');
        }
      }
    } catch (error) {
      console.error("Save user error:", error);
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = "This email was partially registered in a previous failed attempt. Please use a different email or delete from Firebase Auth.";
      }
      toastError(`Failed: ${message}`);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
       title: 'Remove User Account',
       message: 'Are you sure you want to completely remove this user? This action cannot be undone.',
       confirmText: 'Remove User',
       cancelText: 'Cancel',
       isDestructive: true
    });
    
    if (isConfirmed) {
      try {
        const targetUser = users.find(u => u.id === id);
        await userService.deleteUser(id);
        
        await auditService.logActivity({
          userId: userData?.uid,
          userName: userData?.name || 'Admin',
          action: 'DELETE_USER',
          module: 'GOVERNANCE',
          description: `Deleted user: ${targetUser?.name || 'Unknown'} (${targetUser?.email || id})`,
          metadata: { targetUserId: id, facilityId: targetUser?.facilityId }
        });

        setUsers(prev => prev.filter(u => u.id !== id));
        success('User removed successfully.');
      } catch (error) {
        console.error("Delete user error:", error);
        toastError('Failed to delete user.');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-slate-500 mt-1">Manage hospital staff accounts and access permissions.</p>
          </div>
          {userData?.role !== 'superadmin' && (
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Add New User
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none text-slate-600 font-medium"
              >
                <option value="all">All Roles</option>
                {APP_CONFIG.ROLES.filter(r => r.id !== 'superadmin').map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 font-medium text-slate-400 text-xs uppercase tracking-wider px-4">User</th>
                  <th className="pb-4 font-medium text-slate-400 text-xs uppercase tracking-wider px-4">Role</th>
                  <th className="pb-4 font-medium text-slate-400 text-xs uppercase tracking-wider px-4">Status</th>
                  <th className="pb-4 font-medium text-slate-400 text-xs uppercase tracking-wider px-4">Last Login</th>
                  <th className="pb-4 font-medium text-slate-400 text-xs uppercase tracking-wider px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((user, idx) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-medium border border-primary-100/50">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 leading-none">{user.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {user.role === 'clinic_owner' && facilityUsage[user.facilityId] ? (
                           <div className="flex flex-col gap-1">
                             <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100 uppercase tracking-wide">
                               {facilityUsage[user.facilityId].plan} Plan
                             </span>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${facilityUsage[user.facilityId].count >= facilityUsage[user.facilityId].max ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min((facilityUsage[user.facilityId].count / facilityUsage[user.facilityId].max) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">
                                  {facilityUsage[user.facilityId].count}/{facilityUsage[user.facilityId].max} Users
                                </span>
                             </div>
                           </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize
                            ${user.role === 'superadmin' ? 'bg-purple-50 text-purple-600' : 
                              user.role === 'clinic_owner' ? 'bg-blue-50 text-blue-600' : 
                              'bg-green-50 text-green-600'}
                          `}>
                            <Shield className="h-3 w-3" />
                            {user.role.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize
                          ${user.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
                        `}>
                          {user.status?.toLowerCase() === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {user.status || 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {user.lastLogin || 'Never'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 transition-opacity">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => setPermUserId(user.id)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Security Matrix"
                          >
                            <Shield className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-900 rounded-xl">
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No users found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
      />

      <AnimatePresence>
        {permUserId && (
          <PermissionsEditor 
            userId={permUserId} 
            userName={users.find(u => u.id === permUserId)?.name}
            onClose={() => setPermUserId(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {permUserId && (
          <PermissionsEditor 
            userId={permUserId} 
            userName={users.find(u => u.id === permUserId)?.name}
            onClose={() => setPermUserId(null)} 
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
