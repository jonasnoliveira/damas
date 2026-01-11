'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to game page after animation
    const timer = setTimeout(() => {
      router.push('/game');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className={styles.container}>
      <motion.div
        className={styles.splash}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={styles.logo}
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          {/* Animated Pieces */}
          <div className={styles.pieces}>
            <motion.div
              className={`${styles.piece} ${styles.pieceWhite}`}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            />
            <motion.div
              className={`${styles.piece} ${styles.pieceBlack}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
            />
          </div>
        </motion.div>

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Damas Brasileiras
        </motion.h1>

        <motion.div
          className={styles.loader}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className={styles.loaderDot} />
          <div className={styles.loaderDot} />
          <div className={styles.loaderDot} />
        </motion.div>
      </motion.div>
    </main>
  );
}
