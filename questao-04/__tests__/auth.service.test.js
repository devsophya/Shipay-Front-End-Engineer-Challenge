
const authService = require('../services/auth.service');

global.fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    authService.clearCache();
    fetch.mockClear();
  });

  describe('authenticate()', () => {
    test('deve autenticar com sucesso', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token123',
          access_token_expires_in: 3600,
          refresh_token: 'refresh123',
          refresh_token_expires_in: 7200
        })
      });

      const token = await authService.authenticate();

      expect(token).toBe('token123');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
    });

    test('deve lançar erro se autenticação falhar', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid credentials' })
      });

      await expect(authService.authenticate()).rejects.toThrow('Auth failed');
    });

    test('deve limpar cache em caso de erro', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({})
      });

      await expect(authService.authenticate()).rejects.toThrow();
      expect(authService.tokenCache.access_token).toBeNull();
    });
  });

  describe('getValidToken()', () => {
    test('deve retornar token em cache se válido', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token123',
          access_token_expires_in: 3600,
          refresh_token: 'refresh123',
          refresh_token_expires_in: 7200
        })
      });

      const token1 = await authService.getValidToken();
      expect(fetch).toHaveBeenCalledTimes(1);

      const token2 = await authService.getValidToken();
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(token1).toBe(token2);
    });

    test('deve renovar token se expirado', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token123',
          access_token_expires_in: 1, 
          refresh_token: 'refresh123',
          refresh_token_expires_in: 7200
        })
      });

      await authService.getValidToken();

      await new Promise(resolve => setTimeout(resolve, 1100));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token456',
          access_token_expires_in: 3600,
          refresh_token: 'refresh456',
          refresh_token_expires_in: 7200
        })
      });

      const newToken = await authService.getValidToken();
      expect(newToken).toBe('token456');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('deve deduplificar múltiplas chamadas simultâneas', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token123',
          access_token_expires_in: 3600,
          refresh_token: 'refresh123',
          refresh_token_expires_in: 7200
        })
      });

      const promises = [
        authService.getValidToken(),
        authService.getValidToken(),
        authService.getValidToken()
      ];

      const tokens = await Promise.all(promises);

      expect(fetch).toHaveBeenCalledTimes(1);
      
      expect(tokens[0]).toBe(tokens[1]);
      expect(tokens[1]).toBe(tokens[2]);
    });
  });

  describe('isTokenValid()', () => {
    test('deve retornar false se não tem token', () => {
      expect(authService.isTokenValid()).toBe(false);
    });

    test('deve retornar false se token expirou', () => {
      authService.tokenCache.access_token = 'token123';
      authService.tokenCache.access_token_expires_at = Date.now() - 1000; 

      expect(authService.isTokenValid()).toBe(false);
    });

    test('deve retornar false se token está perto de expirar', () => {
      authService.tokenCache.access_token = 'token123';
      authService.tokenCache.access_token_expires_at = Date.now() + (4 * 60 * 1000);

      expect(authService.isTokenValid()).toBe(false);
    });

    test('deve retornar true se token é válido', () => {
      authService.tokenCache.access_token = 'token123';
      authService.tokenCache.access_token_expires_at = Date.now() + (60 * 60 * 1000);

      expect(authService.isTokenValid()).toBe(true);
    });
  });

  describe('forceRefresh()', () => {
    test('deve limpar cache e autenticar novamente', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token123',
          access_token_expires_in: 3600,
          refresh_token: 'refresh123',
          refresh_token_expires_in: 7200
        })
      });

      await authService.getValidToken();
      expect(authService.tokenCache.access_token).toBe('token123');

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'token456',
          access_token_expires_in: 3600,
          refresh_token: 'refresh456',
          refresh_token_expires_in: 7200
        })
      });

      const newToken = await authService.forceRefresh();
      
      expect(newToken).toBe('token456');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
