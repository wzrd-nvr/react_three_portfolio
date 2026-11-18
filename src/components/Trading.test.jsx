import { vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import Trading from './Trading';
import useTradingFeed from '../hooks/useTradingFeed';

vi.mock('../hooks/useTradingFeed');

const feed = (overrides) => ({
  snapshot: null,
  trades: [],
  history: [],
  runs: [],
  loading: false,
  error: null,
  ...overrides,
});

const recentRun = () => ({ id: 'r1', status: 'ok', started_at: new Date(), rationale: 'Bought one share.', model: 'sonnet' });

test('shows a loading message and no status badge while loading', () => {
  useTradingFeed.mockReturnValue(feed({ loading: true }));
  render(<Trading />);
  expect(screen.getByText(/loading live data/i)).toBeInTheDocument();
  expect(screen.queryByText(/agent (online|offline)/i)).not.toBeInTheDocument();
});

test('shows an alert when the feed errors', () => {
  useTradingFeed.mockReturnValue(feed({ error: new Error('permission-denied') }));
  render(<Trading />);
  expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/i);
});

test('renders empty states and an offline badge when there is no data', () => {
  useTradingFeed.mockReturnValue(feed());
  render(<Trading />);
  expect(screen.getByText('Agent offline')).toBeInTheDocument();
  expect(screen.getByText(/no open positions/i)).toBeInTheDocument();
  expect(screen.getByText(/no trades yet/i)).toBeInTheDocument();
  expect(screen.getByText(/no runs yet/i)).toBeInTheDocument();
  expect(screen.getByText(/not enough history/i)).toBeInTheDocument();
});

test('renders snapshot, positions, trades, chart and runs', () => {
  useTradingFeed.mockReturnValue(
    feed({
      snapshot: {
        equity_usd: 15.42,
        total_return_usd: 0.42,
        total_return_pct: 2.8,
        day_change_usd: -0.1,
        positions: [
          { symbol: 'AAPL', quantity: 0.05, avg_cost_usd: 200, market_value_usd: 10.5, unrealized_pl_usd: 0.5, unrealized_pl_pct: 5 },
        ],
      },
      trades: [
        { id: 'o1', symbol: 'MSFT', side: 'buy', notional_usd: 2, avg_fill_price_usd: 410.12, state: 'filled', submitted_at: new Date('2026-11-18T14:00:00Z') },
      ],
      history: [
        { id: 'd1', date: '2026-11-17', equity_usd: 15 },
        { id: 'd2', date: '2026-11-18', equity_usd: 15.42 },
      ],
      runs: [recentRun()],
    }),
  );
  render(<Trading />);

  expect(screen.getByText('Agent online')).toBeInTheDocument();
  expect(screen.getByText('$15.42')).toBeInTheDocument();
  expect(screen.getByText('$0.42 (2.80%)')).toBeInTheDocument();
  expect(screen.getByText('AAPL')).toBeInTheDocument();
  expect(screen.getByText('$0.50 (5.00%)')).toBeInTheDocument();
  expect(screen.getByText('MSFT')).toBeInTheDocument();
  expect(screen.getByText('$410.12')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Equity from $15.00 to $15.42' })).toBeInTheDocument();
  expect(screen.getByText('Bought one share.')).toBeInTheDocument();
  expect(screen.getByText(/not investment advice/i)).toBeInTheDocument();
});

test('shows the offline badge when the last run errored', () => {
  useTradingFeed.mockReturnValue(feed({ runs: [{ ...recentRun(), status: 'error' }] }));
  render(<Trading />);
  expect(screen.getByText('Agent offline')).toBeInTheDocument();
});

test('the badge goes offline as time passes without a new run', () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date(2026, 10, 17, 12));
    useTradingFeed.mockReturnValue(feed({ runs: [{ ...recentRun(), started_at: new Date(2026, 10, 16, 15) }] }));
    render(<Trading />);
    expect(screen.getByText('Agent online')).toBeInTheDocument();

    act(() => {
      vi.setSystemTime(new Date(2026, 10, 18, 12));
      vi.advanceTimersByTime(60 * 1000);
    });
    expect(screen.getByText('Agent offline')).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
