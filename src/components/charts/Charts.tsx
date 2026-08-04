import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const TEAL = '#0f766e';
const TEAL_SOFT = '#14b8a6';
const SLATE = '#94a3b8';
const COLORS = ['#0f766e', '#0284c7', '#d97706', '#059669', '#64748b'];

export function RevenueChart({
  data,
}: {
  data: Array<{ label: string; revenue: number; trips: number }>;
}) {
  return (
    <div className="admin-panel h-80 p-4">
      <h3 className="mb-4 text-sm font-semibold text-admin-ink">Revenue & trips (7 days)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity={0.35} />
              <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fill: SLATE, fontSize: 12 }} />
          <YAxis tick={{ fill: SLATE, fontSize: 12 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={TEAL}
            fill="url(#rev)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CityShareChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="admin-panel h-80 p-4">
      <h3 className="mb-4 text-sm font-semibold text-admin-ink">City share</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FunnelChart({
  data,
}: {
  data: Array<{ stage: string; value: number }>;
}) {
  return (
    <div className="admin-panel h-80 p-4">
      <h3 className="mb-4 text-sm font-semibold text-admin-ink">Conversion funnel</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fill: SLATE, fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="stage"
            width={90}
            tick={{ fill: SLATE, fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="value" fill={TEAL_SOFT} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
