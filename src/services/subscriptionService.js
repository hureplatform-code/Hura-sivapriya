import firestoreService from './firestoreService';

const subscriptionService = {
  collection: firestoreService.collections.profile, // Or separate collection if needed

  async getActivePlan(userId) {
    // Logic to fetch user plan
    return firestoreService.getById('subscriptions', userId);
  },

  async updatePlan(userId, planData) {
    return firestoreService.update('subscriptions', userId, planData);
  },

  async getAvailablePlans() {
    return firestoreService.getAll('our_plans');
  }
};

export default subscriptionService;
