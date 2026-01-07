import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/types/user';

export function useUser() {
    const { publicKey, connected } = useWallet();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!connected || !publicKey) {
            setUser(null);
            return;
        }

        setLoading(true);
        const walletAddress = publicKey.toBase58();
        const userRef = doc(db, 'users', walletAddress);

        // Real-time listener for user profile
        const unsubscribe = onSnapshot(userRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setUser(docSnap.data() as UserProfile);
                } else {
                    // User doesn't exist yet, we can treat them as a "Guest" or "New User"
                    // For now, we return null but with no error, implying they need to sign up
                    setUser(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching user:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [publicKey, connected]);

    const createProfile = async (username: string) => {
        if (!publicKey) throw new Error("Wallet not connected");

        const walletAddress = publicKey.toBase58();
        const newUser: UserProfile = {
            walletAddress,
            username,
            reputation: 0,
            createdAt: Date.now(),
        };

        try {
            await setDoc(doc(db, 'users', walletAddress), newUser);
        } catch (e: any) {
            console.error("Error creating profile:", e);
            throw e;
        }
    };

    return { user, loading, error, createProfile, publicKey };
}
