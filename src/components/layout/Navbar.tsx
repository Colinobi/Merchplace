"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import styles from "./Navbar.module.css";

export default function Navbar() {
    return (
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
                    <WalletMultiButton className={styles.walletBtn} />
                </div>
            </div>
        </nav>
    );
}
