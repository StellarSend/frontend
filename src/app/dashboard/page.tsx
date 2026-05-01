'use client';
import Link from 'next/link';
import { useWallet }  from '@/context/WalletContext';
import { useStreams }  from '@/hooks/useStreams';
import { StreamCard } from '@/components/molecules/StreamCard';
import styles         from './dashboard.module.css';

export default function Dashboard() {
  const { address, connect } = useWallet();
  const { streams, loading, error, refetch } = useStreams(address);

  if (!address) {
    return (
      <div className={styles.empty}>
        <p>Connect your wallet to view your streams.</p>
        <button className={styles.connectBtn} onClick={connect}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>My Streams</h1>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={refetch} disabled={loading}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
          <Link href="/create" className={styles.newBtn}>+ New Stream</Link>
        </div>
      </header>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {loading && streams.length === 0 ? (
        <div className={styles.skeleton}>
          {[0,1,2].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
      ) : streams.length === 0 ? (
        <div className={styles.noStreams}>
          <p>No streams yet.</p>
          <Link href="/create" className={styles.newBtn}>Create your first stream →</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {streams.map(s => (
            <StreamCard
              key={s.id}
              id={s.id}
              recipient={s.recipient}
              token={s.token}
              ratePerSecond={BigInt(s.ratePerSecond)}
              startTime={s.startTime}
              stopTime={s.stopTime}
              withdrawn={BigInt(s.withdrawn)}
              cancelled={s.status === 'cancelled'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
