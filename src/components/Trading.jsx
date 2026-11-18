import React, { useEffect, useState } from 'react';
import useTradingFeed from '../hooks/useTradingFeed';
import { isAgentOffline } from '../lib/agentStatus';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

const formatUsd = (value) => (typeof value === 'number' ? usd.format(value) : '—');
const formatPct = (value) => (typeof value === 'number' ? pct.format(value / 100) : '—');
const formatDate = (value) => (value instanceof Date ? dateTime.format(value) : '—');
const signClass = (value) => (typeof value !== 'number' || value === 0 ? 'text-ink' : value > 0 ? 'text-emerald' : 'text-coral');

const cardClass = 'rounded-[10px] border border-line bg-panel px-6 py-5';
const labelClass = 'mb-[0.4rem] text-[0.8rem] tracking-[0.05em] text-faint uppercase';
const valueClass = 'text-[1.5rem]';
const cardTitleClass = 'mb-4 text-[1.1rem] font-bold text-gold';
const emptyClass = 'text-faint';
const tableClass =
  'w-full border-collapse text-[0.9rem] [&_td]:border-b [&_td]:border-rule [&_td]:px-3 [&_td]:py-2 [&_td]:text-right [&_td]:whitespace-nowrap [&_td:first-child]:text-left [&_th]:border-b [&_th]:border-rule [&_th]:px-3 [&_th]:py-2 [&_th]:text-right [&_th]:font-normal [&_th]:whitespace-nowrap [&_th]:text-faint [&_th:first-child]:text-left';

function StatCard({ label, valueClassName = 'text-ink', children }) {
  return (
    <div className={cardClass}>
      <div className={labelClass}>{label}</div>
      <div className={`${valueClass} ${valueClassName}`}>{children}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className={`${cardClass} mb-8`}>
      <h3 className={cardTitleClass}>{title}</h3>
      {children}
    </div>
  );
}

const STATUS_REFRESH_MS = 60 * 1000;

function useNow(intervalMs) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;

function EquityChart({ history }) {
  const points = history.filter((entry) => typeof entry.equity_usd === 'number');
  if (points.length < 2) {
    return <p className={emptyClass}>Not enough history yet.</p>;
  }
  const values = points.map((entry) => entry.equity_usd);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - ((value - min) / range) * CHART_HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const strokeClass = values[values.length - 1] >= values[0] ? 'stroke-emerald' : 'stroke-coral';

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      width="100%"
      height={CHART_HEIGHT}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Equity from ${formatUsd(values[0])} to ${formatUsd(values[values.length - 1])}`}
    >
      <polyline points={coords} fill="none" className={strokeClass} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Trading() {
  const { snapshot, trades, history, runs, loading, error } = useTradingFeed();
  const now = useNow(STATUS_REFRESH_MS);
  const lastRun = runs[0] || null;
  const offline = isAgentOffline(lastRun, now);

  let body;
  if (error) {
    body = <p role="alert" className={emptyClass}>Live data is unavailable right now.</p>;
  } else if (loading) {
    body = <p className={emptyClass}>Loading live data…</p>;
  } else {
    const positions = snapshot?.positions || [];
    body = (
      <>
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          <StatCard label="Equity">{formatUsd(snapshot?.equity_usd)}</StatCard>
          <StatCard label="Total return" valueClassName={signClass(snapshot?.total_return_usd)}>
            {formatUsd(snapshot?.total_return_usd)} ({formatPct(snapshot?.total_return_pct)})
          </StatCard>
          <StatCard label="Today" valueClassName={signClass(snapshot?.day_change_usd)}>
            {formatUsd(snapshot?.day_change_usd)}
          </StatCard>
          <StatCard label="Last run">{lastRun ? lastRun.status : '—'}</StatCard>
        </div>

        <Panel title="Equity">
          <EquityChart history={history} />
        </Panel>

        <Panel title="Positions">
          {positions.length === 0 ? (
            <p className={emptyClass}>No open positions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Qty</th>
                    <th>Avg cost</th>
                    <th>Value</th>
                    <th>P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.symbol}>
                      <td>{position.symbol}</td>
                      <td>{position.quantity}</td>
                      <td>{formatUsd(position.avg_cost_usd)}</td>
                      <td>{formatUsd(position.market_value_usd)}</td>
                      <td className={signClass(position.unrealized_pl_usd)}>
                        {formatUsd(position.unrealized_pl_usd)} ({formatPct(position.unrealized_pl_pct)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Trades">
          {trades.length === 0 ? (
            <p className={emptyClass}>No trades yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th>Submitted</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Amount</th>
                    <th>Fill price</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id}>
                      <td>{formatDate(trade.submitted_at)}</td>
                      <td>{trade.symbol}</td>
                      <td className={trade.side === 'buy' ? 'text-emerald' : 'text-coral'}>{trade.side}</td>
                      <td>{typeof trade.notional_usd === 'number' ? formatUsd(trade.notional_usd) : trade.quantity}</td>
                      <td>{formatUsd(trade.avg_fill_price_usd)}</td>
                      <td>{trade.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Recent runs">
          {runs.length === 0 ? (
            <p className={emptyClass}>No runs yet.</p>
          ) : (
            <ul className="[&>li+li]:mt-4 [&>li+li]:border-t [&>li+li]:border-rule [&>li+li]:pt-4">
              {runs.map((run) => (
                <li key={run.id}>
                  <div className="mb-[0.35rem] text-[0.85rem] text-faint">
                    {formatDate(run.started_at)} · {run.status}
                    {run.model ? ` · ${run.model}` : ''}
                  </div>
                  <div>{run.rationale || 'No rationale recorded.'}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </>
    );
  }

  return (
    <section className="min-h-screen bg-surface-deep px-5 pt-[100px] pb-20">
      <div className="mx-auto max-w-[1100px]">
        <header className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[2.5rem] font-bold text-gold">Trading Agent</h2>
          {!loading && !error && (
            <span
              className={`rounded-full border px-3 py-[0.3rem] text-[0.85rem] ${
                offline ? 'border-coral text-coral' : 'border-emerald text-emerald'
              }`}
            >
              {offline ? 'Agent offline' : 'Agent online'}
            </span>
          )}
        </header>
        {body}
        <p className="text-center text-[0.85rem] text-faint">Automated experiment. Not investment advice.</p>
      </div>
    </section>
  );
}

export default Trading;
