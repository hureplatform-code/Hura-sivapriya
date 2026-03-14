import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import facilityService from '../services/facilityService';
import userService from '../services/userService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [activeStaffCount, setActiveStaffCount] = useState(0);

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Update lastLogin on success
    if (result.user) {
      const now = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Attempt to update by UID - this is the standard
      await setDoc(doc(db, 'users', result.user.uid), { 
        lastLogin: now 
      }, { merge: true });

      // Resilience: Also update by email just in case the UID/DocID mapping is old/mismatched
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnap) => {
          if (docSnap.id !== result.user.uid) {
            await setDoc(doc(db, 'users', docSnap.id), { 
              lastLogin: now,
              uid: result.user.uid // Fix the UID mapping while we're at it
            }, { merge: true });
          }
        });
      } catch (e) { console.error("Resilience update failed:", e); }
    }
    return result;
  }

  async function signup(email, password, additionalData) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Send email verification link
    try {
      await sendEmailVerification(user);
    } catch (err) {
      console.error("Failed to send verification email:", err);
    }

    // Create user profile in Firestore
    const profileData = {
      uid: user.uid,
      email: email,
      createdAt: new Date(),
      ...additionalData
    };

    await setDoc(doc(db, 'users', user.uid), profileData);
    setUserData(profileData);
    return user;
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    let unsubscribeDoc = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      unsubscribeDoc(); // Unsubscribe previous listener if any

      if (user) {
        // Subscribe to user document changes
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);

            // Fetch facility data immediately if needed
            if (data.facilityId && data.role !== 'superadmin') {
                try {
                    const facility = await facilityService.getProfile(data.facilityId);
                    if (facility) {
                        setSubscriptionStatus(facility.subscription);
                        const count = await userService.countActiveStaff(data.facilityId);
                        setActiveStaffCount(count);
                    }
                } catch (err) {
                    console.error("Critical: Failed to fetch subscription during auth init:", err);
                }
            }

            // Update lastLogin if not already updated this session
            if (!sessionStorage.getItem('login_updated')) {
                const now = new Date().toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                setDoc(doc(db, 'users', user.uid), { lastLogin: now }, { merge: true }).catch(console.error);
                sessionStorage.setItem('login_updated', 'true');
            }
          } else {
             setUserData(null);
          }
          setLoading(false);
          setInitialized(true);
        }, async (error) => {
          console.error('Error fetching user doc:', error);
          setLoading(false);
          setInitialized(true);
        });
      } else {
        setUserData(null);
        setSubscriptionStatus(null);
        setActiveStaffCount(0);
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, []);

  // Subscription Monitor Effect
  useEffect(() => {
    const fetchSubData = async () => {
        if (userData?.facilityId && userData.role !== 'superadmin') {
            try {
                const facility = await facilityService.getProfile(userData.facilityId);
                if (facility) {
                    setSubscriptionStatus(facility.subscription);
                    const count = await userService.countActiveStaff(userData.facilityId);
                    setActiveStaffCount(count);
                }
            } catch (err) {
                console.error("Sub check error:", err);
            }
        }
    };
    fetchSubData();
  }, [userData]);

  const value = {
    currentUser,
    userData,
    login,
    signup,
    logout,
    subscriptionStatus,
    activeStaffCount,
    loading,
    initialized
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
