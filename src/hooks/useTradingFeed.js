import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

const FEEDS = ['snapshot', 'trades', 'history', 'runs'];

const toDate = (value) => (value && typeof value.toDate === 'function' ? value.toDate() : value ?? null);

const withDates = (data, keys) => {
  const out = { ...data };
  keys.forEach((key) => {
    out[key] = toDate(data[key]);
  });
  return out;
};

export default function useTradingFeed() {
  const [state, setState] = useState({
    snapshot: null,
    trades: [],
    history: [],
    runs: [],
    error: null,
  });
  const [received, setReceived] = useState(() => new Set());

  useEffect(() => {
    const markReceived = (feed) =>
      setReceived((prev) => (prev.has(feed) ? prev : new Set(prev).add(feed)));
    const onError = (error) => setState((prev) => ({ ...prev, error }));
    const listDocs = (snap, dateKeys) => snap.docs.map((d) => ({ id: d.id, ...withDates(d.data(), dateKeys) }));

    const unsubscribers = [
      onSnapshot(
        doc(db, 'public_snapshot', 'current'),
        (snap) => {
          setState((prev) => ({ ...prev, snapshot: snap.exists() ? withDates(snap.data(), ['updated_at']) : null }));
          markReceived('snapshot');
        },
        onError,
      ),
      onSnapshot(
        query(collection(db, 'public_trades'), orderBy('submitted_at', 'desc'), limit(50)),
        (snap) => {
          setState((prev) => ({
            ...prev,
            trades: listDocs(snap, ['submitted_at', 'updated_at', 'filled_at']),
          }));
          markReceived('trades');
        },
        onError,
      ),
      onSnapshot(
        query(collection(db, 'public_equity_history'), orderBy('date', 'desc'), limit(365)),
        (snap) => {
          setState((prev) => ({ ...prev, history: listDocs(snap, ['updated_at']).reverse() }));
          markReceived('history');
        },
        onError,
      ),
      onSnapshot(
        query(collection(db, 'public_runs'), orderBy('started_at', 'desc'), limit(10)),
        (snap) => {
          setState((prev) => ({ ...prev, runs: listDocs(snap, ['started_at']) }));
          markReceived('runs');
        },
        onError,
      ),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const loading = !state.error && FEEDS.some((feed) => !received.has(feed));
  return { ...state, loading };
}
