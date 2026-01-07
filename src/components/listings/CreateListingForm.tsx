"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { storage } from "@/lib/firebase/config";
import { createListing } from "@/lib/firebase/db";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import styles from "./CreateListingForm.module.css";
import type { ListingType, ItemCondition } from "@/types";
import { Timestamp } from "firebase/firestore";

export default function CreateListingForm() {
    const { user, publicKey } = useUser();
    const router = useRouter();

    // Basic info
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("clothing");
    const [condition, setCondition] = useState<ItemCondition>("good");
    const [listingType, setListingType] = useState<ListingType>("fixed");

    // Images
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // Shipping
    const [shippingType, setShippingType] = useState<'free' | 'flat' | 'pickup'>('free');
    const [shippingCost, setShippingCost] = useState("");

    // State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files]);

            // Create previews
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreviews(prev => [...prev, e.target?.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !publicKey) {
            setError("You must be logged in to create a listing.");
            return;
        }
        if (imageFiles.length === 0) {
            setError("Please include at least one image of your item.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Upload all images
            const imageUrls: string[] = [];
            for (const file of imageFiles) {
                const storageRef = ref(storage, `listings/${publicKey.toBase58()}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                imageUrls.push(downloadURL);
            }

            // 2. Create listing with new schema
            const priceValue = parseFloat(price);

            await createListing({
                sellerId: publicKey.toBase58(),
                sellerName: user.username || "Anonymous",
                sellerRating: 5.0,

                title,
                description,
                category,
                condition,
                tags: title.toLowerCase().split(" "),
                brand: undefined,

                imageUrls,

                listingType,
                startingPrice: priceValue,
                buyNowPrice: listingType === 'fixed' ? priceValue : undefined,
                currentPrice: priceValue,

                auction: listingType === 'auction' ? {
                    endTime: Timestamp.fromMillis(Date.now() + (7 * 24 * 60 * 60 * 1000)),
                    bidCount: 0,
                    bidIncrement: Math.max(1, Math.floor(priceValue * 0.05))
                } : undefined,

                shipping: {
                    type: shippingType,
                    cost: shippingType === 'flat' ? parseFloat(shippingCost) : undefined,
                    estimatedDays: shippingType === 'pickup' ? undefined : 5
                },

                stats: {
                    views: 0,
                    favorites: 0,
                    shares: 0
                },

                status: 'active',
                publishedAt: Timestamp.now(),
                searchKeywords: [
                    ...title.toLowerCase().split(" "),
                    category.toLowerCase(),
                    condition.toLowerCase()
                ]
            });

            // 3. Redirect
            router.push("/");
        } catch (err: unknown) {
            console.error("Error creating listing:", err);
            setError("Failed to create listing: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!publicKey) {
        return <p className={styles.warning}>Please connect your wallet to sell items.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h2>List an Item</h2>

            {error && <div className={styles.error}>{error}</div>}

            {/* Title */}
            <div className={styles.group}>
                <label>Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Vintage Solana Hoodie"
                />
            </div>

            {/* Category & Condition */}
            <div className={styles.row}>
                <div className={styles.group}>
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="clothing">Clothing</option>
                        <option value="shoes">Shoes</option>
                        <option value="electronics">Electronics</option>
                        <option value="art">Art & Collectibles</option>
                        <option value="gaming">Gaming</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className={styles.group}>
                    <label>Condition</label>
                    <select value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)}>
                        <option value="new">New</option>
                        <option value="like_new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                    </select>
                </div>
            </div>

            {/* Listing Type */}
            <div className={styles.group}>
                <label>Listing Type</label>
                <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="listingType"
                            value="fixed"
                            checked={listingType === 'fixed'}
                            onChange={() => setListingType('fixed')}
                        />
                        <span>Fixed Price</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="listingType"
                            value="auction"
                            checked={listingType === 'auction'}
                            onChange={() => setListingType('auction')}
                        />
                        <span>Auction</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="listingType"
                            value="offer"
                            checked={listingType === 'offer'}
                            onChange={() => setListingType('offer')}
                        />
                        <span>Best Offer</span>
                    </label>
                </div>
            </div>

            {/* Price */}
            <div className={styles.group}>
                <label>{listingType === 'auction' ? 'Starting Price (USDC)' : 'Price (USDC)'}</label>
                <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="50"
                    step="0.01"
                    min="0.01"
                />
            </div>

            {/* Description */}
            <div className={styles.group}>
                <label>Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe your item..."
                />
            </div>

            {/* Images */}
            <div className={styles.group}>
                <label>Images</label>
                <div className={styles.imageUpload}>
                    {imagePreviews.map((preview, index) => (
                        <div key={index} className={styles.imagePreview}>
                            <img src={preview} alt={`Preview ${index + 1}`} />
                            <button
                                type="button"
                                className={styles.removeImage}
                                onClick={() => removeImage(index)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <label className={styles.addImage}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            multiple
                        />
                        <span>+ Add Photo</span>
                    </label>
                </div>
            </div>

            {/* Shipping */}
            <div className={styles.group}>
                <label>Shipping</label>
                <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="shipping"
                            value="free"
                            checked={shippingType === 'free'}
                            onChange={() => setShippingType('free')}
                        />
                        <span>Free Shipping</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="shipping"
                            value="flat"
                            checked={shippingType === 'flat'}
                            onChange={() => setShippingType('flat')}
                        />
                        <span>Flat Rate</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="shipping"
                            value="pickup"
                            checked={shippingType === 'pickup'}
                            onChange={() => setShippingType('pickup')}
                        />
                        <span>Local Pickup</span>
                    </label>
                </div>
                {shippingType === 'flat' && (
                    <input
                        type="number"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        placeholder="Shipping cost (USDC)"
                        step="0.01"
                        min="0"
                        className={styles.shippingCost}
                    />
                )}
            </div>

            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                {isSubmitting ? "Creating..." : "List Item"}
            </button>
        </form>
    );
}
