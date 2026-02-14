import { where } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firestoreService from './firestoreService';
import { firebaseConfig } from '../firebase';

const userService = {
  collection: firestoreService.collections.users,

  async getAllUsers() {
    return firestoreService.getAll(this.collection);
  },

  async getUserById(id) {
    return firestoreService.getById(this.collection, id);
  },

  async createUser(userData) {
    return firestoreService.create(this.collection, userData);
  },

  /**
   * Creates a staff account in Firebase Auth and a profile in Firestore
   * without logging out the current admin user.
   */
  async createStaffAccount(userData, password) {
    const tempAppName = `temp-user-creator-${Date.now()}`;
    let tempApp = null;
    try {
      // 1. Initialize secondary app
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);

      // 2. Create the user in Auth
      const userCredential = await createUserWithEmailAndPassword(tempAuth, userData.email, password);
      const user = userCredential.user;

      // 3. Immediatly sign out the temp app to avoid session conflicts
      await signOut(tempAuth);

      // 4. Create profile in Firestore with same UID
      const profileData = {
        ...userData,
        uid: user.uid,
        createdAt: new Date(),
        lastLogin: 'Never'
      };

      // Create in Firestore using the Auth UID as the document ID replacement
      await firestoreService.set(this.collection, user.uid, profileData);
      
      return { ...profileData, id: user.uid };
    } catch (error) {
      console.error("Staff creation error:", error);
      throw error;
    } finally {
      // 5. Cleanup
      if (tempApp) {
        await deleteApp(tempApp);
      }
    }
  },

  async updateUser(id, userData) {
    return firestoreService.update(this.collection, id, userData);
  },

  async deleteUser(id) {
    return firestoreService.delete(this.collection, id);
  },

  // RBAC helper
  async getUsersByRole(role) {
    const q = [where('role', '==', role)];
    return firestoreService.getAll(this.collection, q);
  }
};

export default userService;
