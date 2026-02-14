import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserModal from '../../components/modals/UserModal';
import PermissionsEditor from '../../components/modals/PermissionsEditor';
import userService from '../../services/userService';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permUserId, setPermUserId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateNew = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (selectedUser) {
        // Exclude password from updates if it somehow sneaks in
        const { password, ...updateData } = userData;
        await userService.updateUser(selectedUser.id, updateData);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updateData } : u));
        showNotification('User updated successfully!');
      } else {
        const { password, ...profileData } = userData;
        if (password) {
           const savedUser = await userService.createStaffAccount(profileData, password);
           setUsers(prev => [savedUser, ...prev]);
           showNotification('Staff account and profile created!');
        } else {
           // Fallback for cases where password might be missing (should be required in modal)
           const savedUser = await userService.createUser(profileData);
           setUsers(prev => [savedUser, ...prev]);
           showNotification('Profile created (No Auth Account)');
        }
      }
    } catch (error) {
      console.error("Save user error:", error);
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = "This email was partially registered in a previous failed attempt. Please use a different email or delete the 'Ghost' account from Firebase Auth Console.";
      }
      showNotification(`Failed: ${message}`);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      showNotification('User removed successfully.');
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
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-slate-500 mt-1">Manage hospital staff accounts and access permissions.</p>
          </div>
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add New User
          </button>
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
                <option value="superadmin">Superadmin</option>
                <option value="clinic_owner">Clinic Owner</option>
                <option value="doctor">Doctor</option>
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
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider px-4">User</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider px-4">Role</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider px-4">Status</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider px-4">Last Login</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider px-4 text-right">Actions</th>
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
                          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold border border-primary-100/50">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none">{user.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize
                          ${user.role === 'superadmin' ? 'bg-purple-50 text-purple-600' : 
                            user.role === 'clinic_owner' ? 'bg-blue-50 text-blue-600' : 
                            'bg-green-50 text-green-600'}
                        `}>
                          <Shield className="h-3 w-3" />
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize
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
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <h3 className="text-lg font-bold text-slate-900">No users found</h3>
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
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm min-w-[300px]"
          >
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
