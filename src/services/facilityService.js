import firestoreService from './firestoreService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const facilityService = {
  collection: firestoreService.collections.facilities || 'facility_profile',
  branchesCollection: 'facility_branches',
  defaultId: 'main_facility',

  async getProfile(facilityId) {
    try {
      if (!facilityId) return null;
      
      const profile = await firestoreService.getById(this.collection, facilityId);
      return profile;
    } catch (error) {
      console.error('Error fetching facility profile:', error);
      return null;
    }
  },

  async createFacility(facilityData, logoFile = null) {
    try {
        let logoUrl = null;
        // Generate a new ID (could also use firestoreService.create to auto-gen)
        const newFacilityId = `fac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (logoFile) {
            const storageRef = ref(storage, `branding/logo_${newFacilityId}`);
            const snapshot = await uploadBytes(storageRef, logoFile);
            logoUrl = await getDownloadURL(snapshot.ref);
        }

        const newProfile = {
            ...facilityData,
            id: newFacilityId,
            logoUrl: logoUrl,
            createdAt: new Date().toISOString(),
            status: 'active',
            subscription: {
              planId: 'trial',
              planName: 'Free Trial',
              maxStaff: 5,
              maxLocations: 1,
              startDate: new Date().toISOString(),
              expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
              status: 'active'
            }
        };

        await firestoreService.set(this.collection, newFacilityId, newProfile);
        return newProfile;
    } catch (error) {
        console.error("Error creating facility:", error);
        throw error;
    }
  },

  async updateProfile(facilityId, profileData, logoFile = null) {
    try {
      if (!facilityId) throw new Error("Facility ID is required");
      
      let logoUrl = profileData.logoUrl || null;

      if (logoFile) {
        const storageRef = ref(storage, `branding/logo_${facilityId}`);
        const snapshot = await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(snapshot.ref);
      }

      const updatedData = {
        ...profileData,
        logoUrl: logoUrl !== undefined ? logoUrl : (profileData.logoUrl || null),
        updatedAt: new Date().toISOString()
      };

      return firestoreService.update(this.collection, facilityId, updatedData);
    } catch (error) {
      console.error('Error updating facility profile:', error);
      throw error;
    }
  },

  async updateSubscription(facilityId, subscriptionData) {
    try {
      return firestoreService.update(this.collection, facilityId, { 
        subscription: subscriptionData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  async getAllFacilities() {
    try {
      return firestoreService.getAll(this.collection);
    } catch (error) {
      console.error('Error fetching all facilities:', error);
      return [];
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
  },

  async requestUpgrade(facilityId, { currentPlan, requestedPlan, message }) {
    return firestoreService.create('subscription_requests', {
      facilityId,
      currentPlan,
      requestedPlan,
      message,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
  },

  async getAllSubscriptionRequests() {
    return firestoreService.getAll('subscription_requests');
  },

  async updateSubscriptionRequest(requestId, status) {
    return firestoreService.update('subscription_requests', requestId, { status });
  }
};

export default facilityService;
