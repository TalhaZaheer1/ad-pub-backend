const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const companyRoutes = require('../modules/companies/company.routes');
const userRoutes = require('../modules/users/user.routes');
const customerRoutes = require('../modules/customers/customer.routes');
const publicationTypeRoutes = require('../modules/publicationTypes/publicationType.routes');
const calendarRoutes = require('../modules/calendar/calendar.routes');
const publicationIssueRoutes = require('../modules/publicationIssues/publicationIssue.routes');
const pricingRoutes = require('../modules/pricing/pricing.routes');
const announcementTemplateRoutes = require('../modules/announcementTemplates/announcementTemplate.routes');
const adTypeRoutes = require('../modules/adTypes/adType.routes');
const companyCustomerRoutes = require('../modules/companyCustomers/companyCustomer.routes');
const invoiceRoutes = require('../modules/invoices/invoice.routes');
const adUnitRoutes = require('../modules/adUnits/adUnit.routes');
const adSizeRoutes = require('../modules/adSizes/adSize.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/publication-types', publicationTypeRoutes);
router.use('/calendar', calendarRoutes);
router.use('/publication-issues', publicationIssueRoutes);
router.use('/pricing-rules', pricingRoutes);
router.use('/announcement-templates', announcementTemplateRoutes);
router.use('/ad-types', adTypeRoutes);
router.use('/crm/customers', companyCustomerRoutes);
router.use('/billing/invoices', invoiceRoutes);
router.use('/ad-units', adUnitRoutes);
router.use('/ad-sizes', adSizeRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is running.', data: { timestamp: new Date().toISOString() } });
});

module.exports = router;

