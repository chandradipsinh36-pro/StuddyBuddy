import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import { Badge } from '../../components/ui/Badge/Badge';
import type { TutorAnalytics } from '../../types';
import styles from './TutorAnalyticsPage.module.css';

export function TutorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TutorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsService.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>Loading analytics dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Instructor Performance & Analytics</h1>
        <p className={styles.subtitle}>
          Track your reach, content views, sales conversions, and learner engagement over time.
        </p>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Gross Revenue</div>
          <div className={styles.kpiVal}>₹{(analytics.totalRevenue ?? analytics.earnings ?? 0).toLocaleString()}</div>
          <div className={styles.kpiChange}>+18.4% from last month</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Resource Views</div>
          <div className={styles.kpiVal}>{(analytics.totalViews ?? analytics.views ?? 0).toLocaleString()}</div>
          <div className={styles.kpiChange}>+24.1% this week</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Purchases</div>
          <div className={styles.kpiVal}>{analytics.totalPurchases ?? analytics.students ?? 0}</div>
          <div className={styles.kpiChange}>{analytics.conversionRate ?? 4.2}% conversion rate</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Average Student Rating</div>
          <div className={styles.kpiVal}>★ {analytics.averageRating ?? analytics.rating ?? 4.9}</div>
          <div className={styles.kpiChange}>98% positive feedback</div>
        </div>
      </div>

      {/* Revenue Over Time Area Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Revenue Trend (Last 30 Days)</h2>
          <Badge variant="primary">Daily in INR (₹)</Badge>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.revenueOverTime ?? []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [`₹${val}`, 'Revenue']} />
              <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Views Over Time Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Content Views (Last 30 Days)</h2>
          <Badge variant="outline">Daily Impressions</Badge>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(analytics.viewsOverTime ?? []).slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [val, 'Views']} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Resources Table */}
      <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)' }}>
        Top Performing Teaching Resources
      </h2>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Format</th>
              <th>Total Views</th>
              <th>Purchases</th>
              <th>Total Earned</th>
            </tr>
          </thead>
          <tbody>
            {(analytics.topResources || []).map((item: any, idx: number) => (
              <tr key={idx}>
                <td><strong>{item.resource?.title || item.title || 'Educational Resource'}</strong></td>
                <td><Badge variant="outline">{(item.resource?.type || item.type || 'PDF').toUpperCase()}</Badge></td>
                <td>{item.views.toLocaleString()}</td>
                <td>{item.purchases}</td>
                <td><strong>₹{item.revenue.toLocaleString()}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
