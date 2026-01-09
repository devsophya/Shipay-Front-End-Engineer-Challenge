const authService = require('./auth.service');

class ApiService {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://api.acme.com';
    
    this.responseCache = new Map();
    
    this.pendingRequests = new Map();
    
    this.config = {
      timeout: 30000, 
      retryAttempts: 3,
      retryDelay: 1000, 
      cacheTTL: 60000 
    };
  }


  async request(endpoint, options = {}) {
    const cacheKey = this.getCacheKey(endpoint, options);

    if (this.shouldUseCache(options)) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`[ApiService] Cache HIT: ${endpoint}`);
        return cached;
      }
    }

    if (this.pendingRequests.has(cacheKey)) {
      console.log(`[ApiService] Deduplicação: ${endpoint}`);
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this.executeRequest(endpoint, options);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      if (this.shouldUseCache(options)) {
        this.saveToCache(cacheKey, result);
      }

      return result;

    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async executeRequest(endpoint, options = {}) {
    const retryAttempts = options._retryAttempts || this.config.retryAttempts;
    const { retryDelay } = this.config;
    let lastError;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await this.makeAuthenticatedRequest(endpoint, options);
      } catch (error) {
        lastError = error;
        
        if (error.status >= 400 && error.status < 500 && error.status !== 401) {
          throw error;
        }

        if (attempt < retryAttempts) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.log(`[ApiService] Tentativa ${attempt} falhou. Retry em ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = await authService.getValidToken();

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[ApiService] Token expirado, renovando...');
          await authService.forceRefresh();
          
          const newToken = await authService.getValidToken();
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
              ...options.headers
            }
          });

          if (!retryResponse.ok) {
            throw await this.createError(retryResponse);
          }

          return retryResponse.json();
        }

        throw await this.createError(response);
      }

      return response.json();

    } finally {
      clearTimeout(timeoutId);
    }
  }

  async batchRequest(requests) {
    console.log(`[ApiService] Batch de ${requests.length} requisições`);
    
    const results = await Promise.allSettled(
      requests.map(req => this.request(req.endpoint, {
        ...req.options,
        _retryAttempts: 1  // Desabilita retries em batch para falhar rápido
      }))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { success: true, data: result.value };
      } else {
        console.error(`[ApiService] Erro no batch[${index}]:`, result.reason);
        return { success: false, error: result.reason };
      }
    });
  }

  getCacheKey(endpoint, options) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  getFromCache(key) {
    const cached = this.responseCache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.responseCache.delete(key);
      return null;
    }

    return cached.data;
  }

  saveToCache(key, data) {
    this.responseCache.set(key, {
      data,
      expiresAt: Date.now() + this.config.cacheTTL
    });
  }

  shouldUseCache(options) {
    return !options.method || options.method === 'GET';
  }

  clearCache(pattern) {
    if (pattern) {
      for (const key of this.responseCache.keys()) {
        if (key.includes(pattern)) {
          this.responseCache.delete(key);
        }
      }
    } else {
      this.responseCache.clear();
    }
  }

  async createError(response) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.code = body.code;
    return error;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const apiService = new ApiService();

module.exports = apiService;
