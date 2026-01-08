"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    signInWithCustomToken,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { useWallet } from '@solana/wallet-adapter-react';
import { auth } from '@/lib/firebase/config';
import bs58 from 'bs58';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    // Solana wallet auth
    signInWithWallet: () => Promise<void>;
    // Email/password auth
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    // Google auth
    signInWithGoogle: () => Promise<void>;
    // Sign out
    signOutUser: () => Promise<void>;
    // Clear error
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    signInWithWallet: async () => { },
    signInWithEmail: async () => { },
    signUpWithEmail: async () => { },
    resetPassword: async () => { },
    signInWithGoogle: async () => { },
    signOutUser: async () => { },
    clearError: () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { publicKey, signMessage, connected, disconnect } = useWallet();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen to Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const clearError = () => setError(null);

    // ==========================================
    // SOLANA WALLET AUTHENTICATION
    // ==========================================
    const signInWithWallet = async () => {
        if (!publicKey || !signMessage) {
            setError('Wallet not connected or does not support signing');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get the auth message from the API
            const msgResponse = await fetch('/api/auth');
            const { message } = await msgResponse.json();

            // Sign the message with the wallet
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageBytes);
            const signature = bs58.encode(signatureBytes);

            // Send to API for verification and custom token
            const authResponse = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publicKey: publicKey.toBase58(),
                    signature,
                    message,
                }),
            });

            const data = await authResponse.json();

            if (!authResponse.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Sign in to Firebase with the custom token
            await signInWithCustomToken(auth, data.token);

        } catch (err: any) {
            console.error('Wallet sign in error:', err);
            setError(err.message || 'Failed to sign in with wallet');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // EMAIL/PASSWORD AUTHENTICATION
    // ==========================================
    const signInWithEmail = async (email: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error('Email sign in error:', err);
            // Provide user-friendly error messages
            const errorMessages: Record<string, string> = {
                'auth/invalid-email': 'Invalid email address',
                'auth/user-disabled': 'This account has been disabled',
                'auth/user-not-found': 'No account found with this email',
                'auth/wrong-password': 'Incorrect password',
                'auth/invalid-credential': 'Invalid email or password',
                'auth/too-many-requests': 'Too many attempts. Please try again later',
            };
            setError(errorMessages[err.code] || err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const signUpWithEmail = async (email: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            console.error('Email sign up error:', err);
            const errorMessages: Record<string, string> = {
                'auth/email-already-in-use': 'An account already exists with this email',
                'auth/invalid-email': 'Invalid email address',
                'auth/operation-not-allowed': 'Email/password accounts are not enabled',
                'auth/weak-password': 'Password is too weak. Use at least 6 characters',
            };
            setError(errorMessages[err.code] || err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        setLoading(true);
        setError(null);

        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            console.error('Password reset error:', err);
            const errorMessages: Record<string, string> = {
                'auth/invalid-email': 'Invalid email address',
                'auth/user-not-found': 'No account found with this email',
            };
            setError(errorMessages[err.code] || err.message || 'Failed to send reset email');
            throw err; // Re-throw so the UI can handle it
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // GOOGLE AUTHENTICATION
    // ==========================================
    const signInWithGoogle = async () => {
        setLoading(true);
        setError(null);

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error('Google sign in error:', err);
            // Handle popup closed by user gracefully
            if (err.code === 'auth/popup-closed-by-user') {
                setError(null); // Don't show error for cancelled popup
            } else if (err.code === 'auth/cancelled-popup-request') {
                setError(null);
            } else {
                setError(err.message || 'Failed to sign in with Google');
            }
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // SIGN OUT
    // ==========================================
    const signOutUser = async () => {
        try {
            await signOut(auth);
            // Also disconnect wallet if connected
            if (connected) {
                disconnect();
            }
            setUser(null);
            setError(null);
        } catch (err: any) {
            console.error('Sign out error:', err);
            setError(err.message);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        signInWithWallet,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signInWithGoogle,
        signOutUser,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
