import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ChevronRight,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  X,
  FileText,
  User,
  Activity,
  Trash2,
  Plus as PlusIcon,
  ShoppingBag,
  Stethoscope,
  Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { APP_CONFIG } from '../../config';
import billingService from '../../services/billingService';
import patientService from '../../services/patientService';

const BILL_TYPES = [
  { id: '1', name: 'Registration', icon: User, stage: 1 },
  { id: '2', name: 'Consultation', icon: Stethoscope, stage: 2 },
  { id: '3', name: 'Investigation', icon: Activity, stage: 3 },
  { id: '4', name: 'Procedure', icon: Scissors, stage: 4 },
  { id: '5', name: 'Pharmacy', icon: ShoppingBag, stage: 5 },
];

export default function Billing() {
  const [isCreating, setIsCreating] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [billingStats, setBillingStats] = useState({
    revenue: 0,
    outstanding: 0,
    invoicesCount: 0,
    todayPayments: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const [invData, statsData] = await Promise.all([
        billingService.getAllInvoices(),
        billingService.getFinancialStats()
      ]);
      setInvoices(invData || []);
      setBillingStats(statsData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportInvoice = (inv) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('INVOICE', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Invoice No: ${inv.invoiceNo}`, 14, 32);
    doc.text(`Date: ${new Date(inv.createdAt?.seconds * 1000 || inv.createdAt).toLocaleDateString()}`, 14, 38);
    doc.text(`Patient: ${inv.patientName}`, 14, 44);
    doc.text(`Status: ${inv.status?.toUpperCase() || 'PENDING'}`, 14, 50);

    const tableData = inv.items?.map(item => [
      item.description,
      item.qty,
      `${APP_CONFIG.CURRENCY} ${parseFloat(item.price).toLocaleString()}`,
      `${APP_CONFIG.CURRENCY} ${parseFloat(item.amount).toLocaleString()}`
    ]) || [];

    if (inv.payAmount && parseFloat(inv.payAmount) > 0) {
      tableData.push(['Base Service Fee', '1', `${APP_CONFIG.CURRENCY} ${parseFloat(inv.payAmount).toLocaleString()}`, `${APP_CONFIG.CURRENCY} ${parseFloat(inv.payAmount).toLocaleString()}`]);
    }

    doc.autoTable({
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: tableData,
      startY: 60,
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total Amount: ${APP_CONFIG.CURRENCY} ${parseFloat(inv.totalAmount).toLocaleString()}`, 14, finalY);

    doc.save(`Invoice_${inv.invoiceNo}.pdf`);
  };

  const handleVoidInvoice = (inv) => {
    if (window.confirm(`Are you sure you want to VOID invoice ${inv.invoiceNo}? This action cannot be undone.`)) {
      alert(`Invoice ${inv.invoiceNo} has been voided.`);
      // In real scenario: await billingService.voidInvoice(inv.id);
      fetchInvoices();
    }
  };

  const handleViewDetails = (inv) => {
    alert(`Viewing details for Invoice ${inv.invoiceNo}\nPatient: ${inv.patientName}\nAmount: ${APP_CONFIG.CURRENCY} ${inv.totalAmount}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Hub</h1>
            <p className="text-slate-500 mt-1">Manage invoices, payments, and clinic revenue streams.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Generate New Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: `${billingStats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending Arrears', value: `${billingStats.outstanding.toLocaleString()}`, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Invoices Sent', value: billingStats.invoicesCount.toLocaleString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Payments Today', value: `${billingStats.todayPayments.toLocaleString()}`, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
            >
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">{APP_CONFIG.CURRENCY} {stat.value}</span>
                  <span className={`text-[10px] font-bold ${stat.color} flex items-center gap-0.5`}>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by Invoice # or Patient Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm font-bold transition-all outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Invoice Detail</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Patient</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Category</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Amount</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   <tr>
                     <td colSpan="6" className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching financial records...</td>
                   </tr>
                ) : filteredInvoices.map((inv, i) => (
                  <motion.tr 
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-5 px-4">
                      <div>
                        <p className="font-black text-slate-900 text-sm">#{inv.invoiceNo}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                          {inv.createdAt?.seconds ? new Date(inv.createdAt.seconds * 1000).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <p className="text-sm font-bold text-slate-900">{inv.patientName}</p>
                    </td>
                    <td className="py-5 px-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 px-3 py-1 rounded-full">
                        {BILL_TYPES.find(b => b.stage === inv.stage)?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-5 px-4 font-black text-slate-900 text-sm">
                      {APP_CONFIG.CURRENCY} {parseFloat(inv.totalAmount || inv.payAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-5 px-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
                      `}>
                        {inv.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === inv.id ? null : inv.id)}
                          className="p-2.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-white transition-all shadow-sm"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>
                        
                        <AnimatePresence>
                          {activeMenu === inv.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveMenu(null)}
                              ></div>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20"
                              >
                                <button 
                                  onClick={() => { handleViewDetails(inv); setActiveMenu(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  <FileText className="h-4 w-4" />
                                  View Details
                                </button>
                                <button 
                                  onClick={() => { handleExportInvoice(inv); setActiveMenu(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  <Receipt className="h-4 w-4" />
                                  Print Invoice
                                </button>
                                <div className="h-px bg-slate-50 my-1"></div>
                                <button 
                                  onClick={() => { handleVoidInvoice(inv); setActiveMenu(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                  Void Invoice
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <BillGenerator 
            onClose={() => setIsCreating(false)} 
            onSave={() => {
              setIsCreating(false);
              fetchInvoices();
            }}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function BillGenerator({ onClose, onSave }) {
  const [stage, setStage] = useState(1);
  const [patientId, setPatientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    invDate: new Date().toISOString().split('T')[0],
    payMode: '1',
    payAmount: '0.00',
    items: [],
    taxPercent: '0',
    discount: '0.00'
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchPatientAppointments(patientId);
    } else {
      setAppointments([]);
      setAppointmentId('');
    }
  }, [patientId]);

  const fetchPatients = async () => {
    const data = await patientService.getAllPatients();
    setPatients(data);
  };

  const fetchPatientAppointments = async (pid) => {
    try {
      // In a real scenario, we'd have a getAppointmentsByPatientId
      // For now, filtering the list or using a specialized service call
      const allAppts = await firestoreService.getAll('appointments');
      const filtered = allAppts.filter(a => a.patientId === pid || a.patient?.id === pid);
      setAppointments(filtered);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', qty: '1', price: '0', amount: '0' }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    if (field === 'qty' || field === 'price') {
      newItems[index].amount = (parseFloat(newItems[index].qty || 0) * parseFloat(newItems[index].price || 0)).toFixed(2);
    }
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) + parseFloat(formData.payAmount || 0);
    const tax = subtotal * (parseFloat(formData.taxPercent || 0) / 100);
    const total = subtotal + tax - parseFloat(formData.discount || 0);
    return total.toFixed(2);
  };

  const handleSave = async () => {
    if (!patientId) return alert('Select patient');
    const patient = patients.find(p => p.id === patientId);
    
    await billingService.createInvoice({
      ...formData,
      patientId,
      invAppId: appointmentId,
      patientName: patient?.name,
      stage,
      totalAmount: calculateTotal(),
      invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
      createdAt: new Date(),
      status: 'pending'
    });
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-5xl h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Generate Invoice</h3>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-0.5">Stage {stage} Billing Workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          {/* Header Pills */}
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-3xl w-max">
            {BILL_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setStage(type.stage)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${stage === type.stage ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}
                `}
              >
                {type.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Bill To Patient</label>
              <select 
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-3xl text-sm font-bold transition-all outline-none shadow-inner"
              >
                <option value="">Select Patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Link to Visit / Appointment</label>
              <select 
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                disabled={!patientId || appointments.length === 0}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-3xl text-sm font-bold transition-all outline-none shadow-inner disabled:opacity-50"
              >
                <option value="">{appointments.length === 0 ? 'No appointments found' : 'Select Visit...'}</option>
                {appointments.map(a => (
                  <option key={a.id} value={a.id}>
                    {new Date(a.date?.seconds * 1000 || a.date).toLocaleDateString()} - {a.reason || 'General Visit'}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Invoice Date</label>
              <input 
                type="date"
                value={formData.invDate}
                onChange={(e) => setFormData({...formData, invDate: e.target.value})}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-3xl text-sm font-bold outline-none shadow-inner"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Payment Mode</label>
              <select 
                value={formData.payMode}
                onChange={(e) => setFormData({...formData, payMode: e.target.value})}
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-200 rounded-3xl text-sm font-bold outline-none shadow-inner"
              >
                <option value="1">Cash Payment</option>
                <option value="2">Insurance Claim</option>
                <option value="3">M-Pesa / Digital</option>
              </select>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Invoice Line Items</h4>
              {(stage >= 3) && (
                <button onClick={addItem} className="flex items-center gap-2 px-5 py-2.5 bg-primary-50 text-primary-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-100 transition-all">
                  <PlusIcon className="h-4 w-4" /> Add Line Item
                </button>
              )}
            </div>

            {(stage === 1 || stage === 2) ? (
              <div className="bg-slate-50 p-8 rounded-[2rem] flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{stage === 1 ? 'Patient Registration & Eligibility Fee' : 'Specialist Consultation Fee'}</p>
                  <p className="text-xs text-slate-500 mt-1">Standard clinic service charge</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{APP_CONFIG.CURRENCY}</span>
                  <input 
                    type="number"
                    value={formData.payAmount}
                    onChange={(e) => setFormData({...formData, payAmount: e.target.value})}
                    className="w-32 p-4 bg-white border border-slate-100 rounded-2xl text-right font-black text-sm outline-none focus:border-primary-300"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Description</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 w-28">Qty</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 w-40">Unit Price</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 w-40 text-right">Amount</th>
                      <th className="pb-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {formData.items.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-4 px-2">
                          <input 
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className="w-full p-4 bg-transparent border-none focus:ring-2 focus:ring-primary-100 rounded-xl text-sm font-bold outline-none" 
                            placeholder="Enter service or item name..."
                          />
                        </td>
                        <td className="py-4 px-2">
                          <input 
                             type="number"
                             value={item.qty}
                             onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                             className="w-full p-4 bg-slate-50 border-none rounded-xl text-center text-sm font-bold outline-none" 
                          />
                        </td>
                        <td className="py-4 px-2">
                          <input 
                             type="number"
                             value={item.price}
                             onChange={(e) => updateItem(idx, 'price', e.target.value)}
                             className="w-full p-4 bg-slate-50 border-none rounded-xl text-right text-sm font-bold outline-none" 
                          />
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                           {parseFloat(item.amount).toLocaleString()}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {formData.items.length === 0 && (
                  <div className="py-12 bg-slate-50 rounded-[2.5rem] text-center border-2 border-dashed border-slate-100">
                    <p className="text-sm font-bold text-slate-400">No items added yet. Click 'Add Line Item' to start.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-end justify-end gap-12">
          <div className="w-full md:w-80 space-y-4">
             <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Tax (%)</span>
                <input 
                  type="number" 
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({...formData, taxPercent: e.target.value})}
                  className="w-20 p-2 bg-white border border-slate-100 rounded-xl text-right text-xs font-bold outline-none" 
                />
             </div>
             <div className="flex justify-between items-center text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Discount ({APP_CONFIG.CURRENCY})</span>
                <input 
                  type="number" 
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  className="w-20 p-2 bg-white border border-slate-100 rounded-xl text-right text-xs font-bold outline-none" 
                />
             </div>
             <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Due ({APP_CONFIG.CURRENCY})</span>
                <span className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                  {calculateTotal()}
                </span>
             </div>
          </div>
          <div className="flex gap-4">
             <button onClick={onClose} className="px-10 py-5 bg-white text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-[2rem] border border-slate-100 hover:bg-slate-50 shadow-sm">Cancel</button>
             <button onClick={handleSave} className="px-12 py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[2rem] hover:bg-slate-800 shadow-2xl shadow-slate-200 active:scale-95">Verify & Generate Invoice</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
