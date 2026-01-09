const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); 

const MS_CATALOG = process.env.MS_CATALOG_URL;
const MS_USERS = process.env.MS_USERS_URL;
const MS_STREAMING = process.env.MS_STREAMING_URL;

// ============================================
// 1. HOME - VERSÃO SMART TV
// ============================================
app.get('/api/tv/home', async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `tv-home-${userId}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [recommendations, continueWatching, categories] = await Promise.all([
      getRecommendationsForTV(userId),
      getContinueWatchingTV(userId),
      getCategoriesForTV()
    ]);

    const response = {
      featured: recommendations.slice(0, 20).map(movie => ({
        id: movie.id,
        title: movie.title,
        
        backdrop: movie.backdropUrl,
        
        rating: movie.averageRating,
        year: movie.releaseYear,
        duration: `${movie.durationMinutes}min`,
        
        synopsis: movie.synopsis.substring(0, 150) + '...',
        
        availableQualities: ['4K', '1080p'],
        
      })),
      
      continueWatching: continueWatching.map(item => ({
        id: item.movieId,
        title: item.title,
        backdrop: item.backdropUrl,
        progress: item.progress,
        
        remainingTime: calculateRemainingTime(item)
      })),
      
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        
        items: cat.items.slice(0, 20).map(movie => ({
          id: movie.id,
          title: movie.title,
          backdrop: movie.backdropUrl
        }))
      }))
    };

    cache.set(cacheKey, response, 600);

    res.json(response);

  } catch (error) {
    console.error('[TV BFF] Error:', error);
    res.status(500).json({ error: 'Failed to load home' });
  }
});

// ============================================
// 2. CATEGORIAS (TV - NAVEGAÇÃO SIMPLES)
// ============================================
app.get('/api/tv/categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    const category = await axios.get(`${MS_CATALOG}/categories/${categoryId}`, {
      params: {
        limit,
        offset: (page - 1) * limit
      }
    });

    const items = category.data.items.map(movie => ({
      id: movie.id,
      title: movie.title,
      backdrop: movie.backdropUrl,
      rating: movie.averageRating,
      year: movie.releaseYear
    }));

    res.json({
      category: {
        id: categoryId,
        name: category.data.name
      },
      items,
      page,
      hasMore: items.length === limit
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to load category' });
  }
});

// ============================================
// 3. DETALHES DO FILME (TV - FOCO EM ASSISTIR)
// ============================================
app.get('/api/tv/movies/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const userId = req.user.id;

    const [movieDetails, userStatus] = await Promise.all([
      axios.get(`${MS_CATALOG}/movies/${movieId}`),
      axios.get(`${MS_USERS}/users/${userId}/movie-status/${movieId}`)
    ]);

    res.json({
      id: movieDetails.data.id,
      title: movieDetails.data.title,
      
      backdrop: movieDetails.data.backdropUrl,
      
      synopsis: movieDetails.data.synopsis,
      rating: movieDetails.data.averageRating,
      year: movieDetails.data.releaseYear,
      duration: `${movieDetails.data.durationMinutes}min`,
      genres: movieDetails.data.genres,
      
      cast: movieDetails.data.cast?.slice(0, 5).map(a => a.name).join(', '),
      
      availableQualities: ['4K', '1080p', '720p'],
      
      progress: userStatus.data.progress,
      
      actions: [
        { type: 'play', label: 'Assistir' },
        { type: 'resume', label: 'Continuar', enabled: userStatus.data.progress > 0 },
        { type: 'watchlist', label: 'Minha Lista', enabled: !userStatus.data.inWatchlist }
      ]
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to load movie' });
  }
});

// ============================================
// 4. STREAM DE VÍDEO (TV - MELHOR QUALIDADE)
// ============================================
app.get('/api/tv/video/:id/stream', async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    const preferredQuality = req.query.quality || '4K';

    const streamData = await axios.get(`${MS_STREAMING}/videos/${videoId}/stream`, {
      params: {
        quality: preferredQuality,
        format: 'hls',
        deviceType: 'tv',
        hdr: true 
      }
    });

    res.json({
      streamUrl: streamData.data.url,
      quality: preferredQuality,
      
      availableQualities: ['4K', '1080p', '720p'],
      
      manifestUrl: streamData.data.manifestUrl,
      
      bufferSize: 30, 
      
      subtitles: streamData.data.subtitles,
      
      audioTracks: streamData.data.audioTracks
    });

  } catch (error) {
    console.error('[TV BFF] Stream error:', error);
    res.status(500).json({ error: 'Failed to get stream' });
  }
});

// ============================================
// 5. BUSCA (TV - COM TECLADO VIRTUAL)
// ============================================
app.get('/api/tv/search', async (req, res) => {
  try {
    const { query } = req.query;
    const limit = 20; 

    const searchResults = await axios.get(`${MS_CATALOG}/search`, {
      params: { query, limit }
    });

    const results = searchResults.data.map(movie => ({
      id: movie.id,
      title: movie.title,
      backdrop: movie.backdropUrl,
      year: movie.releaseYear,
      rating: movie.averageRating
    }));

    res.json({
      results,
      query,
      totalResults: results.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================
// 6. PRÉ-CACHE (TV - OTIMIZAÇÃO DE NAVEGAÇÃO)
// ============================================
app.get('/api/tv/prefetch', async (req, res) => {
  try {
    const { movieIds } = req.query; 
    const userId = req.user.id;

    const prefetchData = await Promise.all(
      movieIds.split(',').map(async (id) => {
        const movie = await axios.get(`${MS_CATALOG}/movies/${id}`);
        return {
          id,
          title: movie.data.title,
          synopsis: movie.data.synopsis.substring(0, 150),
          backdrop: movie.data.backdropUrl
        };
      })
    );

    res.json({ prefetched: prefetchData });

  } catch (error) {
    res.status(500).json({ error: 'Prefetch failed' });
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function getRecommendationsForTV(userId) {
  const [preferences, catalog] = await Promise.all([
    axios.get(`${MS_USERS}/users/${userId}/preferences`),
    axios.get(`${MS_CATALOG}/movies/trending`, { params: { limit: 50 } })
  ]);

  return catalog.data;
}

async function getContinueWatchingTV(userId) {
  const history = await axios.get(`${MS_USERS}/users/${userId}/history`);
  
  return history.data
    .filter(item => item.progress > 0 && item.progress < 90)
    .slice(0, 5);
}

async function getCategoriesForTV() {
  const categories = await axios.get(`${MS_CATALOG}/categories`);
  
  const categoriesWithItems = await Promise.all(
    categories.data.slice(0, 10).map(async (cat) => {
      const items = await axios.get(`${MS_CATALOG}/categories/${cat.id}/items`, {
        params: { limit: 20 }
      });
      
      return {
        id: cat.id,
        name: cat.name,
        items: items.data
      };
    })
  );

  return categoriesWithItems;
}

function calculateRemainingTime(historyItem) {
  const totalMinutes = historyItem.durationMinutes;
  const watchedMinutes = Math.floor(totalMinutes * historyItem.progress / 100);
  const remaining = totalMinutes - watchedMinutes;
  
  return `${remaining}min restantes`;
}

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[TV BFF] Running on port ${PORT}`);
});

module.exports = app;
