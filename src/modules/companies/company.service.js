const companyRepo = require('./company.repository');
const AppError = require('../../utils/AppError');

/**
 * Get all companies
 */
const getAllCompanies = async (query = {}) => {
    const isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined;
    return companyRepo.findAll({ isActive });
};

/**
 * Get one company by ID
 */
const getCompanyById = async (id) => {
    const company = await companyRepo.findById(id);
    if (!company) {
        throw new AppError('Company not found.', 404);
    }
    return company;
};

/**
 * Create a new company
 */
const createCompany = async (data) => {
    const existing = await companyRepo.findBySlug(data.slug);
    if (existing) {
        throw new AppError('A company with this slug already exists.', 409);
    }
    return companyRepo.create(data);
};

/**
 * Update a company
 */
const updateCompany = async (id, data) => {
    await getCompanyById(id); // ensure it exists

    if (data.slug) {
        const existing = await companyRepo.findBySlug(data.slug);
        if (existing && existing.id !== id) {
            throw new AppError('A company with this slug already exists.', 409);
        }
    }

    return companyRepo.update(id, data);
};

/**
 * Soft delete (deactivate) a company
 */
const deleteCompany = async (id) => {
    await getCompanyById(id); // ensure it exists
    return companyRepo.softDelete(id);
};

module.exports = { getAllCompanies, getCompanyById, createCompany, updateCompany, deleteCompany };
