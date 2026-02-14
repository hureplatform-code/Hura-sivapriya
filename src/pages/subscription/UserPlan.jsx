import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Users, MoreVertical, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import firestoreService from '../../services/firestoreService';

export default function UserPlan() {
  const [userPlans, setUserPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await firestoreService.getAll('users');
        setUserPlans(users.map(u => ({
          id: u.id,
          name: u.name || 'Unknown',
          role: u.role || 'Staff',
          plan: u.plan || 'Standard',
          status: u.status || 'active',
          renewal: u.renewalDate || 'N/A'
        })));
      } catch (e) {
        console.error("Fetch users error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Service Plans</h1>
          <p className="text-slate-500 mt-1">Manage individual service plans and access levels for clinical staff.</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4">Staff Member</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4">Service Plan</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4">Renewal Date</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {userPlans.map((up, i) => (
                  <motion.tr 
                    key={up.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold border border-slate-100">
                          {up.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none">{up.name}</p>
                          <p className="text-xs text-slate-500 mt-1 font-medium">{up.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${up.plan === 'Enterprise' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                        {up.plan} Plan
                      </span>
                    </td>
                    <td className="py-6 px-4 text-sm font-bold text-slate-900">{up.renewal}</td>
                    <td className="py-6 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${up.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
                      `}>
                        {up.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {up.status}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-right">
                      <button className="p-2.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-100">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
