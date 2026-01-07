export interface LocationData {
    lat: number;
    lng: number;
    accuracy: number;
}

export interface Listing {
    id: string;
    sellerId: string;
    sellerName?: string;
    title: string;
    description: string;
    imageUrls: string[];
    startingPrice: number;
    endTime: number; // Timestamp
    createdAt: number;
    status: 'active' | 'sold' | 'cancelled';
    highestBid?: number;
    location?: LocationData;
}
