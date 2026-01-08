"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const { user, isAuthenticated, signOutUser } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.container}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoIcon}>🛍️</span>
                        <span className={styles.logoText}>Merchplace</span>
                    </Link>

                    {/* Search Bar */}
                    <div className={styles.searchWrapper}>
                        <input
                            type="text"
                            placeholder="Search for items, brands, and more..."
                            className={styles.searchInput}
                        />
                        <button className={styles.searchBtn}>
                            🔍
                        </button>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <Link href="/sell" className={styles.sellBtn}>
                            + Sell now
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <span className={styles.userEmail}>
                                    {user?.email || user?.uid?.slice(0, 8) + '...'}
                                </span>
                                <button
                                    onClick={signOutUser}
                                    className={styles.authBtn}
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className={styles.authBtn}
                            >
                                Sign In
                            </button>
                        )}

                        <WalletMultiButton className={styles.walletBtn} />
                    </div>
                </div>
            </nav>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </>
    );
}
