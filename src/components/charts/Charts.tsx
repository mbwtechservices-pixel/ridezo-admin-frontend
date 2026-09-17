import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
const CITY_COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#e11d48', '#7c3aed', '#ea580c', '#0891b2'];
const CENTER_BLUE = '#2563eb';

export function RevenueChart({
  data,
}: {
  data: Array<{ label: string; revenue: number; trips: number }>;
}) {
  return (
    <div className="admin-panel h-80 p-4">
      <h3 className="mb-4 text-sm font-semibold text-admin-ink">Revenue & trips (7 days)</h3>
      {data.every((row) => row.revenue === 0 && row.trips === 0) ? (
        <p className="flex h-[85%] items-center justify-center text-sm text-admin-muted">
          No revenue in the last 7 days.
        </p>
      ) : (
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
      )}
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
      {data.length === 0 ? (
        <p className="flex h-[85%] items-center justify-center text-sm text-admin-muted">
          No completed trips with city data yet.
        </p>
      ) : (
        <div className="relative h-[85%]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={90}
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke="#ffffff"
                strokeWidth={1}
                label={({ name, value }) => `${name} ${value}%`}
                labelLine
              >
                {data.map((row, i) => (
                  <Cell key={row.name} fill={CITY_COLORS[i % CITY_COLORS.length]} />
                ))}
              </Pie>
              <Pie
                data={[{ name: 'center', value: 1 }]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={10}
                fill={CENTER_BLUE}
                stroke={CENTER_BLUE}
                isAnimationActive={false}
                legendType="none"
                tooltipType="none"
              />
              <Tooltip formatter={(value) => [`${Number(value)}%`, 'Share']} />
              <Legend
                payload={data.map((row, i) => ({
                  id: row.name,
                  type: 'square',
                  value: `${row.name} ${row.value}%`,
                  color: CITY_COLORS[i % CITY_COLORS.length],
                }))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
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
