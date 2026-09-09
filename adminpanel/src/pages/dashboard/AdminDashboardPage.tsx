import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserMinus,
  UserX,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Video,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { adminDashboardService } from '../../services/adminDashboardService';
import type {
  DashboardKPICard,
  UserGrowthDataPoint,
  DistributionDataPoint,
  ActivityLogItem,
  TutorApplication,
} from '../../types/admin';
import { CardSkeleton, TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ROUTES } from '../../constants';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [kpiCards, setKpiCards] = useState<DashboardKPICard[]>([]);
  const [growthPeriod, setGrowthPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [growthData, setGrowthData] = useState<UserGrowthDataPoint[]>([]);
  const [statusDist, setStatusDist] = useState<DistributionDataPoint[]>([]);
  const [roleDist, setRoleDist] = useState<DistributionDataPoint[]>([]);
  const [appDist, setAppDist] = useState<DistributionDataPoint[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLogItem[]>([]);
  const [pendingApps, setPendingApps] = useState<TutorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const [kpis, growth, status, roles, apps, activities, pending] = await Promise.all([
          adminDashboardService.getKPICards(),
          adminDashboardService.getUserGrowth(growthPeriod),
          adminDashboardService.getStatusDistribution(),
          adminDashboardService.getRoleDistribution(),
          adminDashboardService.getApplicationDistribution(),
          adminDashboardService.getRecentActivity(),
          adminDashboardService.getPendingTutorApplications(),
        ]);
        setKpiCards(kpis);
        setGrowthData(growth);
        setStatusDist(status);
        setRoleDist(roles);
        setAppDist(apps);
        setRecentActivities(activities);
        setPendingApps(pending);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [growthPeriod]);

  // Icon mapping for KPI cards
  const renderCardIcon = (icon: string) => {
    switch (icon) {
      case 'Users':
        return <Users size={22} color="var(--color-primary-500)" />;
      case 'UserCheck':
        return <UserCheck size={22} color="var(--color-success)" />;
      case 'UserMinus':
        return <UserMinus size={22} color="var(--color-suspended)" />;
      case 'UserX':
        return <UserX size={22} color="var(--color-danger)" />;
      case 'GraduationCap':
        return <GraduationCap size={22} color="var(--color-primary-600)" />;
      case 'Clock':
        return <Clock size={22} color="var(--color-warning)" />;
      case 'CheckCircle2':
        return <CheckCircle2 size={22} color="var(--color-success)" />;
      case 'XCircle':
        return <XCircle size={22} color="var(--color-danger)" />;
      default:
        return <Users size={22} color="var(--color-gray-500)" />;
    }
  };

  if (isLoading && kpiCards.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <CardSkeleton count={8} />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--color-gray-900)',
              letterSpacing: '-0.02em',
            }}
          >
            System Overview & Platform Health
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginTop: 2 }}>
            Real-time telemetry, user management metrics, and tutor verification pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to={ROUTES.TUTOR_APPLICATIONS} className="btn btn-primary btn-sm">
            <Clock size={16} />
            <span>Review Applications{pendingApps.length > 0 ? ` (${pendingApps.length})` : ''}</span>
          </Link>
          <Link to={ROUTES.USERS} className="btn btn-secondary btn-sm">
            <Users size={16} />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Top 8 KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {kpiCards.map((card) => (
          <div
            key={card.id}
            className="admin-card admin-card-hover"
            style={{
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'var(--color-gray-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {card.title}
                </span>
                <div
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 800,
                    color: 'var(--color-gray-900)',
                    marginTop: 'var(--space-1)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {card.metric}
                </div>
              </div>

              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {renderCardIcon(card.icon)}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-4)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontWeight: 600,
                  color:
                    card.trendDirection === 'up'
                      ? 'var(--color-success)'
                      : card.trendDirection === 'down'
                      ? 'var(--color-danger)'
                      : 'var(--color-warning)',
                }}
              >
                {card.trendDirection === 'up' && <ArrowUpRight size={14} />}
                {card.trendDirection === 'down' && <ArrowDownRight size={14} />}
                {card.trend}
              </span>
              <span style={{ color: 'var(--color-gray-400)' }}>{card.comparisonText}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Visualizations Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* User Growth Chart */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-4)',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                User Growth Velocity
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
                Net new student & tutor onboardings
              </p>
            </div>

            {/* Timeframe Selector */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 2,
              }}
            >
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setGrowthPeriod(period)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: growthPeriod === period ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: growthPeriod === period ? '#fff' : 'transparent',
                    color: growthPeriod === period ? 'var(--color-primary-600)' : 'var(--color-gray-500)',
                    boxShadow: growthPeriod === period ? 'var(--shadow-xs)' : 'none',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="students"
                  name="Students"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="tutors"
                  name="Tutors"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Status & Role Distribution Charts */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
              Platform Breakdown
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
              Account status safety distribution & role allocation
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-4)',
              flex: 1,
              alignItems: 'center',
            }}
          >
            {/* Status Donut */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: 4 }}>
                Account Status
              </span>
              <div style={{ height: 160, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDist}
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center' }}>
                {statusDist.map((item, idx) => (
                  <span key={idx} style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-gray-600)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Role Breakdown Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: 4 }}>
                Tutor Verification Status
              </span>
              <div style={{ height: 160, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {appDist.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center' }}>
                {appDist.map((item, idx) => (
                  <span key={idx} style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-gray-600)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: item.color }} />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Section: Pending Tutor Applications (Section 8) */}
      <div className="admin-card" style={{ padding: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-gray-900)' }}>
                Pending Tutor Applications
              </h3>
              {pendingApps.length > 0 ? (
                <span className="badge badge-warning">{pendingApps.length} Waiting</span>
              ) : (
                <span className="badge badge-success">All Reviewed</span>
              )}
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
              Requires evaluation of mandatory 5-minute trial videos and supporting academic credentials.
            </p>
          </div>

          <Link
            to={ROUTES.TUTOR_APPLICATIONS}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
          >
            <span>View All Applications</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Applications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {pendingApps.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
              All tutor applications have been reviewed.
            </div>
          ) : (
            pendingApps.map((app) => (
              <div
                key={app.application_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                {/* Applicant info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 220 }}>
                  <img
                    src={app.user.profile_pic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor'}
                    alt={app.user.name}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-900)' }}>
                      {app.user.name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                      {app.user.email}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Verification Assets Indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)' }}>
                    <Video size={16} />
                    <span>Trial Video Available</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                    <FileText size={16} />
                    <span>{app.documents.length} Documents</span>
                  </div>

                  <StatusBadge status="pending" label="Pending" />
                </div>

                {/* Actions */}
                <div>
                  <button
                    onClick={() => navigate(ROUTES.TUTOR_APPLICATION_REVIEW(app.application_id))}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Review Application</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity Audit Stream (Section 7) */}
      <div className="admin-card">
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
            Recent Activity
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 2 }}>
            Real-time audit log of registrations, status modifications, and moderation decisions.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {recentActivities.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) 0',
                borderBottom: '1px solid var(--color-border-subtle)',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <img
                  src={act.user_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Activity'}
                  alt={act.user_name}
                  style={{ width: 34, height: 34, borderRadius: '50%' }}
                />
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-800)' }}>
                    <strong style={{ color: 'var(--color-gray-900)' }}>{act.user_name}</strong>{' '}
                    <span>{act.description}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
                    {act.timestamp}
                  </div>
                </div>
              </div>

              <span
                className={`badge badge-${
                  act.status === 'warning'
                    ? 'suspended'
                    : act.status === 'danger'
                    ? 'danger'
                    : act.status === 'success'
                    ? 'success'
                    : 'neutral'
                }`}
                style={{ fontSize: '0.65rem' }}
              >
                {act.action_type.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
