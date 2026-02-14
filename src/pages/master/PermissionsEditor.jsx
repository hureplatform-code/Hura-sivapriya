import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  ShieldCheck, 
  Save, 
  Lock, 
  ChevronRight, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import roleService from '../../services/roleService';
import { PERMISSION_MODULES } from '../../constants/permissions';

const permissionModules = [
  { 
    id: 'clinical', 
    label: 'Clinical Operations', 
    rights: ['view_patients', 'add_notes', 'delete_notes', 'view_investigations', 'add_investigations', 'process_results']
  },
  { 
    id: 'pharmacy', 
    label: 'Pharmacy & Inventory', 
    rights: ['dispense_drugs', 'manage_stock', 'add_inventory', 'delete_inventory', 'view_expired']
  },
  { 
    id: 'billing', 
    label: 'Finance & Billing', 
    rights: ['create_invoice', 'void_invoice', 'process_payment', 'view_revenue', 'accounting_access']
  },
  { 
    id: 'admin', 
    label: 'System Admin', 
    rights: ['manage_users', 'edit_roles', 'facility_config', 'view_audit_logs', 'system_settings']
  }
];

const roles = APP_CONFIG.ROLES;

export default function PermissionsEditor() {
  const [selectedRole, setSelectedRole] = useState('doctor');
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  React.useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const data = await roleService.getAllRolePermissions();
      setPermissions(data || {});
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const togglePermission = (right) => {
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole] || {},
        [right]: !prev[selectedRole]?.[right]
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await roleService.saveRolePermissions(selectedRole, permissions[selectedRole] || {});
      setSaveStatus('Permissions saved successfully!');
    } catch (error) {
      console.error("Error saving permissions:", error);
      setSaveStatus('Error saving permissions.');
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security Matrix</h1>
            <p className="text-slate-500 mt-1">Configure granular access rights for each staff role.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95 disabled:opacity-70"
          >
            {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-5 w-5" />}
            Persist Rights
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Roles Selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Roles</span>
                 <Lock className="h-3 w-3 text-slate-300" />
              </div>
              <div className="p-2 space-y-1">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-bold text-sm
                      ${selectedRole === role.id 
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                  >
                    {role.name}
                    {selectedRole === role.id && <ChevronRight className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="lg:col-span-3 space-y-8">
              {PERMISSION_MODULES.map((module, idx) => (
                <motion.div 
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary-600">
                          <ShieldCheck className="h-5 w-5" />
                       </div>
                       <h3 className="font-black text-slate-900 text-lg">{module.name}</h3>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Module Access</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-slate-50">
                     {module.rights?.map((right) => (
                       <div 
                         key={right.key} 
                         onClick={() => togglePermission(right.key)}
                         className="group p-6 border-r border-b border-slate-50 hover:bg-primary-50/30 transition-all cursor-pointer flex items-center justify-between"
                       >
                         <div className="space-y-1">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{right.label}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Standard Role Default</p>
                         </div>
                         <div className={`h-6 w-11 rounded-full transition-all flex items-center px-1 ${permissions[selectedRole]?.[right.key] ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                            <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-all transform ${permissions[selectedRole]?.[right.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                         </div>
                       </div>
                     ))}
                     {module.children?.map((child) => (
                        <div 
                          key={child.key} 
                          onClick={() => togglePermission(child.key)}
                          className="group p-6 border-r border-b border-slate-50 hover:bg-primary-50/30 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="space-y-1">
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{child.label}</p>
                             <p className="text-[10px] text-slate-400 font-bold">Standard Role Default</p>
                          </div>
                          <div className={`h-6 w-11 rounded-full transition-all flex items-center px-1 ${permissions[selectedRole]?.[child.key] ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                             <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-all transform ${permissions[selectedRole]?.[child.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                        </div>
                     ))}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm">
           <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
           </div>
           {saveStatus}
        </div>
      )}
    </DashboardLayout>
  );
}
