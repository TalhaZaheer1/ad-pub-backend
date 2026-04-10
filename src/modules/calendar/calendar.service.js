const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

const getHebrewDateString = (date) => {
  return new Intl.DateTimeFormat('en-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

const getCalendarIssues = async (companyId, startDate, endDate) => {
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required.', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const issues = await prisma.publicationIssue.findMany({
    where: {
      companyId,
      issueDate: {
        gte: start,
        lte: end
      }
    },
    include: {
      publicationType: {
        select: { name: true }
      },
      _count: {
        select: { adUnits: true }
      },
      adUnits: {
        select: { status: true, designStatus: true }
      }
    },
    orderBy: { issueDate: 'asc' }
  });

  const dateMap = {};
  const now = new Date();

  let current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    dateMap[dateStr] = {
      date: dateStr,
      hebrewDate: getHebrewDateString(current),
      issues: []
    };
    current.setUTCDate(current.getUTCDate() + 1);
  }

  for (const issue of issues) {
    const dateStr = issue.issueDate.toISOString().split('T')[0];

    let readyCount = 0;
    let pendingCount = 0;
    let inDesignCount = 0;
    let printedCount = 0;
    let publishedCount = 0;

    for (const ad of issue.adUnits) {
      if (ad.status === 'READY') readyCount++;
      else if (ad.status === 'IN_REVIEW') pendingCount++;
      else if (ad.status === "PRINTED") printedCount++;
      else if (ad.status === "PUBLISHED") publishedCount++;

      if (ad.designStatus === 'IN_DESIGN') inDesignCount++;
    }

    const deadlinePassed = issue.deadlineAt < now;

    const mappedIssue = {
      id: issue.id,
      title: issue.title,
      publishingType: issue.publicationType.name,
      status: issue.status,
      deadline: issue.deadlineAt.toISOString(),
      deadlinePassed,
      isLocked: issue.isLocked,
      stats: {
        total: issue._count.adUnits,
        ready: readyCount,
        pending: pendingCount,
        inDesign: inDesignCount,
        printed: printedCount,
        published: publishedCount
      }
    };

    if (dateMap[dateStr]) {
      dateMap[dateStr].issues.push(mappedIssue);
    } else {
      dateMap[dateStr] = {
        date: dateStr,
        hebrewDate: getHebrewDateString(issue.issueDate),
        issues: [mappedIssue]
      };
    }
  }

  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
};

module.exports = { getCalendarIssues };
