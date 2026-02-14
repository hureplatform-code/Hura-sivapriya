import firestoreService from './firestoreService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const facilityService = {
  collection: firestoreService.collections.facilities || 'facility_profile',
  branchesCollection: 'facility_branches',
  defaultId: 'main_facility',

  async getProfile() {
    try {
      // Check cache first for instant UI
      const cached = localStorage.getItem('hospital_profile_cache');
      if (cached) {
        // Return cached immediately but still fetch fresh in background if needed
        // For simplicity here, we'll return the promise that resolves to either fresh or cached
      }
      
      const profile = await firestoreService.getById(this.collection, this.defaultId);
      if (profile) {
        localStorage.setItem('hospital_profile_cache', JSON.stringify(profile));
      }
      return profile;
    } catch (error) {
      console.error('Error fetching facility profile:', error);
      const cached = localStorage.getItem('hospital_profile_cache');
      return cached ? JSON.parse(cached) : null;
    }
  },

  // Synchronous helper for Sidebar initialization
  getCachedProfile() {
    const cached = localStorage.getItem('hospital_profile_cache');
    return cached ? JSON.parse(cached) : null;
  },

  async updateProfile(profileData, logoFile = null) {
    try {
      let logoUrl = profileData.logoUrl || null;

      if (logoFile) {
        const storageRef = ref(storage, `branding/logo_${this.defaultId}`);
        const snapshot = await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(snapshot.ref);
      }

      const updatedData = {
        ...profileData,
        logoUrl: logoUrl !== undefined ? logoUrl : (profileData.logoUrl || null),
        updatedAt: new Date().toISOString()
      };

      const result = await firestoreService.set(this.collection, this.defaultId, updatedData);
      if (result) {
        localStorage.setItem('hospital_profile_cache', JSON.stringify(updatedData));
      }
      return result;
    } catch (error) {
      console.error('Error updating facility profile:', error);
      throw error;
    }
  },

  // Branch Management
  async getBranches() {
    return firestoreService.getAll(this.branchesCollection);
  },

  async addBranch(branchData) {
    return firestoreService.create(this.branchesCollection, {
      ...branchData,
      status: branchData.status || 'Active',
      createdAt: new Date().toISOString()
    });
  },

  async updateBranch(branchId, branchData) {
    return firestoreService.update(this.branchesCollection, branchId, branchData);
  },

  async deleteBranch(branchId) {
    return firestoreService.delete(this.branchesCollection, branchId);
  },

  // Subscription & Plans
  async getSubscriptionPlan(planId) {
    return firestoreService.getById('subscription_plans', planId);
  }
};

export default facilityService;
