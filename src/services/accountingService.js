import firestoreService from './firestoreService';
import { where, orderBy } from 'firebase/firestore';

const accountingService = {
  collection: firestoreService.collections.ledgers,

  async getAllEntries(facilityId) {
    const q = [orderBy('createdAt', 'desc')];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    return firestoreService.getAll(this.collection, q);
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

