"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { db } from "@/lib/firebase/config";
import { doc, collection, addDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import styles from "./BidModal.module.css";
import { Listing } from "@/types/listing";

interface BidModalProps {
    listing: Listing;
    onClose: () => void;
}

export default function BidModal({ listing, onClose }: BidModalProps) {
    const { user, publicKey } = useUser();
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !publicKey) {
            setError("Please connect wallet to bid");
            return;
        }

        const bidAmount = parseFloat(amount);
        const currentPrice = listing.highestBid || listing.startingPrice;

        if (isNaN(bidAmount) || bidAmount <= currentPrice) {
            setError(`Bid must be higher than ${currentPrice} USDC`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await runTransaction(db, async (transaction) => {
                const listingRef = doc(db, "listings", listing.id);
                const listingDoc = await transaction.get(listingRef);

                if (!listingDoc.exists()) throw new Error("Listing does not exist");

                const latestListing = listingDoc.data() as Listing;
                const currentHighest = latestListing.highestBid || latestListing.startingPrice;

                if (bidAmount <= currentHighest) {
                    throw new Error(`Someone just bid higher! New minimum: ${currentHighest}`);
                }

                // update listing with new highest bid
                transaction.update(listingRef, {
                    highestBid: bidAmount
                });

                // create bid record
                const bidRef = doc(collection(db, "listings", listing.id, "bids"));
                transaction.set(bidRef, {
                    bidderId: publicKey.toBase58(),
                    bidderName: user.username || "Anonymous",
                    amount: bidAmount,
                    createdAt: serverTimestamp()
                });
            });

            onClose();
        } catch (err: any) {
            console.error("Bid failed:", err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>
                <h2>Place a Bid</h2>
                <p className={styles.itemTitle}>{listing.title}</p>

                <div className={styles.priceInfo}>
                    <span>Current Price:</span>
                    <span className={styles.price}>{listing.highestBid || listing.startingPrice} USDC</span>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleBid}>
                    <div className={styles.inputGroup}>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Enter > ${listing.highestBid || listing.startingPrice}`}
                            step="0.01"
                            required
                            className={styles.input}
                        />
                        <span className={styles.currency}>USDC</span>
                    </div>

                    <button type="submit" disabled={isSubmitting} className={styles.bidBtn}>
                        {isSubmitting ? "Placing Bid..." : "Confirm Bid"}
                    </button>
                </form>
            </div>
        </div>
    );
}
