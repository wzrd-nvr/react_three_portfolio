import { isAgentOffline } from './agentStatus';

const at = (iso) => new Date(iso);

test('offline when there is no run', () => {
  expect(isAgentOffline(null, at('2026-11-18T12:00:00'))).toBe(true);
});

test('offline when the last run could not reach Robinhood or errored', () => {
  const now = at('2026-11-18T12:00:00');
  expect(isAgentOffline({ status: 'rh_unavailable', started_at: at('2026-11-18T10:00:00') }, now)).toBe(true);
  expect(isAgentOffline({ status: 'error', started_at: at('2026-11-18T10:00:00') }, now)).toBe(true);
});

test('online after a healthy run earlier today or on the previous weekday', () => {
  expect(isAgentOffline({ status: 'ok', started_at: at('2026-11-18T10:00:00') }, at('2026-11-18T12:00:00'))).toBe(false);
  expect(isAgentOffline({ status: 'ok', started_at: at('2026-11-17T15:30:00') }, at('2026-11-18T09:00:00'))).toBe(false);
});

test('market_closed and approval_required runs still count as the agent being up', () => {
  const now = at('2026-11-18T12:00:00');
  expect(isAgentOffline({ status: 'market_closed', started_at: at('2026-11-18T10:00:00') }, now)).toBe(false);
  expect(isAgentOffline({ status: 'approval_required', started_at: at('2026-11-18T10:00:00') }, now)).toBe(false);
});

test('a Friday run is not stale on Monday', () => {
  // 2026-11-20 is a Friday, 2026-11-23 a Monday.
  expect(isAgentOffline({ status: 'ok', started_at: at('2026-11-20T15:30:00') }, at('2026-11-23T09:00:00'))).toBe(false);
});

test('offline once a whole weekday passes without a run', () => {
  // Monday run, checked on Wednesday: Tuesday was missed.
  expect(isAgentOffline({ status: 'ok', started_at: at('2026-11-16T15:30:00') }, at('2026-11-18T09:00:00'))).toBe(true);
  // Friday run, checked on Tuesday: Monday was missed.
  expect(isAgentOffline({ status: 'ok', started_at: at('2026-11-20T15:30:00') }, at('2026-11-24T09:00:00'))).toBe(true);
});
