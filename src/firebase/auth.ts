export {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
export type { Auth, User as FirebaseUser } from 'firebase/auth';
