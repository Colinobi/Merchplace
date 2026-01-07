import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp,
    writeBatch,
    increment,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./config";
import type {
    User,
    Listing,
    Order,
    Conversation,
    Message,
    Review,
    Bid,
    Favorite,
    Notification,
    Address
} from "@/types";

// ============================================
// USER OPERATIONS
// ============================================

export const usersRef = collection(db, "users");

export async function getUser(uid: string): Promise<User | null> {
    const docSnap = await getDoc(doc(db, "users", uid));
    return docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } as User : null;
}

export async function createUser(uid: string, data: Partial<User>): Promise<void> {
    const defaultUser: Partial<User> = {
        uid,
        stats: {
            totalListings: 0,
            totalSold: 0,
            totalPurchased: 0,
            totalEarnings: 0,
            avgRating: 0,
            reviewCount: 0
        },
        settings: {
            notifications: {
                email: true,
                push: true,
                bidAlerts: true,
                messageAlerts: true,
                priceDropAlerts: true
            },
            privacy: {
                showWalletAddress: false,
                showPurchaseHistory: false
            },
            currency: "USDC"
        },
        isVerified: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        ...data
    };

    await setDoc(doc(db, "users", uid), defaultUser);
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, "users", uid), {
        ...data,
        updatedAt: serverTimestamp()
    });
}

export function subscribeToUser(uid: string, callback: (user: User | null) => void) {
    return onSnapshot(doc(db, "users", uid), (docSnap) => {
        callback(docSnap.exists() ? { uid: docSnap.id, ...docSnap.data() } as User : null);
    });
}

// ============================================
// LISTING OPERATIONS
// ============================================

export const listingsRef = collection(db, "listings");

export async function getListing(id: string): Promise<Listing | null> {
    const docSnap = await getDoc(doc(db, "listings", id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Listing : null;
}

export async function getListings(options?: {
    category?: string;
    status?: string;
    sellerId?: string;
    limitCount?: number;
}): Promise<Listing[]> {
    let q = query(listingsRef, orderBy("createdAt", "desc"));

    if (options?.category) {
        q = query(q, where("category", "==", options.category));
    }
    if (options?.status) {
        q = query(q, where("status", "==", options.status));
    }
    if (options?.sellerId) {
        q = query(q, where("sellerId", "==", options.sellerId));
    }
    if (options?.limitCount) {
        q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Listing);
}

export async function createListing(data: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(listingsRef);
    const listing: Partial<Listing> = {
        ...data,
        id: docRef.id,
        stats: { views: 0, favorites: 0, shares: 0 },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };

    await setDoc(docRef, listing);

    // Update user stats
    await updateDoc(doc(db, "users", data.sellerId), {
        "stats.totalListings": increment(1)
    });

    return docRef.id;
}

export async function updateListing(id: string, data: Partial<Listing>): Promise<void> {
    await updateDoc(doc(db, "listings", id), {
        ...data,
        updatedAt: serverTimestamp()
    });
}

export function subscribeToListings(callback: (listings: Listing[]) => void) {
    const q = query(listingsRef, where("status", "==", "active"), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Listing);
        callback(listings);
    });
}

export async function incrementListingViews(id: string): Promise<void> {
    await updateDoc(doc(db, "listings", id), {
        "stats.views": increment(1)
    });
}

// ============================================
// BID OPERATIONS
// ============================================

export async function placeBid(listingId: string, bid: Omit<Bid, 'id' | 'createdAt'>): Promise<string> {
    const bidsRef = collection(db, "listings", listingId, "bids");
    const docRef = doc(bidsRef);

    const newBid: Partial<Bid> = {
        ...bid,
        id: docRef.id,
        listingId,
        createdAt: Timestamp.now()
    };

    const batch = writeBatch(db);

    // Add bid
    batch.set(docRef, newBid);

    // Update listing
    batch.update(doc(db, "listings", listingId), {
        currentPrice: bid.amount,
        "auction.bidCount": increment(1),
        "auction.highestBidderId": bid.bidderId,
        "auction.highestBidderName": bid.bidderName
    });

    await batch.commit();

    return docRef.id;
}

export async function getListingBids(listingId: string): Promise<Bid[]> {
    const bidsRef = collection(db, "listings", listingId, "bids");
    const q = query(bidsRef, orderBy("amount", "desc"), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Bid);
}

// ============================================
// ORDER OPERATIONS
// ============================================

export const ordersRef = collection(db, "orders");

export async function createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(ordersRef);
    const orderNumber = `MP-${new Date().getFullYear()}-${docRef.id.slice(0, 6).toUpperCase()}`;

    const order: Partial<Order> = {
        ...data,
        id: docRef.id,
        orderNumber,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };

    await setDoc(docRef, order);
    return docRef.id;
}

export async function getUserOrders(uid: string, role: 'buyer' | 'seller'): Promise<Order[]> {
    const field = role === 'buyer' ? 'buyerId' : 'sellerId';
    const q = query(ordersRef, where(field, "==", uid), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: serverTimestamp()
    });
}

// ============================================
// CONVERSATION OPERATIONS
// ============================================

export const conversationsRef = collection(db, "conversations");

export async function getOrCreateConversation(
    participant1: { uid: string; name: string; avatar?: string },
    participant2: { uid: string; name: string; avatar?: string },
    context?: { listingId?: string; listingTitle?: string; listingImage?: string }
): Promise<string> {
    // Check if conversation exists
    const q = query(
        conversationsRef,
        where("participants", "array-contains", participant1.uid)
    );
    const snapshot = await getDocs(q);

    const existing = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(participant2.uid);
    });

    if (existing) return existing.id;

    // Create new conversation
    const docRef = doc(conversationsRef);
    const conversation: Partial<Conversation> = {
        id: docRef.id,
        participants: [participant1.uid, participant2.uid],
        participantData: {
            [participant1.uid]: { name: participant1.name, avatar: participant1.avatar },
            [participant2.uid]: { name: participant2.name, avatar: participant2.avatar }
        },
        listingId: context?.listingId,
        listingTitle: context?.listingTitle,
        listingImage: context?.listingImage,
        lastMessage: {
            text: "",
            senderId: "",
            sentAt: Timestamp.now()
        },
        readBy: {},
        unreadCount: { [participant1.uid]: 0, [participant2.uid]: 0 },
        isArchived: { [participant1.uid]: false, [participant2.uid]: false },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };

    await setDoc(docRef, conversation);
    return docRef.id;
}

export async function sendMessage(conversationId: string, message: Omit<Message, 'id' | 'createdAt'>): Promise<string> {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const docRef = doc(messagesRef);

    const newMessage: Partial<Message> = {
        ...message,
        id: docRef.id,
        conversationId,
        createdAt: Timestamp.now()
    };

    const batch = writeBatch(db);

    // Add message
    batch.set(docRef, newMessage);

    // Update conversation
    const convoDoc = await getDoc(doc(db, "conversations", conversationId));
    const convoData = convoDoc.data() as Conversation;
    const otherParticipant = convoData.participants.find(p => p !== message.senderId);

    batch.update(doc(db, "conversations", conversationId), {
        lastMessage: {
            text: message.text || (message.type === 'offer' ? 'Made an offer' : 'Sent an image'),
            senderId: message.senderId,
            sentAt: Timestamp.now()
        },
        [`unreadCount.${otherParticipant}`]: increment(1),
        updatedAt: serverTimestamp()
    });

    await batch.commit();
    return docRef.id;
}

export function subscribeToUserConversations(uid: string, callback: (conversations: Conversation[]) => void) {
    const q = query(
        conversationsRef,
        where("participants", "array-contains", uid),
        orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Conversation);
        callback(conversations);
    });
}

export function subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);
        callback(messages);
    });
}

// ============================================
// FAVORITES OPERATIONS
// ============================================

export async function addToFavorites(uid: string, listing: Listing): Promise<void> {
    const favoriteData: Favorite = {
        listingId: listing.id,
        addedAt: Timestamp.now(),
        listing: {
            title: listing.title,
            imageUrl: listing.imageUrls[0] || "",
            currentPrice: listing.currentPrice,
            status: listing.status
        },
        priceWhenAdded: listing.currentPrice,
        notifyOnPriceDrop: false
    };

    const batch = writeBatch(db);

    batch.set(doc(db, "users", uid, "favorites", listing.id), favoriteData);
    batch.update(doc(db, "listings", listing.id), {
        "stats.favorites": increment(1)
    });

    await batch.commit();
}

export async function removeFromFavorites(uid: string, listingId: string): Promise<void> {
    const batch = writeBatch(db);

    batch.delete(doc(db, "users", uid, "favorites", listingId));
    batch.update(doc(db, "listings", listingId), {
        "stats.favorites": increment(-1)
    });

    await batch.commit();
}

export async function getUserFavorites(uid: string): Promise<Favorite[]> {
    const favoritesRef = collection(db, "users", uid, "favorites");
    const snapshot = await getDocs(query(favoritesRef, orderBy("addedAt", "desc")));
    return snapshot.docs.map(doc => doc.data() as Favorite);
}

export async function isFavorited(uid: string, listingId: string): Promise<boolean> {
    const docSnap = await getDoc(doc(db, "users", uid, "favorites", listingId));
    return docSnap.exists();
}

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export async function createNotification(uid: string, notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    const notificationsRef = collection(db, "users", uid, "notifications");
    const docRef = doc(notificationsRef);

    await setDoc(docRef, {
        ...notification,
        id: docRef.id,
        isRead: false,
        createdAt: Timestamp.now()
    });
}

export function subscribeToNotifications(uid: string, callback: (notifications: Notification[]) => void) {
    const notificationsRef = collection(db, "users", uid, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"), limit(50));

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => doc.data() as Notification);
        callback(notifications);
    });
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
    await updateDoc(doc(db, "users", uid, "notifications", notificationId), {
        isRead: true
    });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
    const notificationsRef = collection(db, "users", uid, "notifications");
    const q = query(notificationsRef, where("isRead", "==", false));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
}

// ============================================
// REVIEW OPERATIONS
// ============================================

export const reviewsRef = collection(db, "reviews");

export async function createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(reviewsRef);

    const newReview: Partial<Review> = {
        ...review,
        id: docRef.id,
        createdAt: Timestamp.now()
    };

    const batch = writeBatch(db);

    // Add review
    batch.set(docRef, newReview);

    // Update user stats (would need to recalculate average)
    batch.update(doc(db, "users", review.reviewedId), {
        "stats.reviewCount": increment(1)
    });

    await batch.commit();
    return docRef.id;
}

export async function getUserReviews(uid: string): Promise<Review[]> {
    const q = query(reviewsRef, where("reviewedId", "==", uid), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Review);
}

// ============================================
// ADDRESS OPERATIONS
// ============================================

export async function getUserAddresses(uid: string): Promise<Address[]> {
    const addressesRef = collection(db, "users", uid, "addresses");
    const snapshot = await getDocs(addressesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Address);
}

export async function addAddress(uid: string, address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const addressesRef = collection(db, "users", uid, "addresses");
    const docRef = doc(addressesRef);

    await setDoc(docRef, {
        ...address,
        id: docRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });

    return docRef.id;
}

export async function updateAddress(uid: string, addressId: string, data: Partial<Address>): Promise<void> {
    await updateDoc(doc(db, "users", uid, "addresses", addressId), {
        ...data,
        updatedAt: serverTimestamp()
    });
}

export async function deleteAddress(uid: string, addressId: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid, "addresses", addressId));
}
