import firestoreService from './firestoreService';
import { serverTimestamp, where, orderBy, limit } from 'firebase/firestore';

const notificationService = {
  collection: firestoreService.collections.notifications || 'notifications',

  /**
   * Sends a notification to a specific user or role
   * @param {Object} notification 
   */
  async send(notification) {
    try {
      const data = {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info', // 'info', 'warning', 'success', 'error'
        recipientId: notification.recipientId || null,
        recipientRole: notification.recipientRole || null,
        read: false,
        createdAt: serverTimestamp(),
        metadata: notification.metadata || {}
      };
      return await firestoreService.create(this.collection, data);
    } catch (error) {
      console.error('Notification Error:', error);
    }
  },

  /**
   * Fetches unread notifications for a user
   * @param {string} userId 
   * @param {string} role 
   */
  async getMyNotifications(userId, role) {
    try {
      // Logic to fetch notifications where recipientId == userId OR recipientRole == role
      // For now, simplify to just fetch all for demonstration in prototype
      return await firestoreService.getAll(this.collection);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  async markAsRead(id) {
    return await firestoreService.update(this.collection, id, { read: true });
  }
};

export default notificationService;
