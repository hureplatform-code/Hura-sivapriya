import firestoreService from './firestoreService';
import { db } from '../firebase';
import { query, collection, getDocs, orderBy, limit, startAfter, where } from 'firebase/firestore';

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

      const qConstraints = [...constraints];
      if (limitNum !== null) qConstraints.push(limit(limitNum));
      if (lastDoc) qConstraints.push(startAfter(lastDoc));

      // Fetch all matches and filter for facility context
      // Note: Real world would use OR queries, but for small-medium masters, in-memory filtering is safer for index management
      const q = query(collection(db, col), ...qConstraints);
      const snap = await getDocs(q);
      
      const lastVisible = snap.docs[snap.docs.length - 1];
      let items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Multi-tenancy filter
      if (facilityId) {
        items = items.filter(item => !item.facilityId || item.facilityId === facilityId);
      }

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
      let searchFields;
      if (type === 'icd') searchFields = ['code', 'description'];
      else if (type === 'pharma') searchFields = ['brandName', 'genericName', 'code', 'category', 'brand', 'name'];
      else if (type === 'labs' || type === 'imaging') searchFields = ['testName', 'name', 'code', 'category'];
      else searchFields = ['name', 'code'];

      // Normalize terms for case-insensitive simulation
      const searchTerms = [term];
      const capitalized = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
      if (!searchTerms.includes(capitalized)) searchTerms.push(capitalized);
      const allUpper = term.toUpperCase();
      if (!searchTerms.includes(allUpper)) searchTerms.push(allUpper);
      const allLower = term.toLowerCase();
      if (!searchTerms.includes(allLower)) searchTerms.push(allLower);

      const queryPromises = [];
      const distinctTerms = [...new Set(searchTerms)];

      distinctTerms.forEach(t => {
        searchFields.forEach(field => {
          const q = query(
             collection(db, col),
             where(field, '>=', t),
             where(field, '<=', t + '\uf8ff'),
             limit(10)
          );
          // Use a wrapper to prevent one failed query from breaking the whole search
          const qPromise = getDocs(q).catch(err => {
            console.warn(`Query failed for ${field} in ${col}:`, err);
            return { docs: [] };
          });
          queryPromises.push(qPromise);
        });
      });

      const snapshots = await Promise.all(queryPromises);
      const resultsMap = new Map();

      snapshots.forEach(snap => {
        if (snap && snap.docs) {
          snap.docs.forEach(doc => {
            const data = doc.data();
            resultsMap.set(doc.id, { id: doc.id, ...data });
          });
        }
      });

      let results = Array.from(resultsMap.values());

      if (facilityId) {
        // Only filter by facility if the record specifically specifies it (optional masters are usually global)
        results = results.filter(item => !item.facilityId || item.facilityId === facilityId);
      }

      // Sort alphabetically for better UX
      return results.sort((a,b) => (a.name || a.code || '').localeCompare(b.name || b.code || '')).slice(0, 15);
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      return [];
    }
  }
};

export default medicalMasterService;
