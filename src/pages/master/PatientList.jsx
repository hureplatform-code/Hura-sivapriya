import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  UserPlus,
  ArrowUpRight,
  History,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  CheckCircle2,
  ExternalLink,
  User,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import patientService from '../../services/patientService';
import QuickPatientModal from '../../components/modals/QuickPatientModal';

export default function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [genderFilter, setGenderFilter] = useState('All');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientService.getAllPatients();
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this patient record?')) {
      try {
        await patientService.deletePatient(id);
        fetchPatients();
        alert('Patient deleted successfully.');
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const handlePatientRegistered = (newPatient) => {
    setPatients(prev => [newPatient, ...prev]);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.mobile?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Registry</h1>
            <p className="text-slate-500 mt-1">Centralized database for all registered patients and clinical histories.</p>
          </div>
          <button 
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
          >
            <UserPlus className="h-5 w-5" />
            Register New Patient
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Registered', value: patients.length.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Recently Active', value: '42', icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Returning Patients', value: '85%', icon: History, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by Patient Name, ID, or Contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm font-bold transition-all outline-none appearance-none min-w-[120px]"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
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
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Patient Info</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Contact</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Payment</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   <tr>
                     <td colSpan="5" className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading patient registry...</td>
                   </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">No patients matching your search.</td>
                  </tr>
                ) : (
                  filteredPatients.map((pat, i) => (
                    <motion.tr 
                      key={pat.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/master/patients/${pat.id}`)}
                    >
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                            {pat.name?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{pat.name}</p>
                            <p className="text-xs text-slate-400 font-medium tracking-tight">ID: {pat.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-bold text-slate-900">{pat.contact || pat.mobile}</p>
                        <p className="text-xs text-slate-400 font-medium">{pat.email || 'No email'}</p>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-bold text-slate-900 capitalize">{pat.paymentMode || 'Cash'}</p>
                      </td>
                      <td className="py-5 px-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                          ${pat.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}
                        `}>
                          {pat.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/master/patients/${pat.id}`); }}
                            className="p-2.5 text-slate-400 hover:text-primary-600 bg-white rounded-xl shadow-sm border border-slate-100"
                          >
                            <ExternalLink className="h-4.5 w-4.5" />
                          </button>
                          <div className="relative">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === pat.id ? null : pat.id); }}
                              className="p-2.5 text-slate-400 hover:text-slate-900 bg-white rounded-xl shadow-sm border border-slate-100"
                            >
                              <MoreVertical className="h-4.5 w-4.5" />
                            </button>

                            {activeMenu === pat.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/master/patients/${pat.id}`); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 font-bold flex items-center gap-2"
                                >
                                  <ExternalLink className="h-4 w-4" /> View Details
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/master/patients/${pat.id}`); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-slate-50 font-bold flex items-center gap-2"
                                >
                                  <User className="h-4 w-4" /> Edit Profile
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeletePatient(pat.id); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 font-bold flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete Patient
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <QuickPatientModal 
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSave={handlePatientRegistered}
      />
    </DashboardLayout>
  );
}
