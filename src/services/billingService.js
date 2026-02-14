import firestoreService from './firestoreService';

const billingService = {
  collection: firestoreService.collections.billing,

  async getAllInvoices() {
    return firestoreService.getAll(this.collection);
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

  async updatePaymentStatus(id, status) {
    return firestoreService.update(this.collection, id, { paymentStatus: status });
  },

  async getFinancialStats() {
    const invoices = await this.getAllInvoices();
    
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

