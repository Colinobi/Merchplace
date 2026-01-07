"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Listing } from "@/types/listing";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import Link from "next/link";
import styles from "./page.module.css";

type StatusFilter = "all" | "active" | "sold";

export default function SearchPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [priceRange, setPriceRange] = useState({ min: "", max: "" });

    useEffect(() => {
        const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Listing[] = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as Listing);
            });
            setListings(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredListings = useMemo(() => {
        return listings.filter((item) => {
            // Search query filter
            const matchesSearch = searchQuery === "" ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === "all" || item.status === statusFilter;

            // Price range filter
            const price = item.highestBid || item.startingPrice;
            const matchesMinPrice = priceRange.min === "" || price >= parseFloat(priceRange.min);
            const matchesMaxPrice = priceRange.max === "" || price <= parseFloat(priceRange.max);

            return matchesSearch && matchesStatus && matchesMinPrice && matchesMaxPrice;
        });
    }, [listings, searchQuery, statusFilter, priceRange]);

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setPriceRange({ min: "", max: "" });
    };

    const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || priceRange.min !== "" || priceRange.max !== "";

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.title}>Search</h1>

                    {/* Search Input */}
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                className={styles.clearSearch}
                                onClick={() => setSearchQuery("")}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <label>Status</label>
                            <div className={styles.filterPills}>
                                {(["all", "active", "sold"] as StatusFilter[]).map((status) => (
                                    <button
                                        key={status}
                                        className={`${styles.pill} ${statusFilter === status ? styles.pillActive : ""}`}
                                        onClick={() => setStatusFilter(status)}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <label>Price Range (USDC)</label>
                            <div className={styles.priceInputs}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                                    className={styles.priceInput}
                                />
                                <span className={styles.priceSeparator}>–</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                                    className={styles.priceInput}
                                />
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <button className={styles.clearFilters} onClick={clearFilters}>
                                Clear all filters
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div className={styles.results}>
                        <p className={styles.resultCount}>
                            {loading ? "Searching..." : `${filteredListings.length} item${filteredListings.length !== 1 ? "s" : ""} found`}
                        </p>

                        {!loading && filteredListings.length === 0 ? (
                            <div className={styles.noResults}>
                                <span className={styles.noResultsIcon}>🔍</span>
                                <p>No items match your search</p>
                                <button onClick={clearFilters}>Clear filters</button>
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {filteredListings.map((item) => (
                                    <Link href={`/item/${item.id}`} key={item.id} className={styles.cardLink}>
                                        <div className={styles.card}>
                                            <div className={styles.imageWrapper}>
                                                {item.imageUrls[0] && (
                                                    <img
                                                        src={item.imageUrls[0]}
                                                        alt={item.title}
                                                        className={styles.image}
                                                    />
                                                )}
                                                {item.status === "sold" && (
                                                    <div className={styles.soldBadge}>Sold</div>
                                                )}
                                            </div>
                                            <div className={styles.content}>
                                                <h3>{item.title}</h3>
                                                <span className={styles.price}>
                                                    {item.highestBid || item.startingPrice} USDC
                                                </span>
                                            </div>
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
