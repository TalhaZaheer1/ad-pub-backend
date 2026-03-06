const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const companyRoutes = require('../modules/companies/company.routes');
const userRoutes = require('../modules/users/user.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is running.', data: { timestamp: new Date().toISOString() } });
});

module.exports = router;
