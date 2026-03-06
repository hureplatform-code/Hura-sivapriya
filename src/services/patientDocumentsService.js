import firestoreService from './firestoreService';
import { where, orderBy } from 'firebase/firestore';

const patientDocumentsService = {
  collection: firestoreService.collections.patient_documents,

  async getDocumentsByPatient(patientId) {
    return firestoreService.getAll(this.collection, [
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    ]);
  },

  async uploadDocument(documentData) {
    // In a real app, you'd upload to Firebase Storage first
    // For this revamped version, we store metadata and simulate the file URL
    return firestoreService.create(this.collection, {
      ...documentData,
      uploadedAt: new Date().toISOString()
    });
  },

  async deleteDocument(id) {
    return firestoreService.delete(this.collection, id);
  }
};

export default patientDocumentsService;
