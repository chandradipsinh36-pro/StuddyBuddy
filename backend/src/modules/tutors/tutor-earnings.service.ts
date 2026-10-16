import { prisma } from '../../config/database';

export const tutorEarningsService = {
  async getSummary(tutorId: number) {
    const courses = await prisma.course.findMany({ where: { tutorId }, select: { courseId: true } });
    const resources = await prisma.resource.findMany({ where: { uploadedBy: tutorId }, select: { resourceId: true } });
    const bundles = await prisma.bundle.findMany({ where: { tutorId }, select: { bundleId: true } });

    const courseIds = courses.map((c) => c.courseId);
    const resourceIds = resources.map((r) => r.resourceId);
    const bundleIds = bundles.map((b) => b.bundleId);

    const conditions: any[] = [];
    if (courseIds.length > 0) conditions.push({ courseId: { in: courseIds } });
    if (resourceIds.length > 0) conditions.push({ resourceId: { in: resourceIds } });
    if (bundleIds.length > 0) conditions.push({ bundleId: { in: bundleIds } });

    const payments = conditions.length > 0
      ? await prisma.payment.findMany({
          where: { OR: conditions },
          orderBy: { paidAt: 'desc' },
        })
      : [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    let totalGross = 0;
    let thisMonthGross = 0;
    let lastMonthGross = 0;
    let pendingGross = 0;

    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      const pDate = new Date(p.paidAt);
      if (p.status === 'success') {
        totalGross += amt;
        if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
          thisMonthGross += amt;
        } else if (pDate.getFullYear() === lastMonthYear && pDate.getMonth() === lastMonth) {
          lastMonthGross += amt;
        }
      } else if (p.status === 'pending') {
        pendingGross += amt;
      }
    }

    // 85% to instructor, 15% platform fee
    const totalEarnings = Math.round(totalGross * 0.85);
    const thisMonthEarnings = Math.round(thisMonthGross * 0.85);
    const lastMonthEarnings = Math.round(lastMonthGross * 0.85);
    const pendingEarnings = Math.round(pendingGross * 0.85);

    const nextPayout = new Date();
    nextPayout.setDate(nextPayout.getDate() + (7 - nextPayout.getDay() + 1) % 7 || 7);

    return {
      totalEarned: totalEarnings,
      totalEarnings,
      currentBalance: totalEarnings,
      availableBalance: totalEarnings,
      pendingPayout: pendingEarnings,
      pendingEarnings,
      completedEarnings: totalEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      nextPayoutDate: nextPayout.toISOString().split('T')[0],
    };
  },

  async getTransactions(tutorId: number) {
    const courses = await prisma.course.findMany({ where: { tutorId }, select: { courseId: true } });
    const resources = await prisma.resource.findMany({ where: { uploadedBy: tutorId }, select: { resourceId: true } });
    const bundles = await prisma.bundle.findMany({ where: { tutorId }, select: { bundleId: true } });

    const courseIds = courses.map((c) => c.courseId);
    const resourceIds = resources.map((r) => r.resourceId);
    const bundleIds = bundles.map((b) => b.bundleId);

    const conditions: any[] = [];
    if (courseIds.length > 0) conditions.push({ courseId: { in: courseIds } });
    if (resourceIds.length > 0) conditions.push({ resourceId: { in: resourceIds } });
    if (bundleIds.length > 0) conditions.push({ bundleId: { in: bundleIds } });

    if (conditions.length === 0) return [];

    const payments = await prisma.payment.findMany({
      where: { OR: conditions },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { courseId: true, title: true } },
        resource: { select: { resourceId: true, filename: true } },
        bundle: { select: { bundleId: true, title: true } },
      },
      orderBy: { paidAt: 'desc' },
      take: 50,
    });

    return payments.map((p) => {
      const gross = Number(p.amount) || 0;
      const net = Math.round(gross * 0.85);
      const fee = Math.round(gross * 0.15);
      const title = p.course?.title || p.bundle?.title || p.resource?.filename || 'Academic Material';

      return {
        id: p.paymentId,
        tutorId,
        purchaseId: p.paymentId,
        orderId: `ORD-${p.paymentId.toString().padStart(6, '0')}`,
        date: p.paidAt.toISOString(),
        createdAt: p.paidAt.toISOString(),
        resourceTitle: title,
        resource: title,
        buyerName: p.student?.name || 'Student',
        grossAmount: gross,
        platformFee: fee,
        netAmount: net,
        amount: net,
        status: p.status === 'success' ? 'settled' : 'pending',
      };
    });
  },

  async getAnalytics(tutorId: number) {
    const summary = await this.getSummary(tutorId);

    // Fetch courses with enrollment counts
    const courses = await prisma.course.findMany({
      where: { tutorId },
      select: {
        courseId: true,
        title: true,
        isPublished: true,
        price: true,
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    // Fetch resources
    const resources = await prisma.resource.findMany({
      where: { uploadedBy: tutorId },
      select: { resourceId: true, filename: true, isLocked: true, price: true, fileType: true },
    });

    const courseIds = courses.map((c) => c.courseId);
    const resourceIds = resources.map((r) => r.resourceId);

    // Ratings
    const [courseReviews, tutorReviews] = await Promise.all([
      courseIds.length > 0 ? prisma.courseReview.findMany({ where: { courseId: { in: courseIds } }, select: { rating: true } }) : [],
      prisma.tutorReview.findMany({ where: { tutorId }, select: { rating: true } }),
    ]);

    const allRatings = [...courseReviews.map((r) => r.rating), ...tutorReviews.map((r) => r.rating)];
    const avgRating = allRatings.length > 0
      ? Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
      : 0;

    // Get real course payment data — shows revenue per course from actual payments
    const coursePayments = courseIds.length > 0
      ? await prisma.payment.findMany({
          where: { courseId: { in: courseIds }, status: 'success' },
          select: { courseId: true, amount: true, paidAt: true },
        })
      : [];

    // Get real resource payment data
    const resourcePayments = resourceIds.length > 0
      ? await prisma.payment.findMany({
          where: { resourceId: { in: resourceIds }, status: 'success' },
          select: { resourceId: true, amount: true },
        })
      : [];

    // Build per-course payment stats (revenue from actual payments)
    const coursePurchaseMap: Record<number, { purchases: number; revenue: number }> = {};
    for (const cp of coursePayments) {
      if (cp.courseId == null) continue;
      if (!coursePurchaseMap[cp.courseId]) {
        coursePurchaseMap[cp.courseId] = { purchases: 0, revenue: 0 };
      }
      coursePurchaseMap[cp.courseId].purchases += 1;
      coursePurchaseMap[cp.courseId].revenue += Math.round(Number(cp.amount) * 0.85);
    }

    // Build per-resource payment stats
    const resourcePurchaseMap: Record<number, { purchases: number; revenue: number }> = {};
    for (const rp of resourcePayments) {
      if (rp.resourceId == null) continue;
      if (!resourcePurchaseMap[rp.resourceId]) {
        resourcePurchaseMap[rp.resourceId] = { purchases: 0, revenue: 0 };
      }
      resourcePurchaseMap[rp.resourceId].purchases += 1;
      resourcePurchaseMap[rp.resourceId].revenue += Math.round(Number(rp.amount) * 0.85);
    }

    // Total enrollments (from enrollment table — counts free + paid enrollments)
    const totalEnrollments = courses.reduce((acc, c) => acc + c._count.enrollments, 0);

    // Total paid purchases from payment records
    const totalCoursePurchases = coursePayments.length;
    const totalResourcePurchases = resourcePayments.length;
    const totalPurchases = totalCoursePurchases + totalResourcePurchases;

    // Monthly revenue timeline (real data per month)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    // Group course payments by month (last 6 months)
    const revenueByMonth: Record<string, number> = {};
    const enrollmentsByMonth: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      revenueByMonth[key] = 0;
      enrollmentsByMonth[key] = 0;
    }

    for (const cp of coursePayments) {
      const d = new Date(cp.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (key in revenueByMonth) {
        revenueByMonth[key] += Math.round(Number(cp.amount) * 0.85);
        enrollmentsByMonth[key] = (enrollmentsByMonth[key] || 0) + 1;
      }
    }

    const revenueOverTime = Object.entries(revenueByMonth).map(([key, amount]) => {
      const [year, month] = key.split('-');
      return { date: months[parseInt(month)], amount, value: amount };
    });

    const viewsOverTime = Object.entries(enrollmentsByMonth).map(([key, count]) => {
      const [year, month] = key.split('-');
      return { date: months[parseInt(month)], views: count, value: count };
    });

    // Build top courses table (sorted by enrollment count)
    const topCourses = courses
      .map((c) => {
        const stats = coursePurchaseMap[c.courseId] || { purchases: 0, revenue: 0 };
        return {
          id: c.courseId,
          title: c.title,
          type: 'course',
          enrollments: c._count.enrollments, // total enrollments (free+paid)
          purchases: stats.purchases,          // paid purchases only
          revenue: stats.revenue,
          isPublished: c.isPublished,
        };
      })
      .sort((a, b) => b.enrollments - a.enrollments);

    // Build top resources table (sorted by purchase count)
    const topResourcesList = resources
      .map((r) => {
        const stats = resourcePurchaseMap[r.resourceId] || { purchases: 0, revenue: 0 };
        return {
          id: r.resourceId,
          title: r.filename,
          type: r.fileType || 'pdf',
          purchases: stats.purchases,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 5);

    return {
      // KPI numbers
      views: totalEnrollments,
      totalViews: totalEnrollments,
      totalEnrollments,
      earnings: summary.totalEarnings,
      totalRevenue: Math.round(summary.totalEarnings / 0.85),
      totalEarnings: summary.totalEarnings,
      thisMonthEarnings: summary.thisMonthEarnings,
      lastMonthEarnings: summary.lastMonthEarnings,
      students: totalEnrollments,
      totalPurchases,
      totalCoursePurchases,
      rating: avgRating,
      averageRating: avgRating,
      conversionRate: totalEnrollments > 0 ? Number(((totalPurchases / totalEnrollments) * 100).toFixed(1)) : 0,

      // Charts
      revenueOverTime,
      revenueByMonth: revenueOverTime.map((r) => ({ month: r.date, amount: r.amount })),
      viewsOverTime,

      // Top courses table (NEW — course-level analytics)
      topCourses,

      // Top resources table (standalone PDF/resource sales)
      popularResources: topResourcesList.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        views: r.purchases,
        purchases: r.purchases,
        price: Number(resources.find((res) => res.resourceId === r.id)?.price || 0),
      })),
      topResources: topResourcesList.map((r) => ({
        resource: { id: r.id, title: r.title, type: r.type },
        purchases: r.purchases,
        revenue: r.revenue,
      })),
    };
  },
};
