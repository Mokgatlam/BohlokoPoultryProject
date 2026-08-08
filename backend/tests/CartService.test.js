/**
 * CartService Unit Tests
 * ======================
 * 
 * SRS Reference: FR-010 (Product Catalog), FR-011 (Order Placement)
 * 
 * Tests CartService input validation and delegation to Cart model.
 * Covers item addition, quantity updates, removal, and cart summary.
 * 
 * Mock Strategy: Cart model mock
 */

const mockCart = {
  getOrCreate: jest.fn(),
  addItem: jest.fn(),
  updateItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getSummary: jest.fn()
};

jest.mock('../models/Cart', () => mockCart);

let CartService;

beforeAll(() => {
  jest.resetModules();
  CartService = require('../services/CartService');
});

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return existing cart for user', async () => {
      const mockCartData = { userId: 'user-001', items: [] };
      mockCart.getOrCreate.mockResolvedValue(mockCartData);

      const result = await CartService.getCart('user-001');

      expect(mockCart.getOrCreate).toHaveBeenCalledWith('user-001');
      expect(result).toEqual(mockCartData);
    });

    it('should create new cart if none exists', async () => {
      const newCart = { userId: 'user-002', items: [] };
      mockCart.getOrCreate.mockResolvedValue(newCart);

      const result = await CartService.getCart('user-002');

      expect(result.items).toHaveLength(0);
    });
  });

  describe('addItem', () => {
    it('should add item to cart with valid data', async () => {
      const updatedCart = { userId: 'user-001', items: [{ productId: 'prod-001', quantity: 2 }] };
      mockCart.addItem.mockResolvedValue(updatedCart);

      const result = await CartService.addItem('user-001', 'prod-001', 2, 89.99, 'Whole Chicken', '/img.jpg');

      expect(mockCart.addItem).toHaveBeenCalledWith('user-001', 'prod-001', 2, 89.99, 'Whole Chicken', '/img.jpg');
      expect(result).toEqual(updatedCart);
    });

    it('should throw if productId is missing', async () => {
      await expect(CartService.addItem('user-001', null, 1, 50, 'Product', null))
        .rejects.toThrow('Product ID is required');
    });

    it('should throw if quantity is not a positive number', async () => {
      await expect(CartService.addItem('user-001', 'prod-001', 0, 50, 'Product', null))
        .rejects.toThrow('Quantity must be a positive number');
    });

    it('should throw if quantity is negative', async () => {
      await expect(CartService.addItem('user-001', 'prod-001', -5, 50, 'Product', null))
        .rejects.toThrow('Quantity must be a positive number');
    });

    it('should throw if quantity exceeds 999', async () => {
      await expect(CartService.addItem('user-001', 'prod-001', 1000, 50, 'Product', null))
        .rejects.toThrow('Quantity exceeds maximum limit');
    });

    it('should throw if price is negative', async () => {
      await expect(CartService.addItem('user-001', 'prod-001', 1, -10, 'Product', null))
        .rejects.toThrow('Invalid price');
    });

    it('should accept zero price (free items)', async () => {
      mockCart.addItem.mockResolvedValue({ items: [] });

      const result = await CartService.addItem('user-001', 'prod-001', 1, 0, 'Free Item', null);

      expect(mockCart.addItem).toHaveBeenCalled();
    });

    it('should accumulate quantity if item already in cart', async () => {
      const cartWithItem = { items: [{ productId: 'prod-001', quantity: 3 }] };
      mockCart.addItem.mockResolvedValue(cartWithItem);

      const result = await CartService.addItem('user-001', 'prod-001', 2, 50, 'Product', null);

      expect(result.items[0].quantity).toBe(3);
    });
  });

  describe('updateItem', () => {
    it('should update item quantity', async () => {
      const updatedCart = { items: [{ productId: 'prod-001', quantity: 5 }] };
      mockCart.updateItem.mockResolvedValue(updatedCart);

      const result = await CartService.updateItem('user-001', 'prod-001', 5);

      expect(mockCart.updateItem).toHaveBeenCalledWith('user-001', 'prod-001', 5);
      expect(result).toEqual(updatedCart);
    });

    it('should remove item when quantity is 0', async () => {
      const emptyCart = { items: [] };
      mockCart.updateItem.mockResolvedValue(emptyCart);

      const result = await CartService.updateItem('user-001', 'prod-001', 0);

      expect(mockCart.updateItem).toHaveBeenCalledWith('user-001', 'prod-001', 0);
      expect(result.items).toHaveLength(0);
    });

    it('should throw if productId is missing', async () => {
      await expect(CartService.updateItem('user-001', null, 5))
        .rejects.toThrow('Product ID is required');
    });

    it('should throw if quantity is not a valid number', async () => {
      await expect(CartService.updateItem('user-001', 'prod-001', 'abc'))
        .rejects.toThrow('Invalid quantity');
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const emptyCart = { items: [] };
      mockCart.removeItem.mockResolvedValue(emptyCart);

      const result = await CartService.removeItem('user-001', 'prod-001');

      expect(mockCart.removeItem).toHaveBeenCalledWith('user-001', 'prod-001');
      expect(result.items).toHaveLength(0);
    });

    it('should throw if productId is missing', async () => {
      await expect(CartService.removeItem('user-001', null))
        .rejects.toThrow('Product ID is required');
    });
  });

  describe('clear', () => {
    it('should clear all items from cart', async () => {
      mockCart.clear.mockResolvedValue();

      await CartService.clear('user-001');

      expect(mockCart.clear).toHaveBeenCalledWith('user-001');
    });
  });

  describe('getSummary', () => {
    it('should return cart summary with totals', async () => {
      const summary = {
        items: [{ productId: 'prod-001', quantity: 2, price: 89.99 }],
        total: 179.98,
        itemCount: 2,
        updatedAt: new Date()
      };
      mockCart.getSummary.mockResolvedValue(summary);

      const result = await CartService.getSummary('user-001');

      expect(mockCart.getSummary).toHaveBeenCalledWith('user-001');
      expect(result.total).toBe(179.98);
      expect(result.itemCount).toBe(2);
    });
  });
});
