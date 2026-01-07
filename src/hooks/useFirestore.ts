"use client";

import { useState, useEffect } from "react";
import {
    subscribeToListings,
    getListing,
    getListingBids,
    subscribeToUserConversations,
    subscribeToMessages,
    subscribeToNotifications,
    getUserFavorites,
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    getUserOrders
} from "@/lib/firebase/db";
import type {
    Listing,
    Bid,
    Conversation,
    Message,
    Notification,
    Favorite,
    Order
} from "@/types";

// ============================================
// LISTINGS HOOKS
// ============================================

export function useListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToListings((data) => {
            setListings(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { listings, loading, error };
}

export function useListing(id: string | null) {
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        getListing(id)
            .then(setListing)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [id]);

    return { listing, loading, error };
}

export function useListingBids(listingId: string | null) {
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!listingId) {
            setLoading(false);
            return;
        }

        getListingBids(listingId)
            .then(setBids)
            .finally(() => setLoading(false));
    }, [listingId]);

    return { bids, loading };
}

// ============================================
// CONVERSATIONS HOOKS
// ============================================

export function useConversations(uid: string | null) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToUserConversations(uid, (data) => {
            setConversations(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [uid]);

    const unreadCount = conversations.reduce((sum, convo) => {
        return sum + (convo.unreadCount[uid || ""] || 0);
    }, 0);

    return { conversations, loading, unreadCount };
}

export function useMessages(conversationId: string | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!conversationId) {
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToMessages(conversationId, (data) => {
            setMessages(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [conversationId]);

    return { messages, loading };
}

// ============================================
// NOTIFICATIONS HOOKS
// ============================================

export function useNotifications(uid: string | null) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToNotifications(uid, (data) => {
            setNotifications(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [uid]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return { notifications, loading, unreadCount };
}

// ============================================
// FAVORITES HOOKS
// ============================================

export function useFavorites(uid: string | null) {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        getUserFavorites(uid)
            .then(setFavorites)
            .finally(() => setLoading(false));
    }, [uid]);

    const refresh = async () => {
        if (uid) {
            const data = await getUserFavorites(uid);
            setFavorites(data);
        }
    };

    return { favorites, loading, refresh };
}

export function useFavorite(uid: string | null, listingId: string) {
    const [isFav, setIsFav] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        isFavorited(uid, listingId)
            .then(setIsFav)
            .finally(() => setLoading(false));
    }, [uid, listingId]);

    const toggle = async (listing: Listing) => {
        if (!uid) return;

        if (isFav) {
            await removeFromFavorites(uid, listingId);
            setIsFav(false);
        } else {
            await addToFavorites(uid, listing);
            setIsFav(true);
        }
    };

    return { isFavorited: isFav, loading, toggle };
}

// ============================================
// ORDERS HOOKS
// ============================================

export function useOrders(uid: string | null, role: 'buyer' | 'seller' = 'buyer') {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        getUserOrders(uid, role)
            .then(setOrders)
            .finally(() => setLoading(false));
    }, [uid, role]);

    return { orders, loading };
}
