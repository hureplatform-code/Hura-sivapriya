import firestoreService from './firestoreService';
import { where, query, collection, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';

const inventoryService = {
  collection: firestoreService.collections.inventory,

  async getInventory(facilityId, limitNum = 20, lastDoc = null) {
    try {
      const constraints = [
        orderBy('updatedAt', 'desc'),
        limit(limitNum)
      ];

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      if (facilityId) {
        constraints.unshift(where('facilityId', '==', facilityId));
      }

      const q = query(collection(db, this.collection), ...constraints);
      const snap = await getDocs(q);
      const lastVisible = snap.docs[snap.docs.length - 1];
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return { items, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return { items: [], lastDoc: null };
    }
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
