import firestoreService from './firestoreService';
import { db } from '../firebase';
import { query, collection, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';

const medicalMasterService = {
  // Collection Mappings
  collections: {
    categories: firestoreService.collections.pharmacy_categories,
    pharma: firestoreService.collections.pharma_masters,
    nonPharma: firestoreService.collections.non_pharma_masters,
    icd: firestoreService.collections.icd_masters,
    labs: firestoreService.collections.lab_masters,
    imaging: firestoreService.collections.imaging_masters,
    practiceTypes: 'practice_types',
    specialties: 'medical_specialties',
    procedures: 'procedure_masters',
    noteTemplates: 'note_templates',
    dosages: 'dosage_frequencies',
    drugForms: 'drug_forms'
  },

  // Generic Master CRUD helpers
  async getAll(type, limitNum = null, lastDoc = null, sortField = null) {
    const col = this.collections[type];
    if (!col) throw new Error(`Invalid master type: ${type}`);
    
    try {
      const constraints = [];

      if (sortField) {
        constraints.push(orderBy(sortField));
      }

      if (limitNum !== null) {
        constraints.push(limit(limitNum));
      }

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, col), ...constraints);
      const snap = await getDocs(q);
      
      const lastVisible = snap.docs[snap.docs.length - 1];
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (limitNum === null) return items;
      return { items, lastDoc: lastVisible };
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      return limitNum === null ? [] : { items: [], lastDoc: null };
    }
  },

  async getById(type, id) {
    const col = this.collections[type];
    return firestoreService.getById(col, id);
  },

  async create(type, data) {
    const col = this.collections[type];
    return firestoreService.create(col, data);
  },

  async update(type, id, data) {
    const col = this.collections[type];
    return firestoreService.update(col, id, data);
  },

  async delete(type, id) {
    const col = this.collections[type];
    return firestoreService.delete(col, id);
  }
};

export default medicalMasterService;
