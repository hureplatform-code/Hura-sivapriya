import firestoreService from './firestoreService';
import { where, orderBy } from 'firebase/firestore';

const patientDocumentsService = {
  collection: firestoreService.collections.patient_documents,

  async getDocumentsByPatient(patientId) {
    if (!patientId) return [];
    try {
      return await firestoreService.getAll(this.collection, [
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      ]);
    } catch (error) {
      console.warn("getDocumentsByPatient fallback:", error);
      const docs = await firestoreService.getAll(this.collection, [
        where('patientId', '==', patientId)
      ]);
      return docs.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return dateB - dateA;
      });
    }
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
