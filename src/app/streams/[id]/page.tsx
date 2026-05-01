'use client';
import { useParams, useRouter } from 'next/navigation';
import { useStream }          from '@/hooks/useStreams';
import { useWallet }          from '@/context/WalletContext';
import { useStreamBalance }   from '@/hooks/useStreamBalance';
import styles                 from './stream.module.css';

function fmt(stroops: bigint): string {
  return (Number(stroops) / 1e7).toFixed(7);
}

export default function StreamDetail() {
  const { id }                     = useParams<{ id: string }>();
  const router                     = useRouter();
  const { address }                = useWallet();
  const { stream, loading, error } = useStream(id);

  const balance = useStreamBalance(
    stream ? BigInt(stream.ratePerSecond) : 0n,
    stream ? BigInt(stream.withdrawn)     : 0n,
    stream?.startTime ?? 0,
    stream?.stopTime  ?? 0,
  );

  if (loading) return <div className={styles.loading}>Loading stream…</div>;
  if (error || !stream) return (
    <div className={styles.notFound}>
      <p>{error ?? 'Stream not found.'}</p>
      <button onClick={() => router.back()} className={styles.backBtn}>← Go back</button>
    </div>
  );

  const isSender    = address === stream.sender;
  const isRecipient = address === stream.recipient;
  const isActive    = stream.status === 'active';
  const perDay      = (Number(stream.ratePerSecond) * 86400 / 1e7).toFixed(4);

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
      <h1 className={styles.title}>Stream #{stream.id}</h1>

      <div className={styles.balanceCard}>
        <p className={styles.balanceLabel}>Withdrawable Balance</p>
        <p className={styles.balanceValue}>{fmt(balance)} XLM</p>
        <p className={styles.balanceRate}>{perDay} XLM/day</p>
      </div>

      <div className={styles.details}>
        {[
          ['From',   `${stream.sender.slice(0,6)}...${stream.sender.slice(-4)}`],
          ['To',     `${stream.recipient.slice(0,6)}...${stream.recipient.slice(-4)}`],
          ['Token',  stream.token === 'native' ? 'XLM (Native)' : stream.token],
          ['Status', stream.status.charAt(0).toUpperCase() + stream.status.slice(1)],
          ['TX',     `${stream.txHash.slice(0,10)}...`],
        ].map(([k, v]) => (
          <div key={k} className={styles.detailRow}>
            <span className={styles.detailKey}>{k}</span>
            <span className={styles.detailVal}>{v}</span>
          </div>
        ))}
      </div>

      {isActive && (
        <div className={styles.actions}>
          {isRecipient && (
            <button
              className={styles.btnWithdraw}
              disabled={balance === 0n}
              title={balance === 0n ? 'Nothing to withdraw yet' : undefined}
            >
              Withdraw {fmt(balance)} XLM
            </button>
          )}
          {isSender && (
            <button className={styles.btnCancel}>Cancel Stream</button>
          )}
          {!isSender && !isRecipient && (
            <p className={styles.notParty}>Connect the sender or recipient wallet to take action.</p>
          )}
        </div>
      )}
    </div>
  );
}
