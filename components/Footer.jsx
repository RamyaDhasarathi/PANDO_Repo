import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`hp-container ${styles.grid}`}>
        <div>
          <div className={styles.brand}>
            <span className={styles.mark}>
              <Image src="/images/logo-mascot.png" alt="Hi Pando" width={28} height={28} />
            </span>
            Hi Pando
          </div>
          <p className={styles.tagline}>
            Discover, compare and enquire on homes across Dubai — no noise, no brokers in the way.
          </p>
        </div>
        <div>
          <div className={styles.colTitle}>Explore</div>
          <a className={styles.colLink} href="/search?purpose=sale">Buy</a>
          <a className={styles.colLink} href="/search?purpose=rent">Rent</a>
          <a className={styles.colLink} href="/search?type=Commercial">Commercial</a>
        </div>
        <div>
          <div className={styles.colTitle}>Company</div>
          <a className={styles.colLink} href="#">About Hi Pando</a>
          <a className={styles.colLink} href="#">Careers</a>
          <a className={styles.colLink} href="#">Contact</a>
        </div>
        <div>
          <div className={styles.colTitle}>Legal</div>
          <a className={styles.colLink} href="#">Privacy Policy</a>
          <a className={styles.colLink} href="#">Terms of Service</a>
        </div>
      </div>
      <div className={`hp-container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} Hi Pando. All rights reserved.</span>
        <span>Dubai, United Arab Emirates</span>
      </div>
    </footer>
  );
}
