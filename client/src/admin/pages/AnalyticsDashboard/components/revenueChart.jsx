import { C, fmtCurrency, fmtDateShort } from '../constants.js';

/**
 * Pure SVG bar chart — no recharts, no chart.js dependency.
 * Matches the zero-external-dependency pattern of the rest of the admin.
 */
export default function RevenueChart({ data = [], loading }) {
  if (loading) return (
    <div style={{ height: 160, background: C.border, borderRadius: C.r, animation: 'pulse 1.4s ease-in-out infinite' }} />
  );

  if (!data.length) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inkFaint, fontSize: 13 }}>
      No data for this period
    </div>
  );

  const W = 600, H = 120, PAD = 8;
  const maxRev = Math.max(...data.map(d => d.revenue), 1);

  // Show at most 30 bars — if more data, aggregate weekly
  const bars = data.slice(-30);
  const barW = (W - PAD * 2) / bars.length;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H + 28}`}
        style={{ width: '100%', minWidth: 260, display: 'block' }}
        preserveAspectRatio="none"
      >
        {bars.map((d, i) => {
          const h   = Math.max(4, (d.revenue / maxRev) * H);
          const x   = PAD + i * barW + barW * 0.15;
          const y   = H - h;
          const w   = barW * 0.7;
          const isLast = i === bars.length - 1;
          return (
            <g key={d.date}>
              <rect
                x={x} y={y} width={w} height={h}
                rx={3}
                fill={isLast ? C.amber : 'rgba(255,170,20,0.35)'}
              />
              {/* X-axis label — show every 7th or first/last */}
              {(i === 0 || i === bars.length - 1 || i % Math.max(1, Math.floor(bars.length / 6)) === 0) && (
                <text
                  x={x + w / 2} y={H + 20}
                  textAnchor="middle"
                  fontSize={9}
                  fill={C.inkFaint}
                  fontFamily={C.font}
                >
                  {fmtDateShort(d.date)}
                </text>
              )}
              {/* Tooltip via title */}
              <title>{`${d.date}\nRevenue: ${fmtCurrency(d.revenue)}\nOrders: ${d.orders}`}</title>
            </g>
          );
        })}
        {/* Y-axis guide line */}
        <line x1={PAD} y1={0} x2={PAD} y2={H} stroke={C.border} strokeWidth={1} />
        <line x1={PAD} y1={H} x2={W - PAD} y2={H} stroke={C.border} strokeWidth={1} />
      </svg>
    </div>
  );
}