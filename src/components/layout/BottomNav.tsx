"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: "🏠", label: "Home" },
        { href: "/search", icon: "🔍", label: "Search" },
        { href: "/sell", icon: "➕", label: "Sell", isCenter: true },
        { href: "/inbox", icon: "💬", label: "Inbox" },
        { href: "/profile", icon: "👤", label: "Profile" },
    ];

    return (
        <nav className={styles.bottomNav}>
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${pathname === item.href ? styles.active : ""} ${item.isCenter ? styles.centerBtn : ""}`}
                >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.label}>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
