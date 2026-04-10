const prisma = require('../../config/database.js');

const getAll = async (companyId) => {
  return prisma.pricingRule.findMany({
    where: { companyId },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      publicationType: { select: { name: true } },
      adType: { select: { name: true } }
    }
  });
};

const create = async (companyId, data) => {
  return prisma.pricingRule.create({
    data: {
      companyId,
      ...data
    }
  });
};

const update = async (id, companyId, data) => {
  const rule = await prisma.pricingRule.findFirst({ where: { id, companyId } });
  if (!rule) throw { status: 404, message: "Rule not found" };

  return prisma.pricingRule.update({
    where: { id },
    data
  });
};

const deleteRule = async (id, companyId) => {
  const rule = await prisma.pricingRule.findFirst({ where: { id, companyId } });
  if (!rule) throw { status: 404, message: "Rule not found" };

  return prisma.pricingRule.delete({
    where: { id }
  });
};

const preview = async (companyId, input) => {
  const { publicationTypeId, adTypeId, adSizeName, area, colorProfile, customerData } = input;

  // Fetch all active rules for this company
  const now = new Date();
  const rules = await prisma.pricingRule.findMany({
    where: {
      companyId,
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: now } }
      ]
    },
    orderBy: { priority: 'desc' },
    include: {
      publicationType: { select: { name: true } },
      adType: { select: { name: true } }
    }
  });

  let basePrice = 0;
  const surcharges = [];
  const discounts = [];
  const taxes = [];
  let overrideLimits = [];

  // Helper to evaluate if rule matches the input vector
  // A rule matches if all strictly defined dimensions match
  const ruleMatches = (rule) => {
    if (rule.publicationTypeId && rule.publicationTypeId !== publicationTypeId) return false;
    if (rule.adTypeId && rule.adTypeId !== adTypeId) return false;
    if (rule.adSizeName && rule.adSizeName !== adSizeName) return false;
    if (rule.area && rule.area !== area) return false;
    if (rule.colorProfile && rule.colorProfile !== colorProfile) return false;

    // Custom condition matching
    if (rule.condition && Object.keys(rule.condition).length > 0) {
      // Simplified match: all K-V in condition must equal K-V in customerData
      if (!customerData) return false;
      for (const [key, val] of Object.entries(rule.condition)) {
        if (customerData[key] !== val) return false;
      }
    }
    return true;
  };

  // 1. Process Base Rate
  const baseRates = rules.filter(r => r.ruleType === 'BASE_RATE' && ruleMatches(r));
  if (baseRates.length > 0) {
    basePrice = parseFloat(baseRates[0].value);
  }

  let finalPrice = basePrice;
  let surchargeTotal = 0;
  let discountTotal = 0;

  // 2. Process Surcharges
  const surchargeRules = rules.filter(r => r.ruleType === 'SURCHARGE' && ruleMatches(r));
  for (const sRule of surchargeRules) {
    let val = parseFloat(sRule.value);
    if (sRule.discountType === 'PERCENTAGE') {
      val = basePrice * (val / 100);
    }
    surcharges.push({ ruleId: sRule.id, name: sRule.name, amount: val, type: 'SURCHARGE' });
    surchargeTotal += val;
  }

  finalPrice += surchargeTotal;

  // 3. Process Discounts
  const discountRules = rules.filter(r => r.ruleType === 'DISCOUNT' && ruleMatches(r));
  for (const dRule of discountRules) {
    let val = parseFloat(dRule.value);
    if (dRule.discountType === 'PERCENTAGE') {
      val = finalPrice * (val / 100);
    }
    discounts.push({ ruleId: dRule.id, name: dRule.name, amount: val, type: 'DISCOUNT' });
    discountTotal += val;
    finalPrice -= val; // We deduct discounts sequentially over the compounded price
  }

  // 4. Process Taxes
  const taxRules = rules.filter(r => r.ruleType === 'TAX' && ruleMatches(r));
  let taxTotal = 0;
  
  // Taxes are usually applied to the final discounted price
  for (const tRule of taxRules) {
    let val = parseFloat(tRule.value);
    if (tRule.discountType === 'PERCENTAGE') {
      val = finalPrice * (val / 100);
    }
    taxes.push({ ruleId: tRule.id, name: tRule.name, amount: val, type: 'TAX' });
    taxTotal += val;
  }
  
  // Note: We often keep tax separated from final core price, or add it to a grandTotal.
  // We'll return finalPrice (subtotal) and taxTotal separately, and generate a grandTotal.
  const grandTotal = finalPrice + taxTotal;

  // 5. Capture Overrides
  const overrideRules = rules.filter(r => r.ruleType === 'OVERRIDE_LIMIT' && ruleMatches(r));
  if (overrideRules.length > 0) {
    overrideLimits = overrideRules.map(r => ({ name: r.name, value: r.value, type: r.discountType }));
  }

  return {
    inputs: input,
    basePrice,
    surcharges,
    surchargeTotal,
    discounts,
    discountTotal,
    taxes,
    taxTotal,
    finalPrice: Math.max(0, grandTotal), // total billed amount
    subtotal: Math.max(0, finalPrice),
    overrideLimits
  };
};

module.exports = { getAll, create, update, deleteRule, preview };
