"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Listing } from "@/types/listing";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { useUser } from "@/hooks/useUser";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import styles from "./page.module.css";

export default function ProfilePage() {
    const { user, publicKey } = useUser();
    const username = user?.username;
    const { disconnect, connected } = useWallet();
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!publicKey) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "listings"),
            where("sellerId", "==", publicKey.toBase58()),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Listing[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as Listing);
            });
            setMyListings(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [publicKey]);

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyAddress = async () => {
        if (publicKey) {
            await navigator.clipboard.writeText(publicKey.toBase58());
            alert("Address copied!");
        }
    };

    const handleDisconnect = () => {
        disconnect();
    };

    if (!connected) {
        return (
            <>
                <Navbar />
                <main className={styles.main}>
                    <div className={styles.container}>
                        <div className={styles.notConnected}>
                            <span className={styles.walletIcon}>👛</span>
                            <h2>Connect Your Wallet</h2>
                            <p>Connect your Solana wallet to view your profile and listings</p>
                        </div>
                    </div>
                </main>
                <BottomNav />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Profile Header */}
                    <div className={styles.profileHeader}>
                        <div className={styles.avatar}>
                            {username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className={styles.userInfo}>
                            <h1 className={styles.username}>@{username || "Anonymous"}</h1>
                            <button className={styles.addressBtn} onClick={copyAddress}>
                                <span>{truncateAddress(publicKey?.toBase58() || "")}</span>
                                <span className={styles.copyIcon}>📋</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>{myListings.length}</span>
                            <span className={styles.statLabel}>Listings</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>
                                {myListings.filter(l => l.status === "sold").length}
                            </span>
                            <span className={styles.statLabel}>Sold</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>⭐ 5.0</span>
                            <span className={styles.statLabel}>Rating</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statValue}>Jan 2026</span>
                            <span className={styles.statLabel}>Joined</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <Link href="/sell" className={styles.actionBtn}>
                            ➕ New Listing
                        </Link>
                        <button className={styles.actionBtnSecondary} onClick={handleDisconnect}>
                            🚪 Disconnect Wallet
                        </button>
                    </div>

                    {/* My Listings */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>My Listings</h2>

                        {loading ? (
                            <p className={styles.loading}>Loading your listings...</p>
                        ) : myListings.length === 0 ? (
                            <div className={styles.emptyListings}>
                                <span>📦</span>
                                <p>You haven&apos;t listed anything yet</p>
                                <Link href="/sell" className={styles.sellBtn}>
                                    List Your First Item
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.listingsGrid}>
                                {myListings.map((item) => (
                                    <Link href={`/item/${item.id}`} key={item.id} className={styles.listingCard}>
                                        <div className={styles.listingImage}>
                                            {item.imageUrls[0] ? (
                                                <img src={item.imageUrls[0]} alt={item.title} />
                                            ) : (
                                                <div className={styles.noImage}>📷</div>
                                            )}
                                            <span className={`${styles.statusBadge} ${styles[`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className={styles.listingInfo}>
                                            <h3>{item.title}</h3>
                                            <span className={styles.listingPrice}>
                                                {item.highestBid || item.startingPrice} USDC
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <BottomNav />
        </>
    );
}
