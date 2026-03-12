import firestoreService from './firestoreService';

// Stores Twilio credentials in Firestore at: settings/sms_config
// Credentials are scoped per facility (facilityId)

const SMS_CONFIG_DOC = 'sms_config';
const SETTINGS_COLLECTION = 'settings';

const smsSettingsService = {

  /**
   * Get SMS config for a facility
   */
  async getConfig(facilityId) {
    try {
      const docId = facilityId ? `sms_${facilityId}` : SMS_CONFIG_DOC;
      return await firestoreService.getById(SETTINGS_COLLECTION, docId);
    } catch (error) {
      console.error('Error fetching SMS config:', error);
      return null;
    }
  },

  /**
   * Save / update SMS config for a facility
   */
  async saveConfig(facilityId, config) {
    try {
      const docId = facilityId ? `sms_${facilityId}` : SMS_CONFIG_DOC;
      await firestoreService.set(SETTINGS_COLLECTION, docId, {
        ...config,
        facilityId: facilityId || null,
      });
      return true;
    } catch (error) {
      console.error('Error saving SMS config:', error);
      throw error;
    }
  },

  /**
   * Delete SMS config (wipe credentials)
   */
  async deleteConfig(facilityId) {
    try {
      const docId = facilityId ? `sms_${facilityId}` : SMS_CONFIG_DOC;
      await firestoreService.delete(SETTINGS_COLLECTION, docId);
      return true;
    } catch (error) {
      console.error('Error deleting SMS config:', error);
      throw error;
    }
  },

  /**
   * Send a test SMS via the Cloud Function endpoint
   * Called from Settings page to validate credentials
   */
  async sendTestSms(facilityId, toPhone) {
    try {
      // The Cloud Function HTTP endpoint to trigger test
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
      const region = 'us-central1';
      const url = `https://${region}-${projectId}.cloudfunctions.net/sendAppointmentSms`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: true,
          facilityId,
          to: toPhone,
          body: 'Test message from HURA platform. Your Twilio SMS integration is working correctly!'
        })
      });
      return res.ok;
    } catch (error) {
      console.error('Test SMS failed:', error);
      return false;
    }
  }
};

export default smsSettingsService;
