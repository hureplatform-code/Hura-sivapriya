import firestoreService from './firestoreService';
import { db } from '../firebase';
import { query, collection, getDocs, orderBy, limit, startAfter, where, or } from 'firebase/firestore';

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
  async getAll(type, limitNum = null, lastDoc = null, sortField = null, facilityId = null) {
    const col = this.collections[type];
    if (!col) throw new Error(`Invalid master type: ${type}`);
    
    try {
      const constraints = [];

      if (sortField) {
        constraints.push(orderBy(sortField));
      }

      // If facilityId is provided, we want to fetch global codes (null/missing) AND facility-specific ones
      // Since 'or' queries are complex with ordering/pagination, we can use 'where' if we strictly follow one path,
      // but for masters, usually we want ALL global + ONE facility.
      // Easiest is to fetch all where facilityId == null (global) and where facilityId == facilityId (local)
      
      const qConstraints = [...constraints];
      if (limitNum !== null) qConstraints.push(limit(limitNum));
      if (lastDoc) qConstraints.push(startAfter(lastDoc));

      // Strategy: Most codes are global. We'll fetch everything and filter in-memory if it's small,
      // but if big, we need real queries.
      // For now, let's implement a robust query that handles the facility filter if provided.
      
      let q;
      if (facilityId) {
        // Strategy: Use 'or' query to fetch platform standards (null facilityId OR isGlobal) and facility items
        const masterQuery = query(
          collection(db, col),
          or(
            where('facilityId', '==', facilityId),
            where('facilityId', '==', null),
            where('isGlobal', '==', true)
          ),
          ...constraints,
          ...(limitNum ? [limit(limitNum)] : []),
          ...(lastDoc ? [startAfter(lastDoc)] : [])
        );

        const snap = await getDocs(masterQuery);
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (sortField) {
          items.sort((a, b) => (a[sortField] > b[sortField] ? 1 : -1));
        }

        return limitNum === null ? items : { items, lastDoc: snap.docs[snap.docs.length - 1] };
      }

      q = query(collection(db, col), ...qConstraints);
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
  },

  async search(type, term, facilityId = null) {
    const col = this.collections[type];
    if (!col) throw new Error(`Invalid master type: ${type}`);
    
    try {
      // Determine search fields based on type
      let searchFields = ['name'];
      if (type === 'icd') searchFields = ['code', 'description'];
      if (type === 'pharma') searchFields = ['name', 'code'];
      if (type === 'labs') searchFields = ['name', 'test'];

      // Execute queries for each field
      const queryPromises = searchFields.map(field => {
        const q = query(
           collection(db, col),
           where(field, '>=', term),
           where(field, '<=', term + '\uf8ff'),
           limit(20)
        );
        return getDocs(q);
      });

      const snapshots = await Promise.all(queryPromises);
      const resultsMap = new Map();

      snapshots.forEach(snap => {
        snap.docs.forEach(doc => {
          resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      });

      let results = Array.from(resultsMap.values());

      if (facilityId) {
        results = results.filter(item => !item.facilityId || item.facilityId === facilityId);
      }

      return results.slice(0, 15);
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      return [];
    }
  }
};

export default medicalMasterService;
