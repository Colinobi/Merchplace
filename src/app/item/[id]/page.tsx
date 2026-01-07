"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Listing } from "@/types/listing";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import BidModal from "@/components/listings/BidModal";
import { useUser } from "@/hooks/useUser";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, Connection } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Mock bid history data
const mockBidHistory = [
    { bidder: "alex.sol", amount: 45, time: "2 hours ago" },
    { bidder: "crypto_collector", amount: 42, time: "5 hours ago" },
    { bidder: "nft_whale", amount: 38, time: "1 day ago" },
];

export default function ItemDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { publicKey } = useUser();
    const { sendTransaction } = useWallet();
    const [item, setItem] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showBidModal, setShowBidModal] = useState(false);

    useEffect(() => {
        const fetchItem = async () => {
            if (!params.id) return;

            const docRef = doc(db, "listings", params.id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setItem({ id: docSnap.id, ...docSnap.data() } as Listing);
            }
            setLoading(false);
        };

        fetchItem();
    }, [params.id]);

    const handlePay = async () => {
        if (!publicKey || !item) {
            alert("Please connect wallet first");
            return;
        }

        try {
            const response = await fetch("/api/create-payment-tx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    buyer: publicKey.toBase58(),
                    seller: item.sellerId,
                    amount: item.highestBid || item.startingPrice
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
            const signature = await sendTransaction(tx, connection);

            alert(`Payment Sent! Signature: ${signature}`);
        } catch (err) {
            console.error(err);
            alert("Payment failed");
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className={styles.loading}>Loading...</div>
                <BottomNav />
            </>
        );
    }

    if (!item) {
        return (
            <>
                <Navbar />
                <div className={styles.notFound}>
                    <h2>Item not found</h2>
                    <button onClick={() => router.push("/")}>Back to Home</button>
                </div>
                <BottomNav />
            </>
        );
    }

    const isOwner = item.sellerId === publicKey?.toBase58();

    return (
        <>
            <Navbar />

            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Image Gallery */}
                    <div className={styles.gallery}>
                        <div className={styles.mainImage}>
                            {item.imageUrls[selectedImageIndex] ? (
                                <img src={item.imageUrls[selectedImageIndex]} alt={item.title} />
                            ) : (
                                <div className={styles.noImage}>No Image</div>
                            )}
                        </div>
                        {item.imageUrls.length > 1 && (
                            <div className={styles.thumbnails}>
                                {item.imageUrls.map((url, index) => (
                                    <button
                                        key={index}
                                        className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.thumbnailActive : ""}`}
                                        onClick={() => setSelectedImageIndex(index)}
                                    >
                                        <img src={url} alt={`${item.title} ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Item Info */}
                    <div className={styles.info}>
                        <div className={styles.priceSection}>
                            <span className={styles.price}>
                                {item.highestBid || item.startingPrice} USDC
                            </span>
                            {item.highestBid && (
                                <span className={styles.bidBadge}>Current Bid</span>
                            )}
                        </div>

                        <h1 className={styles.title}>{item.title}</h1>

                        <p className={styles.description}>{item.description}</p>

                        {/* Seller Card */}
                        <div className={styles.sellerCard}>
                            <div className={styles.sellerAvatar}>
                                {item.sellerName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className={styles.sellerInfo}>
                                <span className={styles.sellerName}>@{item.sellerName}</span>
                                <div className={styles.sellerMeta}>
                                    <span className={styles.sellerRep}>⭐ 4.8</span>
                                    <span className={styles.sellerDot}>•</span>
                                    <span className={styles.sellerStats}>12 sales</span>
                                    <span className={styles.sellerDot}>•</span>
                                    <span className={styles.sellerStats}>Member since Jan 2026</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            {!isOwner ? (
                                <>
                                    <button className={styles.buyBtn} onClick={handlePay}>
                                        Buy Now
                                    </button>
                                    <button className={styles.offerBtn} onClick={() => setShowBidModal(true)}>
                                        Make Offer
                                    </button>
                                </>
                            ) : (
                                <div className={styles.ownerBadge}>
                                    This is your listing
                                </div>
                            )}
                        </div>

                        {/* Bid History */}
                        <div className={styles.bidHistory}>
                            <h3>Recent Bids</h3>
                            {mockBidHistory.length > 0 ? (
                                <div className={styles.bidList}>
                                    {mockBidHistory.map((bid, index) => (
                                        <div key={index} className={styles.bidItem}>
                                            <div className={styles.bidderInfo}>
                                                <span className={styles.bidderAvatar}>{bid.bidder[0].toUpperCase()}</span>
                                                <span className={styles.bidderName}>{bid.bidder}</span>
                                            </div>
                                            <div className={styles.bidDetails}>
                                                <span className={styles.bidAmount}>{bid.amount} USDC</span>
                                                <span className={styles.bidTime}>{bid.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.noBids}>No bids yet. Be the first!</p>
                            )}
                        </div>

                        {/* Details */}
                        <div className={styles.details}>
                            <h3>Details</h3>
                            <div className={styles.detailRow}>
                                <span>Listed</span>
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>Status</span>
                                <span className={styles.statusActive}>{item.status}</span>
                            </div>
                            {item.location && (
                                <div className={styles.detailRow}>
                                    <span>Location</span>
                                    <span>📍 Near you</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <BottomNav />

            {showBidModal && item && (
                <BidModal
                    listing={item}
                    onClose={() => setShowBidModal(false)}
                />
            )}
        </>
    );
}
