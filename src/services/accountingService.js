import firestoreService from './firestoreService';

const accountingService = {
  collection: firestoreService.collections.ledgers,

  async getAllEntries() {
    return firestoreService.getAll(this.collection);
  },

  async createEntry(entryData) {
    return firestoreService.create(this.collection, entryData);
  },

  async getAccountingStats(revenue) {
    const entries = await this.getAllEntries();
    
    const totalExpenses = entries
      .filter(e => e.status === 'Paid')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const vendorBalance = entries
      .filter(e => e.status !== 'Paid')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
    const netProfit = revenue - totalExpenses;
    
    return {
      expenses: totalExpenses,
      vendorBalance: vendorBalance,
      netProfit: netProfit,
      entriesCount: entries.length
    };
  }
};

export default accountingService;

