import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Update lastLogin on success
    if (result.user) {
      const now = new Date().toLocaleString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      await setDoc(doc(db, 'users', result.user.uid), { 
        lastLogin: now 
      }, { merge: true });
    }
    return result;
  }

  async function signup(email, password, additionalData) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

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
        setLoading(true);
        // Subscribe to user document changes
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);

            // Update lastLogin if not already updated this session
            if (!sessionStorage.getItem('login_updated')) {
                const now = new Date().toLocaleString('en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                setDoc(doc(db, 'users', user.uid), { lastLogin: now }, { merge: true }).catch(console.error);
                sessionStorage.setItem('login_updated', 'true');
            }
          } else {
             // Doc doesn't exist yet (e.g. during signup creation)
             setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching user doc:', error);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDoc();
    };
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    signup,
    logout
  };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
