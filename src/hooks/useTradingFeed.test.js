import { act, renderHook } from '@testing-library/react';
import { onSnapshot } from 'firebase/firestore';
import useTradingFeed from './useTradingFeed';

jest.mock('../lib/firebase', () => ({ db: {} }));

jest.mock('firebase/firestore', () => ({
  doc: (db, ...path) => ({ path: path.join('/') }),
  collection: (db, name) => ({ path: name }),
  query: (ref, ...constraints) => ({ path: ref.path, constraints }),
  orderBy: (field, direction = 'asc') => ({ orderBy: field, direction }),
  limit: (n) => ({ limit: n }),
  onSnapshot: jest.fn(),
}));

const timestamp = (iso) => ({ toDate: () => new Date(iso) });

let listeners;
let unsubscribes;

beforeEach(() => {
  listeners = {};
  unsubscribes = [];
  onSnapshot.mockImplementation((ref, onNext, onError) => {
    listeners[ref.path] = { ref, onNext, onError };
    const unsubscribe = jest.fn();
    unsubscribes.push(unsubscribe);
    return unsubscribe;
  });
});

const docSnap = (data) => ({ exists: () => data !== null, data: () => data });
const querySnap = (docs) => ({ docs: docs.map(({ id, ...data }) => ({ id, data: () => data })) });

function deliverAll() {
  act(() => {
    listeners['public_snapshot/current'].onNext(
      docSnap({ equity_usd: 15.2, updated_at: timestamp('2026-11-18T15:00:00Z') }),
    );
    listeners.public_trades.onNext(
      querySnap([{ id: 'o1', symbol: 'AAPL', submitted_at: timestamp('2026-11-18T14:00:00Z'), filled_at: null }]),
    );
    listeners.public_equity_history.onNext(querySnap([{ id: '2026-11-18', date: '2026-11-18', equity_usd: 15.2 }]));
    listeners.public_runs.onNext(
      querySnap([{ id: 'r1', status: 'ok', started_at: timestamp('2026-11-18T15:00:00Z') }]),
    );
  });
}

test('every list query carries a limit the security rules accept', () => {
  renderHook(() => useTradingFeed());
  const limitOf = (path) => listeners[path].ref.constraints.find((c) => 'limit' in c).limit;
  expect(limitOf('public_trades')).toBeLessThanOrEqual(100);
  expect(limitOf('public_equity_history')).toBeLessThanOrEqual(400);
  expect(limitOf('public_runs')).toBeLessThanOrEqual(50);
});

test('history keeps the newest days and returns them oldest first', () => {
  const { result } = renderHook(() => useTradingFeed());
  const { constraints } = listeners.public_equity_history.ref;
  expect(constraints).toContainEqual({ orderBy: 'date', direction: 'desc' });

  act(() => {
    listeners.public_equity_history.onNext(
      querySnap([
        { id: '2026-11-18', date: '2026-11-18', equity_usd: 15.2 },
        { id: '2026-11-17', date: '2026-11-17', equity_usd: 15 },
      ]),
    );
  });
  expect(result.current.history.map((entry) => entry.date)).toEqual(['2026-11-17', '2026-11-18']);
});

test('stays loading until all four feeds have delivered', () => {
  const { result } = renderHook(() => useTradingFeed());
  expect(result.current.loading).toBe(true);

  act(() => {
    listeners['public_snapshot/current'].onNext(docSnap({ equity_usd: 1 }));
  });
  expect(result.current.loading).toBe(true);

  deliverAll();
  expect(result.current.loading).toBe(false);
});

test('converts Firestore timestamps to Dates and keeps document ids', () => {
  const { result } = renderHook(() => useTradingFeed());
  deliverAll();

  expect(result.current.snapshot.updated_at).toEqual(new Date('2026-11-18T15:00:00Z'));
  expect(result.current.trades[0]).toMatchObject({ id: 'o1', symbol: 'AAPL', filled_at: null });
  expect(result.current.trades[0].submitted_at).toEqual(new Date('2026-11-18T14:00:00Z'));
  expect(result.current.runs[0].started_at).toEqual(new Date('2026-11-18T15:00:00Z'));
  expect(result.current.history).toEqual([{ id: '2026-11-18', date: '2026-11-18', equity_usd: 15.2, updated_at: null }]);
});

test('a missing snapshot document yields null', () => {
  const { result } = renderHook(() => useTradingFeed());
  act(() => {
    listeners['public_snapshot/current'].onNext(docSnap(null));
  });
  expect(result.current.snapshot).toBeNull();
});

test('a listener error ends loading and is exposed', () => {
  const { result } = renderHook(() => useTradingFeed());
  const error = new Error('permission-denied');
  act(() => {
    listeners.public_trades.onError(error);
  });
  expect(result.current.error).toBe(error);
  expect(result.current.loading).toBe(false);
});

test('unsubscribes every listener on unmount', () => {
  const { unmount } = renderHook(() => useTradingFeed());
  expect(unsubscribes).toHaveLength(4);
  unmount();
  unsubscribes.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledTimes(1));
});
