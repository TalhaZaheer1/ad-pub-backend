const express = require('express');
const router = express.Router();
const adSizeController = require('./adSize.controller.js');
const authenticate = require('../../middlewares/authenticate.js');
const companyScope = require('../../middlewares/companyScope.js');
const authorize = require('../../middlewares/authorize.js');

// All ad-size routes are protected and require company context
router.use(authenticate);
router.use(companyScope);
router.use(authorize());

router.get('/', adSizeController.getAll);
router.post('/', adSizeController.create);
router.put('/:id', adSizeController.update);
router.delete('/:id', adSizeController.deleteSize);

module.exports = router;
