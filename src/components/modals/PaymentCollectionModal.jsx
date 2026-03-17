import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  Search, 
  Plus, 
  Trash2, 
  Receipt, 
  CheckCircle2, 
  Activity, 
  DollarSign,
  ChevronDown,
  User,
  FlaskConical,
  Activity as ProcedureIcon,
  MessageSquare
} from 'lucide-react';
import medicalMasterService from '../../services/medicalMasterService';
import billingService from '../../services/billingService';
import appointmentService from '../../services/appointmentService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { TEST_CATALOG } from '../../pages/operational/LabEntry';

const ITEM_TYPES = [
  { id: '1', name: 'Registration', icon: User, stage: 1 },
  { id: '2', name: 'Consultation', icon: Activity, stage: 2 },
  { id: '3', name: 'Investigation', icon: FlaskConical, stage: 3 },
  { id: '4', name: 'Procedure', icon: ProcedureIcon, stage: 4 },
];

export default function PaymentCollectionModal({ isOpen, onClose, appointment, onSuccess, type = 'consultation' }) {
  const { userData } = useAuth();
  const { success, error: toastError } = useToast();
  const { currency } = useCurrency();
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

  // Initialize items based on type
  useEffect(() => {
    const initItems = async () => {
      if (isOpen && appointment) {
        setIsFinished(false);
        setGeneratedInvoice(null);
        setAmountPaid('');
        
        if (type === 'consultation') {
          const docFee = appointment.consultationFee || 1000;
          setItems([{
            id: 'temp-reg',
            name: 'Consultation Fee',
            price: docFee,
            quantity: 1,
            stage: 2,
            category: 'Consultation'
          }]);
          setAmountPaid(docFee.toString());
        } else if (type === 'investigation') {
          let source = appointment.investigations || appointment.structuredResults || [];
          if (!Array.isArray(source)) source = [];

          // Try to fetch real prices from master catalog for each item
          const autoItems = await Promise.all(source.map(async (inv) => {
             const name = inv.name || inv.testName || inv.testId;
             let price = inv.price || 0;

             // Price lookup if 0
             if (price === 0) {
                // Try targeted master search
                try {
                  const masterResults = await medicalMasterService.search('labs', name, userData?.facilityId);
                  const exactMatch = masterResults.find(m => m.name?.toLowerCase() === name.toLowerCase());
                  if (exactMatch) price = exactMatch.price || 0;
                } catch (e) { console.error("Price lookup failed", e); }
                
                // Fallback to internal catalog defaults if still 0
                if (price === 0 && TEST_CATALOG) {
                   const catalogMatch = Object.values(TEST_CATALOG).find(t => t.name?.toLowerCase() === name.toLowerCase());
                   if (catalogMatch) price = catalogMatch.price || 0;
                }
             }

             return {
                id: inv.id || inv.testId || `temp-${name}`,
                name: name,
                price: price,
                quantity: 1,
                stage: 3,
                category: 'Investigation'
             };
          }));
          setItems(autoItems);
        }
      }
    };
    initItems();
  }, [isOpen, appointment, type, userData]);

  const handleSearch = async (term) => {
    setSearchQuery(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // Determine what to search based on tab or just search labs for now
      const labs = await medicalMasterService.search('labs', term, userData?.facilityId);
      setSearchResults(labs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addItem = (item) => {
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      setItems(items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { ...item, quantity: 1, stage: 3 }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;

    if (items.length === 0) {
      toastError("Please add at least one item.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create Invoice
      const invoiceData = {
        facilityId: userData?.facilityId,
        patientId: appointment.patientId,
        patientName: appointment.patient,
        patientPhone: appointment.patientPhone || appointment.phoneNumber,
        items: items.map(i => ({
          name: i.name,
          price: parseFloat(i.price),
          quantity: i.quantity,
          amount: parseFloat(i.price) * i.quantity
        })),
        totalAmount: total,
        paidAmount: paid,
        balance: total - paid,
        paymentStatus: paid >= total ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
        paymentMethod,
        invAppId: appointment.id,
        status: paid >= total ? 'paid' : 'billed',
        createdAt: new Date().toISOString(),
        invoiceNo: `INV-${Date.now().toString().slice(-6)}`
      };

      const invoice = await billingService.createInvoice(invoiceData);
      setGeneratedInvoice(invoice);
      
      // 2. Trigger SMS Notification
      if (invoiceData.patientPhone) {
        await notificationService.sendSMS(
           invoiceData.patientPhone,
           `Hello ${invoiceData.patientName}, payment of ${currency} ${paid} for ${invoiceData.items[0]?.name}${invoiceData.items.length > 1 ? ' and others' : ''} has been received. Invoice #${invoiceData.invoiceNo}. Thank you for choosing ${userData?.facilityName || 'our clinic'}.`,
           userData?.facilityId
        );
      }

      // 3. Update Appointment Status if needed
      // If consultation paid, we already check in in the background or here
      // If it's lab start, we move to 'in-session' in lab sense? 
      // User says: "once paid it needs to generate invoice and message needs to send to the phone number..then we can add up the details"
      
      if (type === 'investigation') {
        await appointmentService.updateAppointmentStatus(appointment.id, 'paid');
      }

      success("Payment recorded and invoice generated!");
      setIsFinished(true);
      if (onSuccess) onSuccess(invoice);
    } catch (err) {
      console.error(err);
      toastError("Failed to process payment.");
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {isFinished ? (
              <div className="p-16 text-center flex flex-col items-center justify-center space-y-8">
                 <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="h-12 w-12" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Payment Collected!</h2>
                    <p className="text-slate-500 font-medium mt-2">Invoice #{generatedInvoice?.invoiceNo} has been generated successfully.</p>
                 </div>
                 
                 <div className="w-full max-w-md bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                       <span className="text-slate-400">Total Amount</span>
                       <span className="text-slate-900 font-bold">{currency} {total}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                       <span className="text-slate-400">Amount Paid</span>
                       <span className="text-emerald-600 font-bold">{currency} {amountPaid}</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex justify-between items-center text-sm font-medium">
                       <span className="text-slate-400">Balance</span>
                       <span className="text-red-500 font-bold">{currency} {total - (parseFloat(amountPaid) || 0)}</span>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={onClose}
                      className="px-10 py-5 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                       Done & Continue
                    </button>
                    <button 
                      className="px-10 py-5 bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                      onClick={() => window.print()}
                    >
                       <Receipt className="h-4 w-4" /> Print Receipt
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    <MessageSquare className="h-4 w-4" /> SMS Confirmation Sent to {appointment?.patientPhone || appointment?.phoneNumber}
                 </div>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-xl">
                        <DollarSign className="h-7 w-7" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">Collect Payment</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Financial Hub • {appointment?.patient}</p>
                     </div>
                  </div>
                  <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                   {/* Left Panel: Items Selection */}
                   <div className="flex-1 p-10 space-y-8 overflow-y-auto border-r border-slate-50">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Add Items to Cart</label>
                        <div className="relative group">
                           <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                           <input 
                             type="text"
                             value={searchQuery}
                             onChange={(e) => handleSearch(e.target.value)}
                             placeholder="Search Tests, Consultation, or Procedures..."
                             className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-100 rounded-2xl text-sm font-medium transition-all outline-none shadow-inner"
                           />
                           
                           <AnimatePresence>
                             {searchResults.length > 0 && (
                               <motion.div 
                                 initial={{ opacity: 0, y: 5 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden py-2"
                               >
                                  {searchResults.map(item => (
                                    <button 
                                      key={item.id}
                                      onClick={() => addItem(item)}
                                      className="w-full px-6 py-4 hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                                    >
                                       <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                             <FlaskConical className="h-5 w-5" />
                                          </div>
                                          <div className="text-left">
                                             <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.category || item.code}</p>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-sm font-bold text-emerald-600">{currency} {item.price}</p>
                                          <div className="p-1 bg-emerald-50 text-emerald-500 rounded-lg inline-flex mt-1">
                                             <Plus className="h-3 w-3" />
                                          </div>
                                       </div>
                                    </button>
                                  ))}
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Selected Items</label>
                        {items.length === 0 ? (
                          <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                             <Receipt className="h-10 w-10 text-slate-300" />
                             <p className="text-sm font-medium text-slate-400">Your cart is empty. Add items to proceed.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {items.map(item => (
                              <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group">
                                 <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                       {item.stage === 2 ? <Activity className="h-5 w-5 text-indigo-500" /> : <FlaskConical className="h-5 w-5 text-emerald-500" />}
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-8">
                                    <div className="text-right">
                                       <p className="text-sm font-bold text-slate-900">{currency} {item.price}</p>
                                       <p className="text-[10px] text-slate-400 font-medium">Qty: {item.quantity}</p>
                                    </div>
                                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                       <Trash2 className="h-4 w-4" />
                                    </button>
                                 </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                   </div>

                   {/* Right Panel: Summary & Pay */}
                   <div className="w-80 bg-slate-50/80 p-10 flex flex-col">
                      <div className="flex-1 space-y-8">
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                               {['Cash', 'Card', 'M-Pesa', 'Credit'].map(method => (
                                 <button 
                                   key={method}
                                   onClick={() => setPaymentMethod(method)}
                                   className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border
                                     ${paymentMethod === method ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}
                                   `}
                                 >
                                    {method}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Summary</label>
                            <div className="space-y-2">
                               <div className="flex justify-between text-sm font-medium">
                                  <span className="text-slate-400">Total Due</span>
                                  <span className="text-slate-900 font-bold">{currency} {total}</span>
                               </div>
                               <div className="flex justify-between text-sm font-medium">
                                  <span className="text-slate-400">Taxes</span>
                                  <span className="text-slate-900 font-bold">---</span>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Collection</label>
                            <div className="relative">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{currency}</div>
                               <input 
                                 type="number"
                                 value={amountPaid}
                                 onChange={(e) => setAmountPaid(e.target.value)}
                                 placeholder="Enter amount paid..."
                                 className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 focus:border-emerald-500 rounded-2xl text-lg font-bold text-slate-900 outline-none transition-all shadow-sm"
                               />
                            </div>
                            <button 
                              onClick={() => setAmountPaid(total.toString())}
                              className="w-full py-2 bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-emerald-100 transition-all"
                            >
                               Full Settlement
                            </button>
                         </div>
                      </div>

                      <div className="mt-8 space-y-4">
                         <div className={`p-4 rounded-2xl flex items-center justify-between overflow-hidden relative ${total - (parseFloat(amountPaid) || 0) > 0 ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            <div className="z-10">
                               <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Balance Remaining</p>
                               <p className="text-lg font-bold tabular-nums">{currency} {Math.max(0, total - (parseFloat(amountPaid) || 0))}</p>
                            </div>
                            <DollarSign className="absolute -right-2 -bottom-2 h-16 w-16 opacity-5" />
                         </div>
                         
                         <button 
                           onClick={handleSubmit}
                           disabled={loading || items.length === 0}
                           className="w-full h-16 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-3"
                         >
                            {loading ? <Activity className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Process & Invoice</>}
                         </button>
                      </div>
                   </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
