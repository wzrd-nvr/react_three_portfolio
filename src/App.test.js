import { render, screen } from '@testing-library/react';
import App from './App';
import useTradingFeed from './hooks/useTradingFeed';

jest.mock('./components/Navigation', () => () => <nav>globe navigation</nav>);
jest.mock('./hooks/useTradingFeed');

beforeEach(() => {
  useTradingFeed.mockReturnValue({ snapshot: null, trades: [], history: [], runs: [], loading: false, error: null });
});

afterEach(() => {
  window.history.pushState({}, '', '/');
});

test('the home page shows the globe navigation', () => {
  render(<App />);
  expect(screen.getByText('globe navigation')).toBeInTheDocument();
});

test('/trading lazy-loads the trading page with the simple nav', async () => {
  window.history.pushState({}, '', '/trading');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Trading Agent' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Trading' })).toHaveAttribute('href', '/trading');
  expect(screen.queryByText('globe navigation')).not.toBeInTheDocument();
});

test('unknown paths redirect home', () => {
  window.history.pushState({}, '', '/no-such-page');
  render(<App />);
  expect(screen.getByText('globe navigation')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/');
});
