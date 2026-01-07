"use client";

import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import styles from "./ProfileStatus.module.css";

export default function ProfileStatus() {
    const { user, loading, createProfile, publicKey } = useUser();
    const [username, setUsername] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    if (!publicKey) {
        return <div className={styles.status}>Please connect your wallet.</div>;
    }

    if (loading) {
        return <div className={styles.status}>Loading profile...</div>;
    }

    if (user) {
        return (
            <div className={styles.profile}>
                <div className={styles.avatar} />
                <div className={styles.info}>
                    <span className={styles.name}>{user.username}</span>
                    <span className={styles.rep}>Rep: {user.reputation}</span>
                </div>
            </div>
        );
    }

    // User is connected but has no profile
    return (
        <div className={styles.createProfile}>
            <p>New here? Create a username:</p>
            <div className={styles.formRow}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="SwoleMaster99"
                    className={styles.input}
                />
                <button
                    onClick={() => {
                        setIsCreating(true);
                        createProfile(username).finally(() => setIsCreating(false));
                    }}
                    disabled={!username || isCreating}
                    className={styles.button}
                >
                    {isCreating ? "Creating..." : "Join"}
                </button>
            </div>
        </div>
    );
}
