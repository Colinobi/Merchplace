"use client";

import { useState } from "react";
import styles from "./MarketplaceFeed.module.css";
import BidModal from "./BidModal";
import dynamic from "next/dynamic";
import { useUser } from "@/hooks/useUser";
import { useListings } from "@/hooks/useFirestore";
import { addToFavorites, removeFromFavorites } from "@/lib/firebase/db";
import { Transaction, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import type { Listing, LegacyListing } from "@/types";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Skeleton Card Component
function SkeletonCard() {
    return (
        <div className={styles.card}>
            <div className={`${styles.imageWrapper} ${styles.skeleton}`}></div>
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={`${styles.skeletonText} ${styles.skeletonTitle}`}></div>
                    <div className={`${styles.skeletonText} ${styles.skeletonPrice}`}></div>
                </div>
                <div className={styles.footer}>
                    <div className={`${styles.skeletonText} ${styles.skeletonSeller}`}></div>
                </div>
            </div>
        </div>
    );
}

// Adapter to handle both old and new listing formats
function adaptListing(item: Listing | LegacyListing): {
    id: string;
    title: string;
    description: string;
    imageUrls: string[];
    currentPrice: number;
    sellerId: string;
    sellerName: string;
    status: string;
    hasHighestBid: boolean;
} {
    // Check if it's the new format (has currentPrice) or legacy (has startingPrice/highestBid)
    const isLegacy = !('currentPrice' in item);

    if (isLegacy) {
        const legacy = item as LegacyListing;
        return {
            id: legacy.id,
            title: legacy.title,
            description: legacy.description,
            imageUrls: legacy.imageUrls,
            currentPrice: legacy.highestBid || legacy.startingPrice,
            sellerId: legacy.sellerId,
            sellerName: legacy.sellerName || 'Unknown',
            status: legacy.status,
            hasHighestBid: !!legacy.highestBid
        };
    }

    const listing = item as Listing;
    return {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        imageUrls: listing.imageUrls,
        currentPrice: listing.currentPrice,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        status: listing.status,
        hasHighestBid: listing.auction?.bidCount ? listing.auction.bidCount > 0 : false
    };
}

export default function MarketplaceFeed() {
    const { publicKey } = useUser();
    const { sendTransaction } = useWallet();
    const { listings, loading } = useListings();
    const [selectedListing, setSelectedListing] = useState<Listing | LegacyListing | null>(null);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

    const toggleFavorite = async (e: React.MouseEvent, item: Listing | LegacyListing) => {
        e.stopPropagation();
        e.preventDefault();

        if (!publicKey) {
            alert("Please connect wallet to save favorites");
            return;
        }

        const uid = publicKey.toBase58();
        setTogglingFavorite(item.id);

        try {
            if (favorites.has(item.id)) {
                await removeFromFavorites(uid, item.id);
                setFavorites(prev => {
                    const newFavorites = new Set(prev);
                    newFavorites.delete(item.id);
                    return newFavorites;
                });
            } else {
                // Create a minimal listing object for the favorite
                const listingForFavorite: Listing = {
                    ...(item as Listing),
                    currentPrice: ('currentPrice' in item) ? item.currentPrice : (item as LegacyListing).highestBid || (item as LegacyListing).startingPrice,
                    stats: { views: 0, favorites: 0, shares: 0 }
                } as Listing;

                await addToFavorites(uid, listingForFavorite);
                setFavorites(prev => new Set(prev).add(item.id));
            }
        } catch (err) {
            console.error("Failed to toggle favorite:", err);
        } finally {
            setTogglingFavorite(null);
        }
    };

    const handlePay = async (e: React.MouseEvent, item: Listing | LegacyListing) => {
        e.stopPropagation();
        e.preventDefault();
        if (!publicKey) {
            alert("Please connect wallet first");
            return;
        }

        const adapted = adaptListing(item);

        try {
            const response = await fetch("/api/create-payment-tx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    buyer: publicKey.toBase58(),
                    seller: adapted.sellerId,
                    amount: adapted.currentPrice
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
            const signature = await sendTransaction(tx, connection);

            alert(`Payment Sent! Signature: ${signature}`);
        } catch (err) {
            console.error(err);
            alert("Payment failed (Do you have Devnet USDC?)");
        }
    };

    if (loading) {
        return (
            <>
                <div className={styles.grid}>
                    {[...Array(6)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </>
        );
    }

    if (listings.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No listings found.</p>
                <p>Be the first to list some merch!</p>
            </div>
        );
    }

    // Convert to location format for map
    const listingsWithLocation = listings.filter(l => l.location);

    return (
        <>
            {listingsWithLocation.length > 0 && (
                <LocationMap listings={listingsWithLocation as unknown as LegacyListing[]} />
            )}
            <div className={styles.grid}>
                {listings.map((item) => {
                    const adapted = adaptListing(item);

                    return (
                        <Link href={`/item/${item.id}`} key={item.id} className={styles.cardLink}>
                            <div className={styles.card}>
                                <div className={styles.imageWrapper}>
                                    {adapted.imageUrls[0] && (
                                        <img
                                            src={adapted.imageUrls[0]}
                                            alt={adapted.title}
                                            className={styles.image}
                                        />
                                    )}
                                    <button
                                        className={`${styles.heartButton} ${favorites.has(item.id) ? styles.heartActive : ""}`}
                                        onClick={(e) => toggleFavorite(e, item)}
                                        disabled={togglingFavorite === item.id}
                                        aria-label={favorites.has(item.id) ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        <svg viewBox="0 0 24 24" className={styles.heartIcon}>
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className={styles.content}>
                                    <div className={styles.header}>
                                        <h3>{adapted.title}</h3>
                                        <div className={styles.priceTag}>
                                            <span className={styles.price}>{adapted.currentPrice} USDC</span>
                                            {adapted.hasHighestBid && <span className={styles.bidLabel}>Current Bid</span>}
                                        </div>
                                    </div>
                                    <div className={styles.footer}>
                                        <p className={styles.seller}>@{adapted.sellerName}</p>
                                        <button
                                            className={styles.bidButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setSelectedListing(item);
                                            }}
                                        >
                                            Bid
                                        </button>
                                        {adapted.sellerId !== publicKey?.toBase58() && (
                                            <button
                                                className={styles.payButton}
                                                onClick={(e) => handlePay(e, item)}
                                            >
                                                Pay
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
            {selectedListing && (
                <BidModal
                    listing={selectedListing as LegacyListing}
                    onClose={() => setSelectedListing(null)}
                />
            )}
        </>
    );
}
