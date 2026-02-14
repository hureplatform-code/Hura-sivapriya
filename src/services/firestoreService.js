import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const sanitizeData = (data) => {
  if (data === null || typeof data !== 'object') return data;
  
  const sanitized = Array.isArray(data) ? [] : {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined) {
      sanitized[key] = sanitizeData(value);
    }
  });
  
  return sanitized;
};

// Helper to handle Firestore operations
const firestoreService = {
  // Collection References
  collections: {
    users: 'users',
    patients: 'patients',
    appointments: 'appointments',
    billing: 'billing',
    inventory: 'inventory',
    wards: 'wards',
    investigations: 'investigations',
    audit_logs: 'audit_logs',
    hospital_profile: 'hospital_profile',
    roles: 'roles',
    facility_branches: 'facility_branches',
    medical_records: 'medical_records',
    pharmacy_categories: 'pharmacy_categories',
    pharma_masters: 'pharma_masters',
    non_pharma_masters: 'non_pharma_masters',
    icd_masters: 'icd_masters',
    lab_masters: 'lab_masters',
    imaging_masters: 'imaging_masters'
  },

  // Generic CRUD
  async create(collectionName, data) {
    try {
      const sanitizedData = sanitizeData(data);
      const docRef = await addDoc(collection(db, collectionName), {
        ...sanitizedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...sanitizedData };
    } catch (error) {
      console.error(`Error adding document to ${collectionName}: `, error);
      throw error;
    }
  },

  async getAll(collectionName, queryConstraints = []) {
    try {
      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}: `, error);
      throw error;
    }
  },

  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}: `, error);
      throw error;
    }
  },

  async update(collectionName, id, data) {
    try {
      const sanitizedData = sanitizeData(data);
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...sanitizedData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}: `, error);
      throw error;
    }
  },

  async set(collectionName, id, data) {
    try {
      const sanitizedData = sanitizeData(data);
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, {
        ...sanitizedData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error(`Error setting document ${id} in ${collectionName}: `, error);
      throw error;
    }
  },

  async delete(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}: `, error);
      throw error;
    }
  },

  // Alias for create
  async add(collectionName, data) {
    return this.create(collectionName, data);
  }
};

export default firestoreService;

