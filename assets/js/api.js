/**
 * API Client Layer
 * ================
 * 
 * SRS Reference: FR-001 through FR-023 - All API Communication
 * 
 * Centralized HTTP client for all frontend-to-backend communication.
 * Provides authentication, session management, and method-specific
 * request helpers.
 * 
 * Architecture:
 *   - Singleton Pattern: Single `api` object with nested namespace modules
 *   - Bearer Token Auth: JWT token stored in localStorage
 *   - Session Timeout: 30-minute inactivity timer
 *   - Auto-Logout: 401/403 responses trigger forced logout
 * 
 * Coding Principles Demonstrated:
 *   1. DRY (Don't Repeat Yourself)
 *      - Common HTTP logic extracted to get/post/put/delete helpers
 *      - All 401/403 handling centralized in one place
 * 
 *   2. Single Responsibility
 *      - Each namespace (api.auth, api.production, etc.) handles one domain
 *      - getLoginPath/getHomePath handle path resolution separately
 * 
 *   3. Fail-Safe Design
 *      - checkSession() runs before every request
 *      - Network errors return structured { success, message } objects
 *      - No thrown exceptions - all errors caught and returned
 * 
 *   4. Separation of Concerns
 *      - HTTP layer (this file) separate from UI (admin.js)
 *      - Authentication logic separate from data fetching
 * 
 * Session Management:
 *   - Timer resets on: click, keypress, mousemove, scroll
 *   - Stored in: localStorage (token, user, lastActivity)
 *   - Expired when: Date.now() - lastActivity > SESSION_TIMEOUT
 * 
 * API Namespace Structure:
 *   api.auth         - Authentication (login, register, logout)
 *   api.production   - Production cycles, daily logs, health checks
 *   api.inventory    - Inventory CRUD, adjustments, transfers
 *   api.orders       - Order management and status
 *   api.users        - User management (admin)
 *   api.analytics    - Production, sales, inventory analytics
 *   api.compliance   - Quality checks, compliance records, audits
 *   api.harvest      - Harvest and processing batches
 *   api.crm          - Customer profiles, loyalty, feedback, campaigns
 *   api.config       - System configuration (FR-022)
 *   api.data         - Backup, restore, export, validation (FR-023)
 *   api.products     - Product catalog CRUD
 *   api.cart         - Shopping cart operations
 *   api.payments     - Payment processing
 *   api.employees    - Employee management
 *   api.notifications - Notification CRUD and bulk actions
 *   api.systemLogs   - System log querying and cleanup (FR-023)
 *   api.apiKeys      - API key management
 *   api.notificationConfigs - Notification template configuration (FR-022)
 *   api.medication   - Medication tracking
 */

// Base URL for all API requests
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : '/api';

// Session timeout: 30 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Global session timer reference
let sessionTimer = null;

// =========================================================================
// PATH RESOLUTION
// =========================================================================

/**
 * Determine the correct login path based on current page location.
 * 
 * Principle: Context-Aware Routing
 * Different page directories require different relative paths to login.
 * 
 * @returns {string} Relative path to login.html
 */
function getLoginPath() {
  const path = window.location.pathname;
  if (path.includes('/pages/public/')) return 'login.html';
  if (path.includes('/pages/admin/')) return '../public/login.html';
  if (path.includes('/pages/staff/')) return '../public/login.html';
  if (path.includes('/pages/dashboard/')) return '../public/login.html';
  return 'login.html';
}

/**
 * Determine the correct home path based on current page location.
 * 
 * @returns {string} Relative path to home page
 */
function getHomePath() {
  const path = window.location.pathname;
  if (path.includes('/pages/public/')) return 'index.html';
  if (path.includes('/pages/admin/')) return 'dashboard.html';
  if (path.includes('/pages/staff/')) return 'poultry.html';
  if (path.includes('/pages/dashboard/')) return 'customer.html';
  return 'index.html';
}

// =========================================================================
// SESSION MANAGEMENT
// =========================================================================

/**
 * Reset the inactivity timer. Called on every user interaction.
 * 
 * Principle: Sliding Window Timeout
 * Each user action (click, keypress, etc.) resets the timer,
 * ensuring the session only expires during actual inactivity.
 */
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

/**
 * Check if the current session is still valid.
 * 
 * @returns {boolean} true if session is valid, false if expired
 */
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

// Register activity listeners for session timeout
// Principle: Event Delegation - single listener handles all activity types
['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
  document.addEventListener(event, () => {
    if (localStorage.getItem('token')) resetSessionTimer();
  }, { passive: true }); // passive: true improves scroll performance
});

// Start timer if user is already logged in
if (localStorage.getItem('token')) resetSessionTimer();

// =========================================================================
// HTTP CLIENT
// =========================================================================

/**
 * Main API client object.
 * 
 * Pattern: Namespace Object
 * Each domain (auth, production, etc.) is a nested object with
 * method-specific functions that call the generic HTTP helpers.
 */
const api = {
  /**
   * Get the stored JWT token.
   * @returns {string|null} JWT token or null
   */
  getToken: () => localStorage.getItem('token'),

  /**
   * Store the JWT token and start session timer.
   * @param {string} token - JWT token from login response
   */
  setToken: (token) => {
    localStorage.setItem('token', token);
    resetSessionTimer();
  },

  /**
   * Clear all authentication data and stop session timer.
   */
  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    if (sessionTimer) clearTimeout(sessionTimer);
  },

  /**
   * Build request headers with JWT token.
   * 
   * Principle: Lazy Header Construction
   * Token is read from localStorage at request time (not cached),
   * ensuring fresh token state for every request.
   * 
   * @returns {Object} Headers object with Content-Type and optional Authorization
   */
  headers: () => {
    const token = localStorage.getItem('token');
    if (token) resetSessionTimer();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  },

  /**
   * Generic GET request with session and auth handling.
   * 
   * @param {string} endpoint - API endpoint (e.g., '/config')
   * @returns {Promise<Object>} Response JSON or error object
   */
  get: async (endpoint) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: api.headers()
      });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return result;
      }
      return result;
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Generic POST request.
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response JSON
   */
  post: async (endpoint, data) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: api.headers(),
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) {
        if (endpoint !== '/auth/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = getLoginPath();
        }
        return result;
      }
      return result;
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Generic PUT request.
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response JSON
   */
  put: async (endpoint, data) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: api.headers(),
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return result;
      }
      return result;
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * Generic DELETE request (no body).
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response JSON
   */
  delete: async (endpoint) => {
    if (!checkSession()) return { success: false, message: 'Session expired' };
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: api.headers()
      });
      const result = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return result;
      }
      return result;
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  /**
   * DELETE request with JSON body.
   * 
   * Principle: HTTP Compliance
   * DELETE with body is non-standard but needed for operations like
   * clearing old logs where the body specifies criteria.
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response JSON
   */
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
      const result = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = getLoginPath();
        return result;
      }
      return result;
    } catch (e) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  },

  // =========================================================================
  // API NAMESPACES
  // =========================================================================

  /** FR-001/002/003: Authentication endpoints */
  auth: {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    googleLogin: (credential) => api.post('/auth/google', { credential }),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
  },

  /** FR-004/005: Production cycle and daily log endpoints */
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

  /** FR-008/009: Inventory management endpoints */
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

  /** FR-010/011/012/014: Order management endpoints */
  orders: {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
    getAllOrders: () => api.get('/orders/all')
  },

  /** FR-015: User management endpoints */
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

  /** FR-017/018/019: Analytics and reporting endpoints */
  analytics: {
    getProduction: () => api.get('/analytics/production'),
    getSales: () => api.get('/analytics/sales'),
    getInventory: () => api.get('/analytics/inventory'),
    getDashboard: () => api.get('/analytics/dashboard'),
    getProfitLoss: () => api.get('/analytics/profit-loss'),
    getInventoryAging: () => api.get('/analytics/inventory-aging')
  },

  /** FR-020/021: Quality control and compliance endpoints */
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

  /** FR-007: Harvest and processing batch endpoints */
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

  /** FR-016: CRM endpoints (profiles, loyalty, feedback, campaigns) */
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

  /** FR-022: System configuration endpoints */
  config: {
    getAll: () => api.get('/config'),
    get: (key) => api.get(`/config/${key}`),
    update: (data) => api.put('/config', data)
  },

  /** FR-023: Data management endpoints (backup, restore, export, validation) */
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

  /** FR-010: Product catalog endpoints */
  products: {
    getAll: (params) => api.get(`/products?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/products/${id}`),
    getActive: () => api.get('/products/active'),
    getFeatured: () => api.get('/products/featured'),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
  },

  /** FR-010/011: Shopping cart endpoints */
  cart: {
    get: () => api.get('/cart'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
    removeItem: (productId) => api.delete(`/cart/items/${productId}`),
    clear: () => api.delete('/cart')
  },

  /** FR-013: Payment processing endpoints */
  payments: {
    getAll: (params) => api.get(`/payments?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/payments/${id}`),
    create: (data) => api.post('/payments', data),
    process: (id) => api.put(`/payments/${id}/process`),
    refund: (id, reason) => api.put(`/payments/${id}/refund`, { reason }),
    getStats: () => api.get('/payments/stats')
  },

  /** PayFast payment gateway endpoints */
  payfast: {
    init: (orderId) => api.post('/payfast/init', { orderId }),
    getStatus: (orderId) => api.get(`/payfast/status/${orderId}`)
  },

  /** FR-015: Employee management endpoints */
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

  /** FR-016: Notification endpoints */
  notifications: {
    getAll: (params) => api.get(`/notifications?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/notifications/${id}`),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
    /**
     * Clear all notifications by deleting each one individually.
     * 
     * Principle: Workaround for Missing Bulk Delete
     * The API doesn't have a single "clear all" endpoint, so we
     * iterate and delete each notification. This is a pragmatic
     * solution that trades efficiency for simplicity.
     */
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

  /** FR-023: System log endpoints */
  systemLogs: {
    getAll: (params) => api.get(`/system-logs?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/system-logs/${id}`),
    getRecent: (limit) => api.get(`/system-logs/recent?limit=${limit || 100}`),
    getErrors: (limit) => api.get(`/system-logs/errors?limit=${limit || 50}`),
    getByLevel: (level) => api.get(`/system-logs/level/${level}`),
    getByUser: (userId) => api.get(`/system-logs/user/${userId}`),
    getByCategory: (category) => api.get(`/system-logs/category/${category}`),
    /** Uses deleteWithBody because DELETE with body is needed for criteria-based cleanup */
    clearOld: (days) => api.deleteWithBody('/system-logs/clear-old', { days })
  },

  /** FR-022: API key management endpoints */
  apiKeys: {
    getAll: (params) => api.get(`/api-keys?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/api-keys/${id}`),
    create: (data) => api.post('/api-keys', data),
    update: (id, data) => api.put(`/api-keys/${id}`, data),
    revoke: (id) => api.put(`/api-keys/${id}/revoke`),
    activate: (id) => api.put(`/api-keys/${id}/activate`),
    delete: (id) => api.delete(`/api-keys/${id}`)
  },

  /** FR-022: Notification template configuration endpoints */
  notificationConfigs: {
    getAll: (params) => api.get(`/notification-configs?${new URLSearchParams(params || {})}`),
    getById: (id) => api.get(`/notification-configs/${id}`),
    create: (data) => api.post('/notification-configs', data),
    update: (id, data) => api.put(`/notification-configs/${id}`, data),
    toggle: (id) => api.put(`/notification-configs/${id}/toggle`),
    delete: (id) => api.delete(`/notification-configs/${id}`)
  },

  /** FR-006: Medication tracking endpoints */
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

// CommonJS export for Node.js testing compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}