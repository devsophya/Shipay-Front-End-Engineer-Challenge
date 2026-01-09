
class AuthService {
  constructor() {
    this.tokenCache = {
      access_token: null,
      access_token_expires_at: null,
      refresh_token: null,
      refresh_token_expires_at: null,
      promise: null
    };

    this.credentials = {
      access_key: process.env.API_ACCESS_KEY,
      secret_key: process.env.API_SECRET_KEY
    };

    this.authUrl = process.env.API_AUTH_URL || 'https://api.acme.com/auth';
    
    this.REFRESH_BUFFER_SECONDS = 300;
  }

  async getValidToken() {
    if (this.isTokenValid()) {
      return this.tokenCache.access_token;
    }

    if (this.tokenCache.promise) {
      await this.tokenCache.promise;
      return this.tokenCache.access_token;
    }

    this.tokenCache.promise = this.authenticate();

    try {
      await this.tokenCache.promise;
      return this.tokenCache.access_token;
    } finally {
      this.tokenCache.promise = null;
    }
  }

  isTokenValid() {
    if (!this.tokenCache.access_token) {
      return false;
    }

    const now = Date.now();
    const expiresAt = this.tokenCache.access_token_expires_at;

    return expiresAt && now < (expiresAt - this.REFRESH_BUFFER_SECONDS * 1000);
  }

  async authenticate() {
    try {
      console.log('[AuthService] Autenticando com API...');

      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Auth failed: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new Error('Invalid auth response: missing access_token');
      }

      const now = Date.now();
      
      this.tokenCache = {
        access_token: data.access_token,
        access_token_expires_at: now + (data.access_token_expires_in * 1000),
        refresh_token: data.refresh_token,
        refresh_token_expires_at: now + (data.refresh_token_expires_in * 1000),
        promise: null
      };

      console.log('[AuthService] Autenticado com sucesso. Token válido por:', data.access_token_expires_in, 'segundos');

      return data.access_token;

    } catch (error) {
      console.error('[AuthService] Erro na autenticação:', error);
      this.clearCache();
      throw error;
    }
  }

  async refreshToken() {
    if (!this.tokenCache.refresh_token) {
      return this.authenticate();
    }

    try {
      const response = await fetch(`${this.authUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.tokenCache.refresh_token
        }),
      });

      if (!response.ok) {
        return this.authenticate();
      }

      const data = await response.json();
      const now = Date.now();

      this.tokenCache.access_token = data.access_token;
      this.tokenCache.access_token_expires_at = now + (data.access_token_expires_in * 1000);

      return data.access_token;

    } catch (error) {
      console.error('[AuthService] Erro no refresh, tentando autenticação completa:', error);
      return this.authenticate();
    }
  }

  clearCache() {
    this.tokenCache = {
      access_token: null,
      access_token_expires_at: null,
      refresh_token: null,
      refresh_token_expires_at: null,
      promise: null
    };
  }

  async forceRefresh() {
    this.clearCache();
    return this.getValidToken();
  }
}

const authService = new AuthService();

module.exports = authService;
