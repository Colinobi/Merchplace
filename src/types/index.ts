import { Timestamp } from "firebase/firestore";

// ============================================
// USER TYPES
// ============================================

export interface UserStats {
    totalListings: number;
    totalSold: number;
    totalPurchased: number;
    totalEarnings: number;
    avgRating: number;
    reviewCount: number;
}

export interface UserSettings {
    notifications: {
        email: boolean;
        push: boolean;
        bidAlerts: boolean;
        messageAlerts: boolean;
        priceDropAlerts: boolean;
    };
    privacy: {
        showWalletAddress: boolean;
        showPurchaseHistory: boolean;
    };
    currency: string;
}

export interface User {
    uid: string;
    walletAddress: string;
    username: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;

    isVerified: boolean;
    verifiedAt?: Timestamp;

    stats: UserStats;
    settings: UserSettings;

    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastActiveAt: Timestamp;
}

// ============================================
// ADDRESS TYPES
// ============================================

export interface Address {
    id: string;
    label: string;
    fullName: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    isDefault: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================
// LISTING TYPES
// ============================================

export interface LocationData {
    lat: number;
    lng: number;
    accuracy: number;
    city?: string;
    country?: string;
}

export interface ListingAuction {
    endTime: Timestamp;
    bidCount: number;
    highestBidderId?: string;
    highestBidderName?: string;
    bidIncrement: number;
}

export interface ListingShipping {
    type: 'free' | 'flat' | 'calculated' | 'pickup';
    cost?: number;
    estimatedDays?: number;
    carriers?: string[];
}

export interface ListingStats {
    views: number;
    favorites: number;
    shares: number;
}

export type ListingType = 'auction' | 'fixed' | 'offer';
export type ListingStatus = 'draft' | 'active' | 'sold' | 'ended' | 'cancelled' | 'removed';
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export interface Listing {
    id: string;

    // Seller info (denormalized)
    sellerId: string;
    sellerName: string;
    sellerAvatar?: string;
    sellerRating: number;

    // Item details
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    condition: ItemCondition;
    brand?: string;
    tags: string[];

    // Media
    imageUrls: string[];
    videoUrl?: string;

    // Pricing
    listingType: ListingType;
    startingPrice: number;
    buyNowPrice?: number;
    reservePrice?: number;
    currentPrice: number;

    // Auction specific
    auction?: ListingAuction;

    // Location
    location?: LocationData;

    // Shipping
    shipping: ListingShipping;

    // Stats
    stats: ListingStats;

    // Status
    status: ListingStatus;

    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
    publishedAt?: Timestamp;
    soldAt?: Timestamp;

    // Search
    searchKeywords: string[];
}

// Legacy support - maps old format to new
export interface LegacyListing {
    id: string;
    sellerId: string;
    sellerName?: string;
    title: string;
    description: string;
    imageUrls: string[];
    startingPrice: number;
    endTime: number;
    createdAt: number;
    status: 'active' | 'sold' | 'cancelled';
    highestBid?: number;
    location?: LocationData;
}

// ============================================
// BID TYPES
// ============================================

export type BidStatus = 'active' | 'outbid' | 'won' | 'cancelled' | 'retracted';

export interface Bid {
    id: string;
    listingId: string;

    bidderId: string;
    bidderName: string;
    bidderAvatar?: string;

    amount: number;
    maxBid?: number;

    status: BidStatus;
    isAutoBid: boolean;

    createdAt: Timestamp;
}

// ============================================
// ORDER TYPES
// ============================================

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type ShippingStatus = 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed' | 'refunded';

export interface OrderPayment {
    status: PaymentStatus;
    method: 'usdc_solana';
    transactionSignature?: string;
    paidAt?: Timestamp;
}

export interface OrderShipping {
    address: Address;
    status: ShippingStatus;
    carrier?: string;
    trackingNumber?: string;
    shippedAt?: Timestamp;
    deliveredAt?: Timestamp;
}

export interface OrderListing {
    id: string;
    title: string;
    imageUrl: string;
    condition: string;
}

export interface Order {
    id: string;
    orderNumber: string;

    buyerId: string;
    buyerName: string;
    buyerWallet: string;

    sellerId: string;
    sellerName: string;
    sellerWallet: string;

    listing: OrderListing;

    itemPrice: number;
    shippingCost: number;
    platformFee: number;
    totalAmount: number;

    payment: OrderPayment;
    shipping: OrderShipping;

    status: OrderStatus;

    buyerReviewId?: string;
    sellerReviewId?: string;

    createdAt: Timestamp;
    updatedAt: Timestamp;
    completedAt?: Timestamp;
}

// ============================================
// CONVERSATION TYPES
// ============================================

export interface ConversationParticipant {
    name: string;
    avatar?: string;
}

export interface ConversationLastMessage {
    text: string;
    senderId: string;
    sentAt: Timestamp;
}

export interface Conversation {
    id: string;
    participants: string[];
    participantData: Record<string, ConversationParticipant>;

    listingId?: string;
    listingTitle?: string;
    listingImage?: string;
    orderId?: string;

    lastMessage: ConversationLastMessage;
    readBy: Record<string, Timestamp>;
    unreadCount: Record<string, number>;
    isArchived: Record<string, boolean>;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type MessageType = 'text' | 'image' | 'offer' | 'system';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface MessageOffer {
    amount: number;
    status: OfferStatus;
    expiresAt: Timestamp;
}

export interface Message {
    id: string;
    conversationId: string;

    senderId: string;
    senderName: string;

    type: MessageType;
    text?: string;
    imageUrl?: string;

    offer?: MessageOffer;

    isEdited: boolean;
    isDeleted: boolean;

    createdAt: Timestamp;
    editedAt?: Timestamp;
}

// ============================================
// REVIEW TYPES
// ============================================

export interface ReviewRatings {
    communication: number;
    shipping: number;
    itemAsDescribed: number;
}

export interface ReviewResponse {
    text: string;
    createdAt: Timestamp;
}

export interface Review {
    id: string;
    orderId: string;

    reviewerId: string;
    reviewerName: string;
    reviewerAvatar?: string;
    reviewerRole: 'buyer' | 'seller';

    reviewedId: string;

    rating: number;
    ratings?: ReviewRatings;

    title?: string;
    comment: string;

    response?: ReviewResponse;

    isVerifiedPurchase: boolean;
    isHidden: boolean;

    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
    | 'bid_received'
    | 'bid_outbid'
    | 'item_sold'
    | 'item_shipped'
    | 'message'
    | 'review'
    | 'price_drop'
    | 'listing_ending'
    | 'system';

export interface NotificationData {
    listingId?: string;
    orderId?: string;
    conversationId?: string;
    senderId?: string;
}

export interface Notification {
    id: string;
    type: NotificationType;

    title: string;
    body: string;
    imageUrl?: string;

    data: NotificationData;

    isRead: boolean;
    createdAt: Timestamp;
    expiresAt?: Timestamp;
}

// ============================================
// FAVORITE TYPES
// ============================================

export interface FavoriteListingSnapshot {
    title: string;
    imageUrl: string;
    currentPrice: number;
    status: ListingStatus;
}

export interface Favorite {
    listingId: string;
    addedAt: Timestamp;
    listing: FavoriteListingSnapshot;
    priceWhenAdded: number;
    notifyOnPriceDrop: boolean;
}
