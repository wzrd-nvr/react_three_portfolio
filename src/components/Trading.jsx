import React from 'react';
import styled from 'styled-components';
import useTradingFeed from '../hooks/useTradingFeed';
import { isAgentOffline } from '../lib/agentStatus';

const GOLD = '#d4af37';
const GAIN = '#00e676';
const LOSS = '#ff6b6b';
const MUTED = '#8a8a8a';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

const formatUsd = (value) => (typeof value === 'number' ? usd.format(value) : '—');
const formatPct = (value) => (typeof value === 'number' ? pct.format(value / 100) : '—');
const formatDate = (value) => (value instanceof Date ? dateTime.format(value) : '—');
const signColor = (value) => (typeof value !== 'number' || value === 0 ? '#d4d4d4' : value > 0 ? GAIN : LOSS);

const Section = styled.section`
  min-height: 100vh;
  padding: 100px 20px 80px;
  background-color: #0c0c0c;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  color: ${GOLD};
`;

const Badge = styled.span`
  font-size: 0.85rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1px solid ${(props) => props.$color};
  color: ${(props) => props.$color};
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: #111;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;

  ${Stats} & {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-size: 0.8rem;
  color: ${MUTED};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
`;

const Value = styled.div`
  font-size: 1.5rem;
  color: ${(props) => props.$color || '#d4d4d4'};
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  color: ${GOLD};
  margin-bottom: 1rem;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th,
  td {
    padding: 0.5rem 0.75rem;
    text-align: right;
    border-bottom: 1px solid #222;
    white-space: nowrap;
  }

  th:first-child,
  td:first-child {
    text-align: left;
  }

  th {
    color: ${MUTED};
    font-weight: normal;
  }
`;

const Empty = styled.p`
  color: ${MUTED};
`;

const RunList = styled.ul`
  list-style: none;

  li + li {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #222;
  }
`;

const RunMeta = styled.div`
  font-size: 0.85rem;
  color: ${MUTED};
  margin-bottom: 0.35rem;
`;

const Disclaimer = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: ${MUTED};
`;

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;

function EquityChart({ history }) {
  const points = history.filter((entry) => typeof entry.equity_usd === 'number');
  if (points.length < 2) {
    return <Empty>Not enough history yet.</Empty>;
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
  const color = values[values.length - 1] >= values[0] ? GAIN : LOSS;

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      width="100%"
      height={CHART_HEIGHT}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Equity from ${formatUsd(values[0])} to ${formatUsd(values[values.length - 1])}`}
    >
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Trading() {
  const { snapshot, trades, history, runs, loading, error } = useTradingFeed();
  const lastRun = runs[0] || null;
  const offline = isAgentOffline(lastRun);

  let body;
  if (error) {
    body = <Empty role="alert">Live data is unavailable right now.</Empty>;
  } else if (loading) {
    body = <Empty>Loading live data…</Empty>;
  } else {
    const positions = snapshot?.positions || [];
    body = (
      <>
        <Stats>
          <Card>
            <Label>Equity</Label>
            <Value>{formatUsd(snapshot?.equity_usd)}</Value>
          </Card>
          <Card>
            <Label>Total return</Label>
            <Value $color={signColor(snapshot?.total_return_usd)}>
              {formatUsd(snapshot?.total_return_usd)} ({formatPct(snapshot?.total_return_pct)})
            </Value>
          </Card>
          <Card>
            <Label>Today</Label>
            <Value $color={signColor(snapshot?.day_change_usd)}>{formatUsd(snapshot?.day_change_usd)}</Value>
          </Card>
          <Card>
            <Label>Last run</Label>
            <Value>{lastRun ? lastRun.status : '—'}</Value>
          </Card>
        </Stats>

        <Card>
          <CardTitle>Equity</CardTitle>
          <EquityChart history={history} />
        </Card>

        <Card>
          <CardTitle>Positions</CardTitle>
          {positions.length === 0 ? (
            <Empty>No open positions.</Empty>
          ) : (
            <TableWrap>
              <Table>
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
                      <td style={{ color: signColor(position.unrealized_pl_usd) }}>
                        {formatUsd(position.unrealized_pl_usd)} ({formatPct(position.unrealized_pl_pct)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <Card>
          <CardTitle>Trades</CardTitle>
          {trades.length === 0 ? (
            <Empty>No trades yet.</Empty>
          ) : (
            <TableWrap>
              <Table>
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
                      <td style={{ color: trade.side === 'buy' ? GAIN : LOSS }}>{trade.side}</td>
                      <td>{typeof trade.notional_usd === 'number' ? formatUsd(trade.notional_usd) : trade.quantity}</td>
                      <td>{formatUsd(trade.avg_fill_price_usd)}</td>
                      <td>{trade.state}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <Card>
          <CardTitle>Recent runs</CardTitle>
          {runs.length === 0 ? (
            <Empty>No runs yet.</Empty>
          ) : (
            <RunList>
              {runs.map((run) => (
                <li key={run.id}>
                  <RunMeta>
                    {formatDate(run.started_at)} · {run.status}
                    {run.model ? ` · ${run.model}` : ''}
                  </RunMeta>
                  <div>{run.rationale || 'No rationale recorded.'}</div>
                </li>
              ))}
            </RunList>
          )}
        </Card>
      </>
    );
  }

  return (
    <Section>
      <Container>
        <Header>
          <Title>Trading Agent</Title>
          {!loading && !error && (
            <Badge $color={offline ? LOSS : GAIN}>{offline ? 'Agent offline' : 'Agent online'}</Badge>
          )}
        </Header>
        {body}
        <Disclaimer>Automated experiment. Not investment advice.</Disclaimer>
      </Container>
    </Section>
  );
}

export default Trading;
