// CRATE NIGHT — Firebase provider logic (AGENTS.md: keep provider logic here).
// Only the public web config belongs in a web client. Never place
// service-account JSON, private keys, or passwords in this file.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase Console → Project settings → Your apps.
// Web App ID: 1:446764185371:web:e9e1ddeb80b09081fe85be
// The web apiKey is a public client identifier, not a secret — paste the
// value from your Firebase console before deploying.
const firebaseConfig = {
  apiKey: "YOUR_WEB_API_KEY",
  authDomain: "crate-night-eaa55.firebaseapp.com",
  projectId: "crate-night-eaa55",
  storageBucket: "crate-night-eaa55.firebasestorage.app",
  messagingSenderId: "446764185371",
  appId: "1:446764185371:web:e9e1ddeb80b09081fe85be",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const ADMIN_EMAIL = "cratenight@gmail.com";

// Admin = the primary owner email, or a custom claim set from a privileged
// backend. The client gate is cosmetic; firestore.rules enforces it.
export async function isAdminUser(user) {
  if (!user) return false;
  if ((user.email || "").toLowerCase() === ADMIN_EMAIL) return true;
  try {
    const token = await user.getIdTokenResult();
    return token.claims.admin === true;
  } catch {
    return false;
  }
}

const AUTH_ERRORS = {
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/user-not-found": "No account with that email.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/email-already-in-use": "That email already has an account — sign in instead.",
  "auth/weak-password": "Use at least 6 characters for the password.",
  "auth/invalid-phone-number": "Use international format, e.g. +15551234567.",
  "auth/invalid-verification-code": "That code is not valid — check the SMS and try again.",
  "auth/code-expired": "That code expired — request a new one.",
  "auth/too-many-requests": "Too many attempts — wait a minute and try again.",
  "auth/unauthorized-domain": "This domain is not in Firebase Authentication → Settings → Authorized domains.",
  "auth/operation-not-supported-in-this-environment": "Open the site over https in a normal browser tab to sign in.",
};

export function authErrorMessage(error) {
  return (error && (AUTH_ERRORS[error.code] || error.message)) || "Something went wrong — try again.";
}

export function signUpEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Google uses the redirect flow — mobile-friendly, no popup blockers.
export function signInGoogle() {
  return signInWithRedirect(auth, new GoogleAuthProvider());
}

export function handleGoogleRedirect() {
  return getRedirectResult(auth);
}

// Phone: invisible reCAPTCHA guards the send; the SMS code completes sign-in.
export async function sendPhoneCode(phone, containerId) {
  if (window.__crateRecaptcha) {
    try { window.__crateRecaptcha.clear(); } catch { /* already reset */ }
  }
  const verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  window.__crateRecaptcha = verifier;
  try {
    return await signInWithPhoneNumber(auth, phone, verifier);
  } catch (error) {
    try { verifier.clear(); } catch { /* already reset */ }
    window.__crateRecaptcha = null;
    throw error;
  }
}

export function confirmPhoneCode(confirmation, code) {
  return confirmation.confirm(code);
}

export function signOutUser() {
  return signOut(auth);
}

export function watchSession(callback) {
  return onAuthStateChanged(auth, callback);
}
