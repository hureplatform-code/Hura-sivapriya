import firestoreService from './firestoreService';
import { serverTimestamp } from 'firebase/firestore';

const auditService = {
  collection: firestoreService.collections.audit_logs || 'audit_logs',

  /**
   * Logs an activity to the audit trail
   * @param {Object} logData 
   * @param {string} logData.userId - ID of the user performing the action
   * @param {string} logData.userName - Name of the user
   * @param {string} logData.action - Action performed (e.g., 'CREATE_NOTE', 'UPDATE_RESULT')
   * @param {string} logData.module - System module (e.g., 'CLINICAL', 'FINANCIAL')
   * @param {string} logData.description - Human readable description
   * @param {Object} logData.metadata - Any additional context (patientId, recordId, etc.)
   */
  async logActivity(logData) {
    try {
      const data = {
        ...logData,
        timestamp: serverTimestamp(),
      };
      return await firestoreService.create(this.collection, data);
    } catch (error) {
      console.error('Audit Log Error:', error);
    }
  },

  /**
   * Fetches recent audit logs for the dashboard feed
   * @param {number} limitNum 
   */
  async getRecentLogs(limitNum = 10) {
    try {
      // In a real Firestore setup, we'd use orderBy('timestamp', 'desc').limit(limitNum)
      // For now, using the standard getAll helper
      return await firestoreService.getAll(this.collection);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }
};

export default auditService;
