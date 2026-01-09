
const apiService = require('../services/api.service');
const authService = require('../services/auth.service');

jest.mock('../services/auth.service');
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    apiService.clearCache();
    apiService.pendingRequests.clear();
    fetch.mockClear();
    authService.getValidToken.mockResolvedValue('token123');
  });

  describe('request()', () => {
    test('deve fazer requisição autenticada com sucesso', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const result = await apiService.request('/test');

      expect(authService.getValidToken).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123'
          })
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    test('deve usar cache em requisições GET', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const result1 = await apiService.request('/test');
      expect(fetch).toHaveBeenCalledTimes(1);

      const result2 = await apiService.request('/test');
      expect(fetch).toHaveBeenCalledTimes(1);
      
      expect(result1).toEqual(result2);
    });

    test('NÃO deve usar cache em requisições POST', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiService.request('/test', { method: 'POST' });
      
      await apiService.request('/test', { method: 'POST' });
      
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('deve deduplificar requisições simultâneas', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const promises = [
        apiService.request('/test'),
        apiService.request('/test'),
        apiService.request('/test')
      ];

      const results = await Promise.all(promises);

      expect(fetch).toHaveBeenCalledTimes(1);
      
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });

    test('deve fazer retry em caso de erro 500', async () => {
      fetch.mockRejectedValueOnce(new Error('Internal Server Error'));
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const result = await apiService.request('/test');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'test' });
    });

    test('NÃO deve fazer retry em erro 400', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad Request' })
      });

      await expect(apiService.request('/test')).rejects.toThrow();
      
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('deve renovar token e retry em erro 401', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      authService.forceRefresh = jest.fn().mockResolvedValue('newToken456');
      authService.getValidToken.mockResolvedValue('newToken456');

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const result = await apiService.request('/test');

      expect(authService.forceRefresh).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('batchRequest()', () => {
    test('deve executar múltiplas requisições em paralelo', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const requests = [
        { endpoint: '/endpoint1' },
        { endpoint: '/endpoint2' },
        { endpoint: '/endpoint3' }
      ];

      const results = await apiService.batchRequest(requests);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ data: 'test' });
      });
    });

    test('deve tratar erros individuais no batch', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success1' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Error' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success3' })
        });

      const requests = [
        { endpoint: '/endpoint1' },
        { endpoint: '/endpoint2' },
        { endpoint: '/endpoint3' }
      ];

      const results = await apiService.batchRequest(requests);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('clearCache()', () => {
    test('deve limpar todo cache quando chamado sem argumentos', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiService.request('/test1');
      await apiService.request('/test2');

      expect(apiService.responseCache.size).toBe(2);

      apiService.clearCache();

      expect(apiService.responseCache.size).toBe(0);
    });

    test('deve limpar apenas cache que contém pattern', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiService.request('/leads/produtos');
      await apiService.request('/leads/cargos');
      await apiService.request('/config/settings');

      expect(apiService.responseCache.size).toBe(3);

      apiService.clearCache('/leads');

      expect(apiService.responseCache.size).toBe(1);
    });
  });
});
