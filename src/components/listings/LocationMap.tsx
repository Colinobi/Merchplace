"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Listing } from "@/types/listing";
import L from "leaflet";
import styles from "./LocationMap.module.css";

// Fix for Leaflet default icon not found
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
    listings: Listing[];
}

export default function LocationMap({ listings }: LocationMapProps) {
    // Center map on first listing with location, or default to London/World
    const firstWithLoc = listings.find(l => l.location);
    const center: [number, number] = firstWithLoc
        ? [firstWithLoc.location!.lat, firstWithLoc.location!.lng]
        : [51.505, -0.09]; // Default fallback

    const listingsWithLocation = listings.filter(l => l.location);

    if (listingsWithLocation.length === 0) {
        return null; // Don't show map if no locations
    }

    return (
        <div className={styles.mapContainer}>
            <MapContainer center={center} zoom={3} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {listingsWithLocation.map((item) => (
                    <Marker
                        key={item.id}
                        position={[item.location!.lat, item.location!.lng]}
                    >
                        <Popup>
                            <div className={styles.popup}>
                                <b>{item.title}</b><br />
                                {item.startingPrice} USDC<br />
                                @{item.sellerName}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
