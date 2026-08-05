const API_BASE_URL = 'http://localhost:5000/api';
const SESSION_TIMEOUT = 30 * 60 * 1000;
let sessionTimer = null;

function getLoginPath() {
  const path = window.location.pathname;
  if (path.includes('/pages/public/')) return 'login.html';
  if (path.includes('/pages/admin/')) return '../public/login.html';
  if (path.includes('/pages/staff/')) return '../public/login.html';
  if (path.includes('/pages/dashboard/')) return '../public/login.html';
  return 'login.html';
}

function getHomePath() {
  const path = window.location.pathname;
  if (path.includes('/pages/public/')) return 'index.html';
  if (path.includes('/pages/admin/')) return 'dashboard.html';
  if (path.includes('/pages/staff/')) return 'poultry.html';
  if (path.includes('/pages/dashboard/')) return 'customer.html';
  return 'index.html';
}

function resetSessionTimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    alert('Session expired due to inactivity. Please login again.');
    window.location.href = getLoginPath();
  }, SESSION_TIMEOUT);
  localStorage.setItem('lastActivity', Date.now());
}

function checkSession() {
  const token = localStorage.getItem('token');
  const lastActivity = localStorage.getItem('lastActivity');
  if (token && lastActivity) {
    const elapsed = Date.now() - parseInt(lastActivity);
    if (elapsed > SESSION_TIMEOUT) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      alert('Session expired. Please login again.');
      window.location.href = getLoginPath();
      return false;
    }
  }
  return true;
}

['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
  document.addEventListener(event, () => {
    if (localStorage.getItem('token')) resetSessionTimer();
  }, { passive: true });
});

if (localStorage.getItem('token')) resetSessionTimer();

const api = {
  getToken: () => localStorage.getItem('token'),
  
  setToken: (token) => {
    localStorage.setItem('token', token);
    resetSessionTimer();
  },
  
  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    if (sessionTimer) clearTimeout(sessionTimer);
  },
  
  headers: () => {
    const token = localStorage.getItem('token');
    if (token) resetSessionTimer();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  },

  get: async (endpoint) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: api.headers()
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return { success: false, message: 'Unauthorized' };
      }
      return response.json();
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  post: async (endpoint, data) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: api.headers(),
        body: JSON.stringify(data)
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return { success: false, message: 'Unauthorized' };
      }
      return response.json();
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  put: async (endpoint, data) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: api.headers(),
        body: JSON.stringify(data)
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return { success: false, message: 'Unauthorized' };
      }
      return response.json();
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  delete: async (endpoint) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: api.headers()
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return { success: false, message: 'Unauthorized' };
      }
      return response.json();
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  deleteWithBody: async (endpoint, data) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          ...api.headers(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return { success: false, message: 'Unauthorized' };
      }
      return response.json();
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  auth: {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
  },

  production: {
    getCycles: () => api.get('/production/cycles'),
    getCycle: (id) => api.get(`/production/cycles/${id}`),
    createCycle: (data) => api.post('/production/cycles', data),
    updateCycle: (id, data) => api.put(`/production/cycles/${id}`, data),
    approveCycle: (id) => api.put(`/production/cycles/${id}/approve`),
    getDailyLogs: (cycleId) => api.get(`/production/daily-logs/${cycleId}`),
    createDailyLog: (data) => api.post('/production/daily-logs', data),
    getMedications: (cycleId) => api.get(`/production/medications/${cycleId}`),
    createMedication: (data) => api.post('/production/medications', data),
    getHealthChecks: (cycleId) => api.get(`/production/health-checks/${cycleId}`),
    createHealthCheck: (data) => api.post('/production/health-checks', data),
    getVaccinations: (cycleId) => api.get(`/production/vaccinations/${cycleId}`),
    createVaccination: (data) => api.post('/production/vaccinations', data),
    completeVaccination: (id) => api.put(`/production/vaccinations/${id}/complete`),
    getWeightRecords: (cycleId) => api.get(`/production/weight-records/${cycleId}`),
    createWeightRecord: (data) => api.post('/production/weight-records', data),
    getFeedRecords: (cycleId) => api.get(`/production/feed-records/${cycleId}`),
    createFeedRecord: (data) => api.post('/production/feed-records', data),
    getEnvironmentRecords: (cycleId) => api.get(`/production/environment-records/${cycleId}`),
    createEnvironmentRecord: (data) => api.post('/production/environment-records', data),
    getCareDashboard: () => api.get('/production/care-dashboard')
  },

  inventory: {
    getAll: (params) => api.get(`/inventory?${new URLSearchParams(params)}`),
    create: (data) => api.post('/inventory', data),
    getLowStock: () => api.get('/inventory/low-stock'),
    adjust: (id, data) => api.put(`/inventory/${id}/adjust`, data),
    transfer: (id, data) => api.put(`/inventory/${id}/transfer`, data),
    getTransfers: () => api.get('/inventory/transfers'),
    getPickingList: (orderId) => api.get(`/inventory/picking-list/${orderId}`),
    getReport: () => api.get('/inventory/report')
  },

  orders: {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
    getAllOrders: () => api.get('/orders/all')
  },

  users: {
    getAll: (params) => api.get(`/users?${new URLSearchParams(params)}`),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    updateStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
    updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
    updateProfile: (id, data) => api.put(`/users/${id}/profile`, data),
    delete: (id) => api.delete(`/users/${id}`),
    getPending: () => api.get('/users/pending'),
    getStats: () => api.get('/users/stats'),
    bulkUpdateStatus: (ids, status) => api.put('/users/bulk/status', { ids, status })
  },

  analytics: {
    getProduction: () => api.get('/analytics/production'),
    getSales: () => api.get('/analytics/sales'),
    getInventory: () => api.get('/analytics/inventory'),
    getDashboard: () => api.get('/analytics/dashboard'),
    getProfitLoss: () => api.get('/analytics/profit-loss'),
    getInventoryAging: () => api.get('/analytics/inventory-aging')
  },

  compliance: {
    getQualityChecks: (params) => api.get(`/compliance/quality-checks?${new URLSearchParams(params)}`),
    createQualityCheck: (data) => api.post('/compliance/quality-checks', data),
    addCorrectiveAction: (id, data) => api.put(`/compliance/quality-checks/${id}/corrective-action`, data),
    getRecords: (params) => api.get(`/compliance/records?${new URLSearchParams(params)}`),
    createRecord: (data) => api.post('/compliance/records', data),
    getAudits: (params) => api.get(`/compliance/audits?${new URLSearchParams(params)}`),
    createAudit: (data) => api.post('/compliance/audits', data),
    getReport: () => api.get('/compliance/report')
  },

  harvest: {
    getDashboard: () => api.get('/harvest/harvest-dashboard'),
    getHarvestBatches: (params) => api.get(`/harvest/harvest-batches?${new URLSearchParams(params || {})}`),
    getHarvestBatch: (id) => api.get(`/harvest/harvest-batches/${id}`),
    createHarvestBatch: (data) => api.post('/harvest/harvest-batches', data),
    updateHarvestBatch: (id, data) => api.put(`/harvest/harvest-batches/${id}`, data),
    startHarvest: (id) => api.put(`/harvest/harvest-batches/${id}/start`),
    completeHarvest: (id, data) => api.put(`/harvest/harvest-batches/${id}/complete`, data),
    getProcessingBatches: (params) => api.get(`/harvest/processing-batches?${new URLSearchParams(params || {})}`),
    getProcessingBatch: (id) => api.get(`/harvest/processing-batches/${id}`),
    createProcessingBatch: (data) => api.post('/harvest/processing-batches', data),
    updateProcessingBatch: (id, data) => api.put(`/harvest/processing-batches/${id}`, data),
    startProcessing: (id) => api.put(`/harvest/processing-batches/${id}/start`),
    completeProcessing: (id, data) => api.put(`/harvest/processing-batches/${id}/complete`, data),
    getProcessingSteps: (batchId) => api.get(`/harvest/processing-steps/${batchId}`),
    createProcessingStep: (data) => api.post('/harvest/processing-steps', data),
    completeStep: (id, data) => api.put(`/harvest/processing-steps/${id}/complete`, data),
    getYieldRecords: (params) => api.get(`/harvest/yield-records?${new URLSearchParams(params || {})}`),
    createYieldRecord: (data) => api.post('/harvest/yield-records', data),
    getQualityChecks: (batchId) => api.get(`/harvest/quality-checks/${batchId}`),
    createQualityCheck: (data) => api.post('/harvest/quality-checks', data),
    getStaffAssignments: (batchId) => api.get(`/harvest/staff-assignments/${batchId}`),
    createStaffAssignment: (data) => api.post('/harvest/staff-assignments', data)
  },

  crm: {
    getDashboard: () => api.get('/crm/dashboard'),
    getProfile: (id) => api.get(`/crm/profile/${id}`),
    getMyProfile: () => api.get('/crm/profile/me'),
    updateProfile: (id, data) => api.put(`/crm/profile/${id}`, data),
    searchCustomers: (q) => api.get(`/crm/customers/search?q=${encodeURIComponent(q)}`),
    getAllCustomers: () => api.get('/crm/customers'),
    getSegment: (segment) => api.get(`/crm/customers/segment/${segment}`),
    exportCustomers: () => api.get('/crm/customers/export'),
    enrollLoyalty: (data) => api.post('/crm/loyalty/enroll', data),
    getLoyaltyRewards: (profileId) => api.get(`/crm/loyalty/rewards/${profileId}`),
    getAvailableRewards: () => api.get('/crm/loyalty/rewards/available'),
    getPointsTransactions: (profileId) => api.get(`/crm/loyalty/transactions/${profileId}`),
    submitFeedback: (data) => api.post('/crm/feedback', data),
    getAllFeedback: () => api.get('/crm/feedback'),
    getFeedbackStats: () => api.get('/crm/feedback/stats'),
    respondToFeedback: (id, data) => api.put(`/crm/feedback/${id}/respond`, data),
    resolveFeedback: (id) => api.put(`/crm/feedback/${id}/resolve`),
    createCampaign: (data) => api.post('/crm/campaigns', data),
    getAllCampaigns: () => api.get('/crm/campaigns'),
    activateCampaign: (id) => api.put(`/crm/campaigns/${id}/activate`),
    pauseCampaign: (id) => api.put(`/crm/campaigns/${id}/pause`),
    getCampaignPerformance: (id) => api.get(`/crm/campaigns/${id}/performance`)
  },

  config: {
    getAll: () => api.get('/config'),
    get: (key) => api.get(`/config/${key}`),
    update: (data) => api.put('/config', data)
  },

  data: {
    createBackup: (data) => api.post('/data/backup', data),
    getBackups: () => api.get('/data/backups'),
    restoreBackup: (filename) => api.post(`/data/backup/restore/${filename}`),
    deleteBackup: (filename) => api.delete(`/data/backup/${filename}`),
    exportData: (type, format) => api.get(`/data/export/${type}?format=${format || 'json'}`),
    validate: (collection, data) => api.post('/data/validate', { collection, data }),
    checkIntegrity: () => api.get('/data/validate/integrity'),
    createArchive: (data) => api.post('/data/archive', data),
    getArchives: () => api.get('/data/archives'),
    getArchive: (filename) => api.get(`/data/archive/${filename}`),
    exportMigration: (data) => api.post('/data/migration/export', data),
    getMigrations: () => api.get('/data/migrations'),
    getStats: () => api.get('/data/stats')
  },

  products: {
    getAll: (params) => api.get(`/products?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/products/${id}`),
    getActive: () => api.get('/products/active'),
    getFeatured: () => api.get('/products/featured'),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
  },

  cart: {
    get: () => api.get('/cart'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
    removeItem: (productId) => api.delete(`/cart/items/${productId}`),
    clear: () => api.delete('/cart')
  },

  payments: {
    getAll: (params) => api.get(`/payments?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/payments/${id}`),
    create: (data) => api.post('/payments', data),
    process: (id) => api.put(`/payments/${id}/process`),
    refund: (id, reason) => api.put(`/payments/${id}/refund`, { reason }),
    getStats: () => api.get('/payments/stats')
  },

  employees: {
    getAll: (params) => api.get(`/employees?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/employees/${id}`),
    getByUser: (userId) => api.get(`/employees/user/${userId}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    updateStatus: (id, status) => api.put(`/employees/${id}/status`, { status }),
    getDepartments: () => api.get('/employees/departments'),
    getStats: () => api.get('/employees/stats')
  },

  notifications: {
    getAll: (params) => api.get(`/notifications?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/notifications/${id}`),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
    clearAll: async () => {
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        for (const n of res.data) {
          await api.delete(`/notifications/${n._id}`);
        }
      }
      return { success: true };
    }
  },

  systemLogs: {
    getAll: (params) => api.get(`/system-logs?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/system-logs/${id}`),
    getRecent: (limit) => api.get(`/system-logs/recent?limit=${limit || 100}`),
    getErrors: (limit) => api.get(`/system-logs/errors?limit=${limit || 50}`),
    getByLevel: (level) => api.get(`/system-logs/level/${level}`),
    getByUser: (userId) => api.get(`/system-logs/user/${userId}`),
    getByCategory: (category) => api.get(`/system-logs/category/${category}`),
    clearOld: (days) => api.deleteWithBody('/system-logs/clear-old', { days })
  },

  apiKeys: {
    getAll: (params) => api.get(`/api-keys?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/api-keys/${id}`),
    create: (data) => api.post('/api-keys', data),
    update: (id, data) => api.put(`/api-keys/${id}`, data),
    revoke: (id) => api.put(`/api-keys/${id}/revoke`),
    activate: (id) => api.put(`/api-keys/${id}/activate`),
    delete: (id) => api.delete(`/api-keys/${id}`)
  },

  notificationConfigs: {
    getAll: (params) => api.get(`/notification-configs?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/notification-configs/${id}`),
    create: (data) => api.post('/notification-configs', data),
    update: (id, data) => api.put(`/notification-configs/${id}`, data),
    toggle: (id) => api.put(`/notification-configs/${id}/toggle`),
    delete: (id) => api.delete(`/notification-configs/${id}`)
  },

  medication: {
    getAll: (params) => api.get(`/medication?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/medication/${id}`),
    getActive: () => api.get('/medication/active'),
    getExpiring: (days) => api.get(`/medication/expiring?days=${days || 30}`),
    getByCycle: (cycleId) => api.get(`/medication/cycle/${cycleId}`),
    create: (data) => api.post('/medication', data),
    update: (id, data) => api.put(`/medication/${id}`, data),
    complete: (id) => api.put(`/medication/${id}/complete`),
    cancel: (id, reason) => api.put(`/medication/${id}/cancel`, { reason })
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
