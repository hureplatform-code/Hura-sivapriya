import firestoreService from './firestoreService';
import { where, query, collection, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';

const inventoryService = {
  collection: firestoreService.collections.inventory,

  async getInventory(facilityId, limitNum = null, lastDoc = null) {
    try {
      const constraints = [
        orderBy('name', 'asc')
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
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (limitNum === null) return items;
      return { items, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return limitNum === null ? [] : { items: [], lastDoc: null };
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
  },

  async search(term, facilityId = null) {
    try {
      // Normalize terms for case-insensitive simulation
      const searchTerms = [term];
      const capitalized = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
      if (!searchTerms.includes(capitalized)) searchTerms.push(capitalized);
      const allUpper = term.toUpperCase();
      if (!searchTerms.includes(allUpper)) searchTerms.push(allUpper);
      const allLower = term.toLowerCase();
      if (!searchTerms.includes(allLower)) searchTerms.push(allLower);

      const distinctTerms = [...new Set(searchTerms)];
      const queryPromises = distinctTerms.map(t => {
        const q = query(
          collection(db, this.collection),
          where('name', '>=', t),
          where('name', '<=', t + '\uf8ff'),
          limit(100)
        );
        return getDocs(q).catch(() => ({ docs: [] }));
      });

      const snapshots = await Promise.all(queryPromises);
      const resultsMap = new Map();

      snapshots.forEach(snap => {
        snap.docs.forEach(doc => {
          const data = doc.data();
          if (!facilityId || data.facilityId === facilityId) {
            resultsMap.set(doc.id, { id: doc.id, ...data });
          }
        });
      });

      return Array.from(resultsMap.values());
    } catch (error) {
      console.error('Error searching inventory:', error);
      return [];
    }
  }
};

export default inventoryService;
