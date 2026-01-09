const express = require('express');
const axios = require('axios');
const compression = require('compression');
const sharp = require('sharp');  
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 60 }); 

app.use(compression({ level: 9 }));

const MS_CATALOG = process.env.MS_CATALOG_URL;
const MS_USERS = process.env.MS_USERS_URL;
const MS_STREAMING = process.env.MS_STREAMING_URL;

// ============================================
// 1. HOME - VERSÃO MOBILE (LEVE E RÁPIDA)
// ============================================
app.get('/api/mobile/home', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const cacheKey = `mobile-home-${userId}-${page}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [recommendations, continueWatching] = await Promise.all([
      getRecommendationsForMobile(userId, page, limit),
      getContinueWatchingMobile(userId)
    ]);

    const response = {
      recommendations: recommendations.map(movie => ({
        id: movie.id,
        title: movie.title,
        
        thumbnail: optimizeImageForMobile(movie.posterUrl),
        
        rating: movie.averageRating,
        duration: `${movie.durationMinutes}min`,
        year: movie.releaseYear,
        
      })),
      
      continueWatching: continueWatching.map(item => ({
        id: item.movieId,
        title: item.title,
        thumbnail: optimizeImageForMobile(item.posterUrl),
        progress: item.progress
      })),
      
      page,
      hasMore: recommendations.length === limit
    };

    cache.set(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('[Mobile BFF] Error:', error);
    res.status(500).json({ error: 'Failed to load home' });
  }
});

// ============================================
// 2. NOVOS LANÇAMENTOS (MOBILE)
// ============================================
app.get('/api/mobile/new-releases', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const releases = await axios.get(`${MS_CATALOG}/movies/new-releases`, {
      params: {
        limit,
        offset: (page - 1) * limit
      }
    });

    const mobileFriendly = releases.data.map(movie => ({
      id: movie.id,
      title: movie.title,
      thumbnail: optimizeImageForMobile(movie.posterUrl),
      rating: movie.averageRating,
      duration: `${movie.durationMinutes}min`
    }));

    res.json({
      items: mobileFriendly,
      page,
      hasMore: releases.data.length === limit
    });

  } catch (error) {
    console.error('[Mobile BFF] New releases error:', error);
    res.status(500).json({ error: 'Failed to load releases' });
  }
});

// ============================================
// 3. BUSCA (MOBILE - SIMPLIFICADA)
// ============================================
app.get('/api/mobile/search', async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const searchResults = await axios.get(`${MS_CATALOG}/search`, {
      params: {
        query,
        limit,
        offset: (page - 1) * limit
      }
    });

    const results = searchResults.data.map(movie => ({
      id: movie.id,
      title: movie.title,
      thumbnail: optimizeImageForMobile(movie.posterUrl),
      year: movie.releaseYear,
      rating: movie.averageRating
    }));

    res.json({
      results,
      query,
      page,
      hasMore: results.length === limit
    });

  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================
// 4. DETALHES DO FILME (MOBILE - OTIMIZADO)
// ============================================
app.get('/api/mobile/movies/:id', async (req, res) => {
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
      
      poster: optimizeImageForMobile(movieDetails.data.posterUrl),
      backdrop: optimizeImageForMobile(movieDetails.data.backdropUrl, 'backdrop'),
      
      synopsis: movieDetails.data.synopsis.substring(0, 200) + '...',
      rating: movieDetails.data.averageRating,
      year: movieDetails.data.releaseYear,
      duration: `${movieDetails.data.durationMinutes}min`,
      genres: movieDetails.data.genres.slice(0, 3), 
      
      cast: movieDetails.data.cast?.slice(0, 5).map(actor => actor.name),
      
      progress: userStatus.data.progress,
      inWatchlist: userStatus.data.inWatchlist,
      
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to load movie' });
  }
});

// ============================================
// 5. STREAM DE VÍDEO (MOBILE - COM ADAPTAÇÃO)
// ============================================
app.get('/api/mobile/video/:id/stream', async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    const connectionSpeed = detectConnectionSpeed(req);
    const deviceType = req.headers['user-agent'];
    
    const networkHistory = await getUserNetworkHistory(userId);

    let quality;
    if (connectionSpeed < 1 || networkHistory.avgSpeed < 1) {
      quality = '360p';
    } else if (connectionSpeed < 3) {
      quality = '480p';
    } else if (connectionSpeed < 8) {
      quality = '720p';
    } else {
      quality = '1080p';
    }

    await saveNetworkMetrics(userId, connectionSpeed);

    const streamData = await axios.get(`${MS_STREAMING}/videos/${videoId}/stream`, {
      params: {
        quality,
        format: 'hls',
        deviceType: 'mobile'
      }
    });

    res.json({
      streamUrl: streamData.data.url,
      quality,
      
      availableQualities: ['360p', '480p', '720p', '1080p'],
      
      manifestUrl: streamData.data.manifestUrl,
      
      bufferSize: quality === '360p' ? 5 : 10, 
      
      subtitles: streamData.data.subtitles?.map(sub => ({
        language: sub.language,
        url: sub.url
      }))
    });

  } catch (error) {
    console.error('[Mobile BFF] Stream error:', error);
    res.status(500).json({ error: 'Failed to get stream' });
  }
});

// ============================================
// 6. REGISTRAR VISUALIZAÇÃO (PROXY)
// ============================================
app.post('/api/mobile/watch', async (req, res) => {
  try {
    const { videoId, progress, timestamp } = req.body;
    const userId = req.user.id;

    await axios.post(`${MS_USERS}/users/${userId}/watch`, {
      videoId,
      progress,
      timestamp,
      platform: 'mobile'
    });

    res.json({ success: true });

  } catch (error) {
    console.error('[Mobile BFF] Watch recording error:', error);
    res.status(500).json({ error: 'Failed to record watch' });
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function getRecommendationsForMobile(userId, page, limit) {
  const [preferences, history, catalog] = await Promise.all([
    axios.get(`${MS_USERS}/users/${userId}/preferences`),
    axios.get(`${MS_USERS}/users/${userId}/history`),
    axios.get(`${MS_CATALOG}/movies/trending`, {
      params: { 
        limit: limit * 3, 
        offset: (page - 1) * limit 
      }
    })
  ]);

  const watchedIds = new Set(history.data.map(h => h.movieId));

  return catalog.data
    .filter(movie => !watchedIds.has(movie.id))
    .slice(0, limit);
}

async function getContinueWatchingMobile(userId) {
  const history = await axios.get(`${MS_USERS}/users/${userId}/history`);
  
  return history.data
    .filter(item => item.progress > 0 && item.progress < 90)
    .slice(0, 5);  
}

/**
 * OTIMIZAÇÃO DE IMAGEM PARA MOBILE
 * Reduz tamanho da imagem para economizar dados
 */
function optimizeImageForMobile(imageUrl, type = 'poster') {
  if (!imageUrl) return null;

  const sizes = {
    poster: '200x300',   
    backdrop: '640x360'  
  };

  return `${imageUrl}?w=${sizes[type]}&q=75&format=webp`;
}

/**
 *  DETECTA VELOCIDADE DE CONEXÃO
 */
function detectConnectionSpeed(req) {
  
  const connectionType = req.headers['x-connection-type'];
  
  if (connectionType === '4g') return 10;  
  if (connectionType === '3g') return 3;   
  if (connectionType === '2g') return 0.5; 
  
  return 5;
}

async function getUserNetworkHistory(userId) {
  try {
    const response = await axios.get(`${MS_USERS}/users/${userId}/network-history`);
    return response.data;
  } catch (error) {
    return { avgSpeed: 5 }; 
  }
}

async function saveNetworkMetrics(userId, speed) {
  try {
    await axios.post(`${MS_USERS}/users/${userId}/network-metrics`, {
      speed,
      timestamp: new Date(),
      platform: 'mobile'
    });
  } catch (error) {
    console.error('Failed to save network metrics:', error);
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Mobile BFF] Running on port ${PORT}`);
});

module.exports = app;
