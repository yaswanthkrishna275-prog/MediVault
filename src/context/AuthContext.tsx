import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_ID = 'demo_user_btech_2026';

const DEFAULT_DEMO_PROFILE: UserProfile = {
  uid: DEMO_USER_ID,
  email: 'yaswanth.student@medivault.edu',
  displayName: 'Yaswanth Sriram (Student Demo)',
  dateOfBirth: '2003-05-14',
  bloodGroup: 'O+',
  emergencyContact: {
    name: 'Sriram Raman (Father)',
    relationship: 'Parent',
    phone: '+91 98765 43210'
  },
  knownAllergies: ['Penicillin', 'Dust mites'],
  chronicConditions: ['Mild Asthma'],
  city: 'Bengaluru',
  country: 'India'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // Check if demo user session was saved
    const savedDemo = localStorage.getItem('medivault_demo_active');
    if (savedDemo === 'true') {
      setIsDemoUser(true);
      const savedProfile = localStorage.getItem('medivault_demo_profile');
      if (savedProfile) {
        try {
          setUserProfile(JSON.parse(savedProfile));
        } catch {
          setUserProfile(DEFAULT_DEMO_PROFILE);
        }
      } else {
        setUserProfile(DEFAULT_DEMO_PROFILE);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        setIsDemoUser(false);
        // Load user profile from firestore
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            const initialProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Healthcare User',
              city: 'Bengaluru',
              country: 'India'
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error('Error fetching profile from Firestore:', err);
          setUserProfile({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Healthcare User',
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    localStorage.removeItem('medivault_demo_active');
    setIsDemoUser(false);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    localStorage.removeItem('medivault_demo_active');
    setIsDemoUser(false);
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      const initialProfile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: name,
        city: 'Bengaluru',
        country: 'India'
      };
      await setDoc(doc(db, 'users', cred.user.uid), initialProfile);
      setUserProfile(initialProfile);
    }
  };

  const loginDemo = () => {
    setIsDemoUser(true);
    localStorage.setItem('medivault_demo_active', 'true');
    localStorage.setItem('medivault_demo_profile', JSON.stringify(DEFAULT_DEMO_PROFILE));
    setUserProfile(DEFAULT_DEMO_PROFILE);
    setLoading(false);
  };

  const logout = async () => {
    if (isDemoUser) {
      setIsDemoUser(false);
      localStorage.removeItem('medivault_demo_active');
      setUserProfile(null);
      return;
    }
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (isDemoUser) {
      const updated = { ...(userProfile || DEFAULT_DEMO_PROFILE), ...data };
      setUserProfile(updated);
      localStorage.setItem('medivault_demo_profile', JSON.stringify(updated));
      return;
    }
    if (user) {
      const updated = { ...(userProfile || {}), ...data, uid: user.uid, email: user.email || '' } as UserProfile;
      await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      setUserProfile(updated);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isDemoUser,
      loginWithEmail,
      signupWithEmail,
      loginDemo,
      logout,
      updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
