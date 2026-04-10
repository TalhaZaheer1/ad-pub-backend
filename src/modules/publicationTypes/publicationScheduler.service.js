const prisma = require('../../config/database');
const { PublicationFrequency } = require('@prisma/client');

/**
 * Maps Day names to JavaScript Date.getDay() values
 */
const DAY_MAP = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

/**
 * Gets the Hebrew Date string from a standard Date
 */
const getHebrewDateString = (date) => {
  // We use the Intl API with the Hebrew calendar to generate a formatted string
  return new Intl.DateTimeFormat('en-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

/**
 * Utility to generate a list of issue dates based on rules
 */
const generateIssueDates = (pubType, monthsAhead = 6) => {
  const dates = [];
  const now = new Date();
  // Strip time for clean daily calculations
  now.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setUTCMonth(endDate.getUTCMonth() + monthsAhead);

  if (pubType.frequency === PublicationFrequency.SPECIAL) {
    if (pubType.specialPublicationDate && pubType.specialPublicationDate >= now) {
      dates.push(new Date(pubType.specialPublicationDate));
    }
    return dates;
  }

  // We iterate day by day up to endDate
  const current = new Date(now);

  while (current <= endDate) {
    let shouldAdd = false;

    if (pubType.frequency === PublicationFrequency.DAILY) {
      // Assume 7 days a week for now
      shouldAdd = true;
    }
    else if (pubType.frequency === PublicationFrequency.WEEKLY && pubType.defaultPublishDay) {
      const targetDay = DAY_MAP[pubType.defaultPublishDay];
      if (current.getUTCDay() === targetDay) {
        shouldAdd = true;
      }
    }
    else if (pubType.frequency === PublicationFrequency.MONTHLY) {
      const targetDate = pubType.defaultPublishDate || 1;
      const maxDaysInMonth = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)).getUTCDate();
      const actualTargetDate = Math.min(targetDate, maxDaysInMonth);

      if (current.getUTCDate() === actualTargetDate) {
        shouldAdd = true;
      }
    }
    else if (pubType.frequency === PublicationFrequency.QUARTERLY) {
      const targetDate = pubType.defaultPublishDate || 1;
      const maxDaysInMonth = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)).getUTCDate();
      const actualTargetDate = Math.min(targetDate, maxDaysInMonth);

      // Jan (0), Apr (3), Jul (6), Oct (9)
      const quarterMonths = [0, 3, 6, 9];
      if (quarterMonths.includes(current.getUTCMonth()) && current.getUTCDate() === actualTargetDate) {
        shouldAdd = true;
      }
    }

    if (shouldAdd) {
      dates.push(new Date(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

/**
 * Schedules upcoming issues for a given publication type
 */
const scheduleIssues = async (companyId, publicationTypeId) => {
  const pubType = await prisma.publicationType.findFirst({
    where: { id: publicationTypeId, companyId }
  });

  if (!pubType || !pubType.isActive) return;

  // TODO:Get company to potentially use timezone in the future if we need strict localization hours.
  // Right now, simply storing UTC midnight dates is standard.
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  const issueDates = generateIssueDates(pubType);

  for (const issueDate of issueDates) {
    // deadline is 3 days before issue
    const deadlineAt = new Date(issueDate);
    deadlineAt.setUTCDate(deadlineAt.getUTCDate() - 1);

    const hebrewDateStr = getHebrewDateString(issueDate);

    let titleDateStr = issueDate.toISOString().split('T')[0];
    const title = `${pubType.name} - ${titleDateStr}`;

    // Upsert to avoid duplicates if it exists
    const existing = await prisma.publicationIssue.findFirst({
      where: {
        publicationTypeId: pubType.id,
        issueDate: issueDate
      }
    });

    if (!existing) {
      await prisma.publicationIssue.create({
        data: {
          companyId: pubType.companyId,
          publicationTypeId: pubType.id,
          title,
          issueDate: issueDate,
          deadlineAt: deadlineAt,
          status: 'SCHEDULED',
          hebrewDate: hebrewDateStr,
          isLocked: false
        }
      });
    }
  }
};

module.exports = { scheduleIssues };
