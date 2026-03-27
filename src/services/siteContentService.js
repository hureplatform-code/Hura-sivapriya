import firestoreService from './firestoreService';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const siteContentService = {
  collection: 'site_content',
  docId: 'landing_page',

  async getContent() {
    try {
      const docRef = doc(db, this.collection, this.docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching site content:', error);
      return null;
    }
  },

  async updateContent(data) {
    try {
      const docRef = doc(db, this.collection, this.docId);
      await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating site content:', error);
      throw error;
    }
  }
};

export default siteContentService;
