import firestoreService from './firestoreService';
import auditService from './auditService';
import { where, orderBy } from 'firebase/firestore';

const medicalRecordService = {
  collection: firestoreService.collections.medical_records || 'medical_records',

  async getAllRecords() {
    const q = [orderBy('createdAt', 'desc')];
    return firestoreService.getAll(this.collection, q);
  },

  async getRecordsByPatient(patientId) {
    const q = [where('patientId', '==', patientId), orderBy('createdAt', 'desc')];
    return firestoreService.getAll(this.collection, q);
  },

  async createRecord(recordData, userContext = { id: 'sys', name: 'System' }) {
    const record = await firestoreService.create(this.collection, recordData);
    await auditService.logActivity({
      userId: userContext.id,
      userName: userContext.name,
      action: 'CREATE_NOTE',
      module: 'CLINICAL',
      description: `Created clinical note for patient ${recordData.patientId}`,
      metadata: { patientId: recordData.patientId, recordId: record.id }
    });
    return record;
  },

  async updateRecord(id, recordData, userContext = { id: 'sys', name: 'System' }) {
    const result = await firestoreService.update(this.collection, id, recordData);
    await auditService.logActivity({
      userId: userContext.id,
      userName: userContext.name,
      action: 'UPDATE_NOTE',
      module: 'CLINICAL',
      description: `Updated clinical note ${id}`,
      metadata: { recordId: id }
    });
    return result;
  },

  async getRecordById(id) {
    return firestoreService.getById(this.collection, id);
  }
};

export default medicalRecordService;
