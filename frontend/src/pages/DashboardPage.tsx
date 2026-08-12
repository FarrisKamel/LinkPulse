import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useStats } from '../hooks/useStats'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </div>
  )
}

function DashboardPage() {
  const { data, isPending, isError } = useStats()

  if (isPending) {
    return <p className="text-sm text-slate-500">Loading…</p>
  }
  if (isError || !data) {
    return <p className="text-sm text-red-600">Couldn't load stats.</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total bookmarks" value={data.total_bookmarks} />
        <StatTile label="Tags" value={data.total_tags} />
        <StatTile label="Added this week" value={data.bookmarks_this_week} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top domains">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.top_domains}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="domain" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bookmarks over time (30 days)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.bookmarks_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tag distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip />
              <Pie
                data={data.tag_distribution}
                dataKey="count"
                nameKey="name"
                outerRadius={90}
                label={(entry) => entry.name}
              >
                {data.tag_distribution.map((tag) => (
                  <Cell key={tag.name} fill={tag.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

export default DashboardPage
