import firestoreService from './firestoreService';
import { where, orderBy, limit } from 'firebase/firestore';

const inventoryService = {
  collection: firestoreService.collections.inventory,

  async getInventory(facilityId) {
    const q = [orderBy('updatedAt', 'desc')];
    if (facilityId) q.push(where('facilityId', '==', facilityId));
    return firestoreService.getAll(this.collection, q);
  },

  async addStock(itemData) {
    return firestoreService.create(this.collection, {
      ...itemData,
      status: parseInt(itemData.stock) > 20 ? 'In Stock' : parseInt(itemData.stock) > 0 ? 'Low Stock' : 'Out of Stock'
    });
  },

  async updateStock(id, itemData) {
    return firestoreService.update(this.collection, id, {
      ...itemData,
      status: parseInt(itemData.stock) > 20 ? 'In Stock' : parseInt(itemData.stock) > 0 ? 'Low Stock' : 'Out of Stock'
    });
  },

  async getLowStockItems(threshold = 20) {
    const q = [
      where('stock', '<=', threshold),
      orderBy('stock', 'asc'),
      limit(10)
    ];
    return firestoreService.getAll(this.collection, q);
  }
};

export default inventoryService;
