import Navbar from "@/components/layout/Navbar";
import MarketplaceFeed from "@/components/listings/MarketplaceFeed";
import ProfileStatus from "@/components/layout/ProfileStatus";
import BottomNav from "@/components/layout/BottomNav";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Buy & Sell with <span>Crypto</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The marketplace where you pay with USDC on Solana.
            Fast, secure, and decentralized.
          </p>
          <div className={styles.heroActions}>
            <a href="/sell" className={styles.heroCta}>Start Selling</a>
            <a href="#browse" className={styles.heroSecondary}>Browse Items</a>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={styles.categories}>
        <div className={styles.container}>
          <div className={styles.categoryGrid}>
            <div className={styles.categoryCard}>
              <span className={styles.categoryIcon}>👕</span>
              <span>Clothing</span>
            </div>
            <div className={styles.categoryCard}>
              <span className={styles.categoryIcon}>👟</span>
              <span>Shoes</span>
            </div>
            <div className={styles.categoryCard}>
              <span className={styles.categoryIcon}>📱</span>
              <span>Electronics</span>
            </div>
            <div className={styles.categoryCard}>
              <span className={styles.categoryIcon}>🎨</span>
              <span>Art & Collectibles</span>
            </div>
            <div className={styles.categoryCard}>
              <span className={styles.categoryIcon}>🎮</span>
              <span>Gaming</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.main} id="browse">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Fresh Finds</h2>
            <p>Discover items just listed by sellers near you</p>
          </div>

          {/* Profile Status (shows wallet connection) */}
          <ProfileStatus />

          {/* Marketplace Feed */}
          <MarketplaceFeed />
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>🛍️ Merchplace</span>
              <p>Buy and sell with crypto, powered by Solana.</p>
            </div>
            <div className={styles.footerLinks}>
              <a href="#">About</a>
              <a href="#">Help</a>
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
    </>
  );
}
