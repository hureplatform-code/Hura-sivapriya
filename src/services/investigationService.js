import firestoreService from './firestoreService';
import auditService from './auditService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const investigationService = {
  collection: firestoreService.collections.investigations,

  async getAllInvestigations() {
    return firestoreService.getAll(this.collection);
  },

  async getInvestigationById(id) {
    return firestoreService.getById(this.collection, id);
  },

  async requestInvestigation(data, userContext = { id: 'sys', name: 'System' }) {
    const investigation = await firestoreService.create(this.collection, {
      ...data,
      status: 'pending',
      result: '-',
      resultFile: null,
      resultNotes: ''
    });

    await auditService.logActivity({
      userId: userContext.id,
      userName: userContext.name,
      action: 'REQUEST_INVESTIGATION',
      module: 'CLINICAL',
      description: `Requested ${data.test_name} for patient ${data.patientName}`,
      metadata: { patientId: data.patientId, investigationId: investigation.id }
    });

    return investigation;
  },

  async updateResult(id, resultData, file, userContext = { id: 'sys', name: 'System' }) {
    let fileUrl = null;
    if (file) {
      const storageRef = ref(storage, `results/${id}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(snapshot.ref);
    }

    const result = await firestoreService.update(this.collection, id, {
      ...resultData,
      resultFile: fileUrl,
      status: 'completed',
      completedAt: new Date()
    });

    await auditService.logActivity({
      userId: userContext.id,
      userName: userContext.name,
      action: 'UPDATE_RESULT',
      module: 'CLINICAL',
      description: `Uploaded results for investigation ${id}`,
      metadata: { investigationId: id }
    });

    return result;
  },

  async deleteInvestigation(id) {
    return firestoreService.delete(this.collection, id);
  }
};

export default investigationService;
