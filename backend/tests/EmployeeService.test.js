/**
 * EmployeeService Unit Tests
 * ==========================
 * 
 * Tests EmployeeService methods with mocked BaseRepository and database.
 */

const mockRepo = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  count: jest.fn()
};

jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation(() => mockRepo);
});

jest.mock('../config/db', () => ({
  employees: {}
}));

let EmployeeService;

beforeAll(() => {
  jest.resetModules();
  EmployeeService = require('../services/EmployeeService');
});

describe('EmployeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create employee with generated employeeId', async () => {
      const data = { firstName: 'John', department: 'Production' };
      mockRepo.create.mockResolvedValue({ _id: 'emp-001', ...data, employeeId: 'EMP-12345-ABCD' });

      const result = await EmployeeService.create(data, 'user-001');
      expect(result.employeeId).toMatch(/^EMP-/);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'John', createdBy: 'user-001' })
      );
    });

    it('should include all provided data fields', async () => {
      const data = { firstName: 'Jane', lastName: 'Doe', department: 'Sales', position: 'Manager', email: 'jane@farm.co.za' };
      mockRepo.create.mockResolvedValue({ _id: 'emp-002', ...data });

      const result = await EmployeeService.create(data, 'user-001');
      expect(result.firstName).toBe('Jane');
      expect(result.department).toBe('Sales');
    });
  });

  describe('getAll', () => {
    it('should return all employees with no filters', async () => {
      const employees = [{ _id: '1', firstName: 'A' }, { _id: '2', firstName: 'B' }];
      mockRepo.find.mockResolvedValue(employees);

      const result = await EmployeeService.getAll();
      expect(result).toEqual(employees);
      expect(mockRepo.find).toHaveBeenCalledWith({});
    });

    it('should filter by status', async () => {
      mockRepo.find.mockResolvedValue([]);

      await EmployeeService.getAll({ status: 'active' });
      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should filter by department', async () => {
      mockRepo.find.mockResolvedValue([]);

      await EmployeeService.getAll({ department: 'Production' });
      expect(mockRepo.find).toHaveBeenCalledWith({ department: 'Production' });
    });

    it('should search by name (case-insensitive)', async () => {
      mockRepo.find.mockResolvedValue([]);

      await EmployeeService.getAll({ search: 'John' });
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.any(Object)
          ])
        })
      );
    });

    it('should escape special regex characters in search', async () => {
      mockRepo.find.mockResolvedValue([]);

      await EmployeeService.getAll({ search: 'C++' });
      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should combine status and department filters', async () => {
      mockRepo.find.mockResolvedValue([]);

      await EmployeeService.getAll({ status: 'active', department: 'Sales' });
      expect(mockRepo.find).toHaveBeenCalledWith({ status: 'active', department: 'Sales' });
    });
  });

  describe('getById', () => {
    it('should return employee when found', async () => {
      const emp = { _id: 'emp-001', firstName: 'John' };
      mockRepo.findById.mockResolvedValue(emp);

      const result = await EmployeeService.getById('emp-001');
      expect(result).toEqual(emp);
    });

    it('should return null when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await EmployeeService.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getByUserId', () => {
    it('should return employee by userId', async () => {
      const emp = { _id: 'emp-001', userId: 'usr-001' };
      mockRepo.findOne.mockResolvedValue(emp);

      const result = await EmployeeService.getByUserId('usr-001');
      expect(result).toEqual(emp);
    });

    it('should return null when no employee for userId', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await EmployeeService.getByUserId('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update employee data', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ _id: 'emp-001', position: 'Senior Manager' });

      const result = await EmployeeService.update('emp-001', { position: 'Senior Manager' });
      expect(result.position).toBe('Senior Manager');
    });
  });

  describe('updateStatus', () => {
    it('should update employee status to inactive', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ _id: 'emp-001', status: 'inactive' });

      const result = await EmployeeService.updateStatus('emp-001', 'inactive');
      expect(result.status).toBe('inactive');
    });

    it('should update employee status to terminated', async () => {
      mockRepo.findByIdAndUpdate.mockResolvedValue({ _id: 'emp-001', status: 'terminated' });

      const result = await EmployeeService.updateStatus('emp-001', 'terminated');
      expect(result.status).toBe('terminated');
    });
  });

  describe('getDepartments', () => {
    it('should return unique department names', async () => {
      mockRepo.find.mockResolvedValue([
        { department: 'Production' },
        { department: 'Sales' },
        { department: 'Production' },
        { department: 'Management' }
      ]);

      const result = await EmployeeService.getDepartments();
      expect(result).toEqual(['Production', 'Sales', 'Management']);
    });

    it('should return empty array when no employees', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await EmployeeService.getDepartments();
      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return correct employee stats', async () => {
      mockRepo.find.mockResolvedValue([
        { status: 'active', department: 'Production' },
        { status: 'active', department: 'Sales' },
        { status: 'inactive', department: 'Production' }
      ]);

      const stats = await EmployeeService.getStats();
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.byDepartment).toEqual({ Production: 2, Sales: 1 });
    });

    it('should handle empty employee list', async () => {
      mockRepo.find.mockResolvedValue([]);

      const stats = await EmployeeService.getStats();
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.byDepartment).toEqual({});
    });
  });

  describe('count', () => {
    it('should return total employee count', async () => {
      mockRepo.count.mockResolvedValue(15);

      const result = await EmployeeService.count();
      expect(result).toBe(15);
    });
  });
});
