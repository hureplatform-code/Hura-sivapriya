import firestoreService from './firestoreService';
import accountingService from './accountingService';
import { where, query, collection, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';

const billingService = {
  collection: firestoreService.collections.billing,

  async getAllInvoices(facilityId, limitNum = null, lastDoc = null) {
    try {
      const constraints = [
        orderBy('createdAt', 'desc')
      ];

      if (limitNum !== null) {
        constraints.push(limit(limitNum));
      }

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      if (facilityId) {
        constraints.unshift(where('facilityId', '==', facilityId));
      }

      const q = query(collection(db, this.collection), ...constraints);
      const snap = await getDocs(q);
      const lastVisible = snap.docs[snap.docs.length - 1];
      const invoices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (limitNum === null) return invoices;
      return { invoices, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return limitNum === null ? [] : { invoices: [], lastDoc: null };
    }
  },

  async createInvoice(invoiceData) {
    const invoice = await firestoreService.create(this.collection, invoiceData);
    
    // Legacy Parity: If this bill is linked to an appointment, update the appointment's bill status
    if (invoiceData.invAppId) {
      const updateData = {
        billStatus: 'billed',
        stage: invoiceData.stage || 1
      };
      
      // If Stage 2 (Consultation) invoice is created, mark appointment as completed
      if (invoiceData.stage === 2) {
        updateData.status = 'completed';
      }
      
      await firestoreService.update('appointments', invoiceData.invAppId, updateData);
    }
    
    return invoice;
  },

  async updatePaymentStatus(id, status, invoiceData = null) {
     const result = await firestoreService.update(this.collection, id, { paymentStatus: status });
     
     // AUTOMATIC LEDGER POSTING
     if (status === 'paid' && invoiceData) {
        await accountingService.createEntry({
           name: `Payment for Invoice #${invoiceData.invoiceNo || id}`,
           vendor: invoiceData.patientName || 'Patient',
           category: 'Patient Payment',
           amount: invoiceData.totalAmount || 0,
           status: 'Paid',
           type: 'Income',
           date: new Date().toISOString(),
           facilityId: invoiceData.facilityId
        });
     }
     
     return result;
  },

  async getFinancialStats(facilityId) {
    const { invoices } = await this.getAllInvoices(facilityId, 500);
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (parseFloat(inv.totalAmount || inv.payAmount || 0)), 0);
    
    const outstanding = invoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (parseFloat(inv.totalAmount || inv.payAmount || 0)), 0);
    
    // Calculate today's payments
    const today = new Date().toLocaleDateString();
    const todayPaymentsFiltered = invoices
      .filter(inv => {
        const invDate = inv.createdAt?.seconds ? new Date(inv.createdAt.seconds * 1000) : new Date(inv.createdAt);
        return inv.status === 'paid' && invDate.toLocaleDateString() === today;
      });
      
    const todayPayments = todayPaymentsFiltered.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount || inv.payAmount || 0)), 0);
    
    return {
      revenue: totalRevenue,
      outstanding: outstanding,
      invoicesCount: invoices.length,
      todayPayments: todayPayments
    };
  }
};

export default billingService;

