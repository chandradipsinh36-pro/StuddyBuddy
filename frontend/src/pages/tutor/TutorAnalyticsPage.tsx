import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { BookOpen, Users, TrendingUp, Star } from 'lucide-react';
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

  const totalEnrollments = (analytics as any).totalEnrollments ?? analytics.totalViews ?? analytics.views ?? 0;
  const totalRevenue = (analytics as any).totalRevenue ?? analytics.earnings ?? 0;
  const totalPurchases = (analytics as any).totalPurchases ?? analytics.students ?? 0;
  const avgRating = analytics.averageRating ?? analytics.rating ?? 0;
  const topCourses: any[] = (analytics as any).topCourses ?? [];

  const thisMonthEarnings = (analytics as any).thisMonthEarnings ?? 0;
  const lastMonthEarnings = (analytics as any).lastMonthEarnings ?? 0;

  const revenueChange = lastMonthEarnings > 0
    ? `${((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)}% vs last month`
    : thisMonthEarnings > 0 ? 'First revenue this month!' : 'No revenue yet';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Instructor Performance & Analytics</h1>
        <p className={styles.subtitle}>
          Track your course enrollments, revenue, and student engagement in real-time.
        </p>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className={styles.kpiLabel}>Total Net Earnings</div>
          </div>
          <div className={styles.kpiVal}>₹{totalRevenue.toLocaleString()}</div>
          <div className={styles.kpiChange}>{revenueChange}</div>
        </div>

        <div className={styles.kpiCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Users size={16} style={{ color: '#059669' }} />
            <div className={styles.kpiLabel}>Total Enrollments</div>
          </div>
          <div className={styles.kpiVal}>{totalEnrollments.toLocaleString()}</div>
          <div className={styles.kpiChange}>
            {totalEnrollments > 0 ? `Across ${topCourses.length} course${topCourses.length !== 1 ? 's' : ''}` : 'No enrollments yet'}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TrendingUp size={16} style={{ color: '#d97706' }} />
            <div className={styles.kpiLabel}>Paid Purchases</div>
          </div>
          <div className={styles.kpiVal}>{totalPurchases}</div>
          <div className={styles.kpiChange}>
            {totalEnrollments > 0
              ? `${((totalPurchases / totalEnrollments) * 100).toFixed(1)}% paid conversion`
              : 'No purchases yet'}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Star size={16} style={{ color: '#f59e0b' }} />
            <div className={styles.kpiLabel}>Average Rating</div>
          </div>
          <div className={styles.kpiVal}>★ {avgRating > 0 ? avgRating : '—'}</div>
          <div className={styles.kpiChange}>
            {avgRating > 0 ? 'From student reviews' : 'No reviews yet'}
          </div>
        </div>
      </div>

      {/* Revenue Over Time Area Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Revenue Trend (Last 6 Months)</h2>
          <Badge variant="primary">Net Earnings in INR (₹)</Badge>
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
              <Tooltip formatter={(val) => [`₹${val}`, 'Net Earnings']} />
              <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Enrollments Over Time Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>New Enrollments (Last 6 Months)</h2>
          <Badge variant="outline">Paid Course Enrollments</Badge>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(analytics.viewsOverTime ?? [])}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(val) => [val, 'Enrollments']} />
              <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Performance Table */}
      <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOpen size={20} style={{ color: '#2563eb' }} />
        Course Performance
      </h2>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Course Title</th>
              <th>Status</th>
              <th>Total Enrollments</th>
              <th>Paid Purchases</th>
              <th>Revenue Earned</th>
            </tr>
          </thead>
          <tbody>
            {topCourses.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-gray-500)', fontStyle: 'italic', padding: '24px 0' }}>
                  No courses found. Create and publish your first course to see analytics here.
                </td>
              </tr>
            ) : (
              topCourses.map((c: any, idx: number) => (
                <tr key={idx}>
                  <td><strong>{c.title || 'Untitled Course'}</strong></td>
                  <td>
                    <Badge variant={c.isPublished ? 'success' : 'outline'}>
                      {c.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: c.enrollments > 0 ? '#059669' : 'var(--color-gray-500)' }}>
                      {c.enrollments}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: c.purchases > 0 ? '#2563eb' : 'var(--color-gray-500)' }}>
                      {c.purchases}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: c.revenue > 0 ? '#059669' : 'var(--color-gray-500)' }}>
                      {c.revenue > 0 ? `₹${c.revenue.toLocaleString()}` : '₹0'}
                    </strong>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
}
