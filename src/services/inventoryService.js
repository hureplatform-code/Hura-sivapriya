import firestoreService from './firestoreService';

const inventoryService = {
  collection: firestoreService.collections.inventory,

  async getInventory() {
    return firestoreService.getAll(this.collection);
  },

  async addStock(itemData) {
    return firestoreService.create(this.collection, itemData);
  },

  async updateStock(id, itemData) {
    return firestoreService.update(this.collection, id, itemData);
  },

  async getLowStockItems(threshold = 20) {
    const q = [where('stock', '<=', threshold)];
    return firestoreService.getAll(this.collection, q);
  }
};

export default inventoryService;
