const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class ProductService {
  constructor() {
    this.repo = new BaseRepository(db.products);
  }

  async create(data, userId) {
    return await this.repo.create({ ...data, createdBy: userId });
  }

  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.productType) query.productType = filters.productType;
    if (filters.search) {
      const safe = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: new RegExp(safe, 'i') },
        { description: new RegExp(safe, 'i') },
        { productType: new RegExp(safe, 'i') }
      ];
    }
    return await this.repo.find(query);
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async update(id, data) {
    return await this.repo.findByIdAndUpdate(id, data);
  }

  async delete(id) {
    return await this.repo.findByIdAndUpdate(id, { status: 'deleted' });
  }

  async getActive() {
    return await this.repo.find({ status: 'active' });
  }

  async getFeatured() {
    return await this.repo.find({ status: 'active', featured: true });
  }

  async getByCategory(category) {
    return await this.repo.find({ category, status: 'active' });
  }

  async updateStock(id, quantity) {
    const product = await this.repo.findById(id);
    if (!product) throw new Error('Product not found');
    return await this.repo.findByIdAndUpdate(id, { stock: quantity });
  }

  async count() {
    return await this.repo.count();
  }
}

module.exports = new ProductService();
