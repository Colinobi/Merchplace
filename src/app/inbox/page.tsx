"use client";

import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import styles from "./page.module.css";

export default function InboxPage() {
    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.placeholder}>
                        <div className={styles.iconWrapper}>
                            <span className={styles.icon}>💬</span>
                        </div>
                        <h1>Messages Coming Soon</h1>
                        <p>
                            We&apos;re working on a secure messaging system so you can chat
                            directly with buyers and sellers.
                        </p>

                        {/* Teaser UI */}
                        <div className={styles.preview}>
                            <div className={styles.previewHeader}>
                                <span className={styles.previewDot}></span>
                                <span className={styles.previewDot}></span>
                                <span className={styles.previewDot}></span>
                            </div>
                            <div className={styles.previewContent}>
                                <div className={styles.mockConvo}>
                                    <div className={`${styles.mockMsg} ${styles.mockMsgReceived}`}>
                                        <span className={styles.mockAvatar}>🛒</span>
                                        <div className={styles.mockBubble}>
                                            Hey, is this still available?
                                        </div>
                                    </div>
                                    <div className={`${styles.mockMsg} ${styles.mockMsgSent}`}>
                                        <div className={styles.mockBubble}>
                                            Yes! Want to make an offer?
                                        </div>
                                    </div>
                                    <div className={`${styles.mockMsg} ${styles.mockMsgReceived}`}>
                                        <span className={styles.mockAvatar}>🛒</span>
                                        <div className={styles.mockBubble}>
                                            Sounds good! 🤝
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <span>🔒</span>
                                <span>End-to-end encrypted</span>
                            </div>
                            <div className={styles.feature}>
                                <span>⚡</span>
                                <span>Real-time messaging</span>
                            </div>
                            <div className={styles.feature}>
                                <span>📱</span>
                                <span>Push notifications</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <BottomNav />
        </>
    );
}
