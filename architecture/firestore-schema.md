# Merchplace Firestore Schema

> eBay-inspired database architecture for Firebase/Firestore with GCP backend.
> Optimized for fast reads with strategic denormalization.

---

## Collection Overview

```
├── users/{uid}                    # User profiles & settings
│   ├── /favorites/{listingId}     # Watchlist items
│   ├── /notifications/{notifId}   # In-app notifications
│   └── /addresses/{addressId}     # Shipping addresses
│
├── listings/{listingId}           # All marketplace listings
│   └── /bids/{bidId}              # Bid history per listing
│
├── orders/{orderId}               # Completed transactions
│
├── conversations/{conversationId} # Message threads
│   └── /messages/{messageId}      # Individual messages
│
└── reviews/{reviewId}             # Buyer/seller feedback
```

---

## Detailed Schema

### 1. Users Collection

**Path:** `users/{uid}`

```typescript
interface User {
  // Identity
  uid: string;                      // Firebase Auth UID (document ID)
  walletAddress: string;            // Solana wallet public key
  username: string;                 // Display name (unique)
  email?: string;                   // Optional email
  avatarUrl?: string;               // Profile picture URL
  bio?: string;                     // Profile description
  
  // Verification
  isVerified: boolean;              // KYC verified
  verifiedAt?: Timestamp;
  
  // Stats (denormalized for fast profile loads)
  stats: {
    totalListings: number;          // Active + sold
    totalSold: number;
    totalPurchased: number;
    totalEarnings: number;          // In USDC
    avgRating: number;              // 0-5 stars
    reviewCount: number;
  };
  
  // Settings
  settings: {
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
    currency: string;               // Display currency preference
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
}
```

---

### 1.1 User Favorites (Watchlist)

**Path:** `users/{uid}/favorites/{listingId}`

```typescript
interface Favorite {
  listingId: string;                // Reference to listing
  addedAt: Timestamp;
  
  // Denormalized listing snapshot (for fast watchlist display)
  listing: {
    title: string;
    imageUrl: string;
    currentPrice: number;
    status: 'active' | 'sold' | 'ended';
  };
  
  // Price tracking
  priceWhenAdded: number;
  notifyOnPriceDrop: boolean;
}
```

---

### 1.2 User Notifications

**Path:** `users/{uid}/notifications/{notificationId}`

```typescript
interface Notification {
  id: string;
  type: 'bid_received' | 'bid_outbid' | 'item_sold' | 'item_shipped' | 
        'message' | 'review' | 'price_drop' | 'listing_ending' | 'system';
  
  title: string;
  body: string;
  imageUrl?: string;
  
  // Reference data
  data: {
    listingId?: string;
    orderId?: string;
    conversationId?: string;
    senderId?: string;
  };
  
  isRead: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;            // Auto-delete old notifications
}
```

---

### 1.3 User Addresses

**Path:** `users/{uid}/addresses/{addressId}`

```typescript
interface Address {
  id: string;
  label: string;                    // "Home", "Work", etc.
  
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
```

---

### 2. Listings Collection

**Path:** `listings/{listingId}`

```typescript
interface Listing {
  id: string;
  
  // Seller info (denormalized)
  sellerId: string;                 // User UID
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  
  // Item details
  title: string;
  description: string;
  category: string;                 // "clothing", "shoes", "electronics", etc.
  subcategory?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  brand?: string;
  tags: string[];                   // For search
  
  // Media
  imageUrls: string[];              // Firebase Storage URLs
  videoUrl?: string;
  
  // Pricing
  listingType: 'auction' | 'fixed' | 'offer';
  startingPrice: number;            // In USDC
  buyNowPrice?: number;             // Instant purchase price
  reservePrice?: number;            // Minimum to sell (hidden)
  currentPrice: number;             // Highest bid or fixed price
  
  // Auction specific
  auction?: {
    endTime: Timestamp;
    bidCount: number;
    highestBidderId?: string;
    highestBidderName?: string;
    bidIncrement: number;           // Minimum bid increase
  };
  
  // Location
  location?: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
    accuracy: number;
  };
  
  // Shipping
  shipping: {
    type: 'free' | 'flat' | 'calculated' | 'pickup';
    cost?: number;
    estimatedDays?: number;
    carriers?: string[];
  };
  
  // Stats (denormalized)
  stats: {
    views: number;
    favorites: number;              // Watchlist count
    shares: number;
  };
  
  // Status
  status: 'draft' | 'active' | 'sold' | 'ended' | 'cancelled' | 'removed';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  soldAt?: Timestamp;
  
  // Search optimization
  searchKeywords: string[];         // Lowercased title/description tokens
}
```

---

### 2.1 Listing Bids

**Path:** `listings/{listingId}/bids/{bidId}`

```typescript
interface Bid {
  id: string;
  listingId: string;
  
  // Bidder info (denormalized)
  bidderId: string;
  bidderName: string;
  bidderAvatar?: string;
  
  amount: number;                   // In USDC
  maxBid?: number;                  // Auto-bid ceiling (private)
  
  status: 'active' | 'outbid' | 'won' | 'cancelled' | 'retracted';
  
  // Bid source
  isAutoBid: boolean;               // From proxy bidding
  
  createdAt: Timestamp;
}
```

---

### 3. Orders Collection

**Path:** `orders/{orderId}`

```typescript
interface Order {
  id: string;
  orderNumber: string;              // Human-readable (e.g., "MP-2026-001234")
  
  // Parties
  buyerId: string;
  buyerName: string;
  buyerWallet: string;
  
  sellerId: string;
  sellerName: string;
  sellerWallet: string;
  
  // Item (snapshot at purchase time)
  listing: {
    id: string;
    title: string;
    imageUrl: string;
    condition: string;
  };
  
  // Financials
  itemPrice: number;                // In USDC
  shippingCost: number;
  platformFee: number;              // Merchplace fee
  totalAmount: number;
  
  // Payment
  payment: {
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    method: 'usdc_solana';
    transactionSignature?: string;  // Solana tx signature
    paidAt?: Timestamp;
  };
  
  // Shipping
  shipping: {
    address: Address;               // Snapshot of delivery address
    status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'returned';
    carrier?: string;
    trackingNumber?: string;
    shippedAt?: Timestamp;
    deliveredAt?: Timestamp;
  };
  
  // Status
  status: 'pending_payment' | 'paid' | 'shipped' | 'delivered' | 
          'completed' | 'cancelled' | 'disputed' | 'refunded';
  
  // Reviews
  buyerReviewId?: string;
  sellerReviewId?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

---

### 4. Conversations Collection

**Path:** `conversations/{conversationId}`

```typescript
interface Conversation {
  id: string;
  
  // Participants
  participants: string[];           // [uid1, uid2]
  participantData: {
    [uid: string]: {
      name: string;
      avatar?: string;
    };
  };
  
  // Context
  listingId?: string;               // If about a specific item
  listingTitle?: string;
  listingImage?: string;
  orderId?: string;                 // If about an order
  
  // Last message preview
  lastMessage: {
    text: string;
    senderId: string;
    sentAt: Timestamp;
  };
  
  // Read status per participant
  readBy: {
    [uid: string]: Timestamp;       // Last read timestamp
  };
  
  // Unread counts (denormalized for badges)
  unreadCount: {
    [uid: string]: number;
  };
  
  // Status
  isArchived: {
    [uid: string]: boolean;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 4.1 Conversation Messages

**Path:** `conversations/{conversationId}/messages/{messageId}`

```typescript
interface Message {
  id: string;
  conversationId: string;
  
  senderId: string;
  senderName: string;
  
  // Content
  type: 'text' | 'image' | 'offer' | 'system';
  text?: string;
  imageUrl?: string;
  
  // For offer messages
  offer?: {
    amount: number;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    expiresAt: Timestamp;
  };
  
  // Metadata
  isEdited: boolean;
  isDeleted: boolean;               // Soft delete
  
  createdAt: Timestamp;
  editedAt?: Timestamp;
}
```

---

### 5. Reviews Collection

**Path:** `reviews/{reviewId}`

```typescript
interface Review {
  id: string;
  orderId: string;
  
  // Reviewer
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerRole: 'buyer' | 'seller';
  
  // Reviewed
  reviewedId: string;               // User being reviewed
  
  // Rating
  rating: number;                   // 1-5 stars
  
  // Detailed ratings (optional)
  ratings?: {
    communication: number;
    shipping: number;
    itemAsDescribed: number;
  };
  
  // Content
  title?: string;
  comment: string;
  
  // Response
  response?: {
    text: string;
    createdAt: Timestamp;
  };
  
  // Moderation
  isVerifiedPurchase: boolean;
  isHidden: boolean;                // Flagged/removed
  
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

---

## Indexes Required

```javascript
// Firestore composite indexes (firestore.indexes.json)

{
  "indexes": [
    // Listings by category + status + date
    {
      "collectionGroup": "listings",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // Listings by seller
    {
      "collectionGroup": "listings",
      "fields": [
        { "fieldPath": "sellerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // Orders by buyer
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "buyerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // Orders by seller
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "sellerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // Conversations by participant
    {
      "collectionGroup": "conversations",
      "fields": [
        { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    
    // Reviews by reviewed user
    {
      "collectionGroup": "reviews",
      "fields": [
        { "fieldPath": "reviewedId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Security Rules Overview

```javascript
// Key patterns for Firestore security rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - owner can read/write their own
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
      
      // Subcollections
      match /favorites/{docId} {
        allow read, write: if request.auth.uid == uid;
      }
      match /notifications/{docId} {
        allow read, write: if request.auth.uid == uid;
      }
      match /addresses/{docId} {
        allow read, write: if request.auth.uid == uid;
      }
    }
    
    // Listings - anyone can read, owner can write
    match /listings/{listingId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.sellerId;
      
      // Bids - authenticated users
      match /bids/{bidId} {
        allow read: if true;
        allow create: if request.auth != null;
      }
    }
    
    // Orders - buyer or seller can read
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.buyerId 
                  || request.auth.uid == resource.data.sellerId;
      allow create: if request.auth != null;
    }
    
    // Conversations - participants only
    match /conversations/{convoId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      
      match /messages/{msgId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(convoId)).data.participants;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(convoId)).data.participants;
      }
    }
    
    // Reviews - public read, verified purchase write
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

---

## Denormalization Strategy

| Data | Source | Copied To | Reason |
|------|--------|-----------|--------|
| User stats | Aggregated | `users/{uid}.stats` | Fast profile loads |
| Seller info | `users/{uid}` | `listings/{id}.seller*` | No join for feed cards |
| Listing snapshot | `listings/{id}` | `orders/{id}.listing` | Historical accuracy |
| Last message | `messages/{id}` | `conversations/{id}.lastMessage` | Inbox preview |
| Watch count | Count of favorites | `listings/{id}.stats.favorites` | Display social proof |

---

## GCP Services Integration

| Service | Use Case |
|---------|----------|
| **Firebase Auth** | Wallet-based auth (custom tokens) |
| **Firestore** | Primary database |
| **Firebase Storage** | Images, videos |
| **Cloud Functions** | Denormalization triggers, notifications |
| **Cloud Tasks** | Auction ending, scheduled jobs |
| **Pub/Sub** | Real-time bid updates |
| **Cloud Scheduler** | Cleanup expired listings |
