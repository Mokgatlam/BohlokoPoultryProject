/**
 * ProductService Unit Tests
 * =========================
 * 
 * SRS Reference: FR-010 (Product Catalog)
 * 
 * Tests ProductService methods with mocked Knex database.
 */

const { products } = require('./__fixtures__');

function createKnexMock(returnValue) {
  const chain = {
    _result: returnValue,
    where: jest.fn(() => chain),
    first: jest.fn(() => Promise.resolve(returnValue)),
    insert: jest.fn(() => Promise.resolve([1])),
    update: jest.fn(() => Promise.resolve(1)),
    select: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    count: jest.fn(() => chain),
    distinct: jest.fn(() => chain),
    then: jest.fn((resolve) => resolve(returnValue)),
    mockReturnThis: function() { return this; }
  };
  return chain;
}

let mockKnexFn;
let mockChain;

beforeAll(() => {
  jest.resetModules();
  mockChain = createKnexMock([]);
  mockKnexFn = jest.fn(() => mockChain);
  jest.mock('../config/db', () => mockKnexFn);
  jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-product-uuid-001') }));
});

describe('ProductService', () => {
  let ProductService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChain = createKnexMock([]);
    mockKnexFn.mockReturnValue(mockChain);
    ProductService = require('../services/ProductService');
  });

  describe('create', () => {
    it('should create product with auto-generated slug', async () => {
      const data = { name: 'Whole Chicken', price: 89.99 };
      const result = await ProductService.create(data, 'test-admin-001');
      expect(result.name).toBe('Whole Chicken');
      expect(result.slug).toBe('whole-chicken');
      expect(result.price).toBe(89.99);
      expect(result.id).toBe('test-product-uuid-001');
    });

    it('should set default unit to pieces', async () => {
      const result = await ProductService.create({ name: 'Test', price: 50 }, 'user-1');
      expect(result.unit).toBe('pieces');
    });

    it('should set available to true by default', async () => {
      const result = await ProductService.create({ name: 'Test', price: 50 }, 'user-1');
      expect(result.available).toBe(true);
    });

    it('should set tiered pricing from base price', async () => {
      const result = await ProductService.create({ name: 'Test', price: 100 }, 'user-1');
      expect(result.price_consumer).toBe(100);
      expect(result.price_restaurant).toBe(100);
      expect(result.price_retailer).toBe(100);
      expect(result.price_distributor).toBe(100);
    });

    it('should use provided slug if given', async () => {
      const result = await ProductService.create({ name: 'Test', slug: 'custom-slug', price: 50 }, 'user-1');
      expect(result.slug).toBe('custom-slug');
    });

    it('should store created_by userId', async () => {
      const result = await ProductService.create({ name: 'Test', price: 50 }, 'admin-id');
      expect(result.created_by).toBe('admin-id');
    });
  });

  describe('getAll', () => {
    it('should return all products with no filters', async () => {
      const mockProducts = [products.wholeChicken, products.chickenBreast];
      mockChain = createKnexMock(mockProducts);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getAll();
      expect(result).toEqual(mockProducts);
    });

    it('should filter by status active', async () => {
      mockChain = createKnexMock([products.wholeChicken]);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getAll({ status: 'active' });
      expect(mockChain.where).toHaveBeenCalledWith('available', true);
      expect(result).toEqual([products.wholeChicken]);
    });

    it('should filter by status inactive', async () => {
      mockChain = createKnexMock([products.inactiveProduct]);
      mockKnexFn.mockReturnValue(mockChain);

      await ProductService.getAll({ status: 'inactive' });
      expect(mockChain.where).toHaveBeenCalledWith('available', false);
    });

    it('should filter by category', async () => {
      mockChain = createKnexMock([products.chickenBreast]);
      mockKnexFn.mockReturnValue(mockChain);

      await ProductService.getAll({ category: 'Portions' });
      expect(mockChain.where).toHaveBeenCalledWith('category', 'Portions');
    });

    it('should filter featured products', async () => {
      mockChain = createKnexMock([products.wholeChicken]);
      mockKnexFn.mockReturnValue(mockChain);

      await ProductService.getAll({ featured: 'true' });
      expect(mockChain.where).toHaveBeenCalledWith('featured', true);
    });

    it('should apply sorting', async () => {
      mockChain = createKnexMock([]);
      mockKnexFn.mockReturnValue(mockChain);

      await ProductService.getAll({ sort: 'price:desc' });
      expect(mockChain.orderBy).toHaveBeenCalledWith('price', 'desc');
    });

    it('should apply limit', async () => {
      mockChain = createKnexMock([]);
      mockKnexFn.mockReturnValue(mockChain);

      await ProductService.getAll({ limit: '5' });
      expect(mockChain.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('getById', () => {
    it('should return product when found', async () => {
      mockChain = createKnexMock(products.wholeChicken);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getById('test-prod-001');
      expect(result).toEqual(products.wholeChicken);
    });

    it('should return null when not found', async () => {
      mockChain = createKnexMock(undefined);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getBySlug', () => {
    it('should return product by slug', async () => {
      mockChain = createKnexMock(products.wholeChicken);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getBySlug('whole-chicken');
      expect(result).toEqual(products.wholeChicken);
    });

    it('should return null for nonexistent slug', async () => {
      mockChain = createKnexMock(undefined);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getBySlug('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should prevent overwriting id, created_by, created_at', async () => {
      const updated = { ...products.wholeChicken, name: 'Updated Chicken' };
      mockChain = createKnexMock(updated);
      mockChain.first = jest.fn(() => Promise.resolve(updated));
      mockKnexFn.mockReturnValue(mockChain);

      await ProductService.update('test-prod-001', {
        name: 'Updated Chicken',
        id: 'hacked-id',
        created_by: 'hacker',
        created_at: new Date()
      });

      expect(mockChain.update).toHaveBeenCalled();
      const updateArg = mockChain.update.mock.calls[0][0];
      expect(updateArg.id).toBeUndefined();
      expect(updateArg.created_by).toBeUndefined();
      expect(updateArg.created_at).toBeUndefined();
      expect(updateArg.name).toBe('Updated Chicken');
    });
  });

  describe('delete', () => {
    it('should soft-delete by setting available to false', async () => {
      mockChain = createKnexMock({});
      mockKnexFn.mockReturnValue(mockChain);

      await ProductService.delete('test-prod-001');
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ available: false })
      );
    });
  });

  describe('getActive', () => {
    it('should return only available products', async () => {
      mockChain = createKnexMock([products.wholeChicken]);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getActive();
      expect(mockChain.where).toHaveBeenCalledWith('available', true);
      expect(result).toHaveLength(1);
    });
  });

  describe('getFeatured', () => {
    it('should return available and featured products', async () => {
      mockChain = createKnexMock([products.wholeChicken]);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getFeatured();
      expect(mockChain.where).toHaveBeenCalledWith('available', true);
      expect(mockChain.where).toHaveBeenCalledWith('featured', true);
    });
  });

  describe('getByCategory', () => {
    it('should return products in the given category', async () => {
      mockChain = createKnexMock([products.chickenBreast]);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getByCategory('Portions');
      expect(mockChain.where).toHaveBeenCalledWith('category', 'Portions');
    });
  });

  describe('getCategories', () => {
    it('should return distinct categories', async () => {
      mockChain = createKnexMock([{ category: 'Processed' }, { category: 'Portions' }]);
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.getCategories();
      expect(result).toEqual(['Processed', 'Portions']);
    });
  });

  describe('updateStock', () => {
    it('should throw if product not found', async () => {
      mockChain = createKnexMock(undefined);
      mockKnexFn.mockReturnValue(mockChain);

      await expect(ProductService.updateStock('nonexistent', 10))
        .rejects.toThrow('Product not found');
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      mockChain = createKnexMock({ count: 4 });
      mockKnexFn.mockReturnValue(mockChain);

      const result = await ProductService.count();
      expect(result).toBe(4);
    });
  });
});
