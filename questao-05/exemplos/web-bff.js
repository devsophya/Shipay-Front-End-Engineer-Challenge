const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 300 });

const MS_CATALOG = process.env.MS_CATALOG_URL || 'http://catalog-service:3001';
const MS_USERS = process.env.MS_USERS_URL || 'http://users-service:3002';
const MS_STREAMING = process.env.MS_STREAMING_URL || 'http://streaming-service:3003';


app.get('/api/web/home', async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `web-home-${userId}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [userPreferences, userHistory, trendingMovies, newReleases] = await Promise.all([
      axios.get(`${MS_USERS}/users/${userId}/preferences`),
      axios.get(`${MS_USERS}/users/${userId}/history`),
      axios.get(`${MS_CATALOG}/movies/trending?limit=50`),
      axios.get(`${MS_CATALOG}/movies/new-releases?limit=50`)
    ]);

    const recommendations = await generateRecommendations({
      preferences: userPreferences.data,
      history: userHistory.data,
      catalog: trendingMovies.data
    });

    const enrichedRecommendations = await Promise.all(
      recommendations.slice(0, 50).map(async (movie) => ({
        id: movie.id,
        title: movie.title,
        synopsis: movie.synopsis,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        rating: movie.averageRating,
        genres: movie.genres,
        
        cast: await getCastDetails(movie.id),
        director: movie.director,
        releaseYear: movie.releaseYear,
        duration: movie.durationMinutes,
        
        trailers: await getTrailers(movie.id),
        
        reviews: await getReviews(movie.id, { limit: 10 }),
        
        episodes: movie.type === 'series' ? await getEpisodes(movie.id) : null,
        
        matchScore: calculateMatchScore(movie, userPreferences.data)
      }))
    );

    const response = {
      recommendations: enrichedRecommendations,
      continueWatching: formatContinueWatching(userHistory.data),
      trending: formatTrending(trendingMovies.data.slice(0, 50)),
      newReleases: formatNewReleases(newReleases.data.slice(0, 50)),
      
      user: {
        name: userPreferences.data.name,
        profilePicture: userPreferences.data.profilePicture,
        plan: userPreferences.data.subscriptionPlan
      }
    };

    cache.set(cacheKey, response);

    res.json(response);

  } catch (error) {
    console.error('[Web BFF] Error loading home:', error);
    res.status(500).json({ 
      error: 'Failed to load home page',
      message: error.message 
    });
  }
});

// ============================================
// 2. BUSCA DETALHADA (WEB)
// ============================================
app.get('/api/web/search', async (req, res) => {
  try {
    const { query, filters } = req.query;
    const userId = req.user.id;

    const searchResults = await axios.get(`${MS_CATALOG}/search`, {
      params: {
        query,
        genres: filters?.genres,
        year: filters?.year,
        rating: filters?.rating,
        limit: 100 
      }
    });

    const enrichedResults = searchResults.data.map(movie => ({
      ...movie,
      alreadyWatched: checkIfWatched(movie.id, req.userHistory),
      inWatchlist: checkWatchlist(movie.id, req.userWatchlist)
    }));

    res.json({
      results: enrichedResults,
      totalCount: searchResults.data.length,
      appliedFilters: filters
    });

  } catch (error) {
    console.error('[Web BFF] Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================
// 3. DETALHES DO FILME (WEB)
// ============================================
app.get('/api/web/movies/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const userId = req.user.id;

    const [movieDetails, castAndCrew, reviews, similarMovies, userStatus] = await Promise.all([
      axios.get(`${MS_CATALOG}/movies/${movieId}`),
      axios.get(`${MS_CATALOG}/movies/${movieId}/cast`),
      axios.get(`${MS_CATALOG}/movies/${movieId}/reviews?limit=20`),
      axios.get(`${MS_CATALOG}/movies/${movieId}/similar?limit=10`),
      axios.get(`${MS_USERS}/users/${userId}/movie-status/${movieId}`)
    ]);

    res.json({
      ...movieDetails.data,
      
      cast: castAndCrew.data.cast,
      director: castAndCrew.data.director,
      writers: castAndCrew.data.writers,
      
      reviews: reviews.data,
      
      similar: similarMovies.data,
      
      watchProgress: userStatus.data.progress,
      inWatchlist: userStatus.data.inWatchlist,
      userRating: userStatus.data.rating,
      
      availableQualities: ['4K', '1080p', '720p', '480p']
    });

  } catch (error) {
    console.error('[Web BFF] Movie details error:', error);
    res.status(500).json({ error: 'Failed to load movie details' });
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function generateRecommendations({ preferences, history, catalog }) {
  const watchedIds = new Set(history.map(h => h.movieId));
  const preferredGenres = preferences.favoriteGenres || [];

  return catalog
    .filter(movie => !watchedIds.has(movie.id))
    .map(movie => ({
      ...movie,
      score: calculateScore(movie, preferences)
    }))
    .sort((a, b) => b.score - a.score);
}

function calculateScore(movie, preferences) {
  let score = movie.averageRating * 10;

  const genreMatch = movie.genres.some(g => 
    preferences.favoriteGenres?.includes(g)
  );
  if (genreMatch) score += 30;

  const yearDiff = new Date().getFullYear() - movie.releaseYear;
  if (yearDiff <= 1) score += 20;

  return score;
}

function calculateMatchScore(movie, preferences) {
  let match = 50;

  if (movie.genres.some(g => preferences.favoriteGenres?.includes(g))) {
    match += 30;
  }

  if (movie.averageRating >= 8) {
    match += 10;
  }

  if (preferences.preferredLanguages?.includes(movie.originalLanguage)) {
    match += 10;
  }

  return Math.min(match, 99);
}

async function getCastDetails(movieId) {
  try {
    const response = await axios.get(`${MS_CATALOG}/movies/${movieId}/cast`);
    return response.data.slice(0, 15);
  } catch (error) {
    return [];
  }
}

async function getTrailers(movieId) {
  try {
    const response = await axios.get(`${MS_CATALOG}/movies/${movieId}/trailers`);
    return response.data;
  } catch (error) {
    return [];
  }
}

async function getReviews(movieId, options = {}) {
  try {
    const response = await axios.get(`${MS_CATALOG}/movies/${movieId}/reviews`, {
      params: { limit: options.limit || 10 }
    });
    return response.data;
  } catch (error) {
    return [];
  }
}

async function getEpisodes(seriesId) {
  try {
    const response = await axios.get(`${MS_CATALOG}/series/${seriesId}/episodes`);
    return response.data;
  } catch (error) {
    return [];
  }
}

function formatContinueWatching(history) {
  return history
    .filter(item => item.progress > 0 && item.progress < 90)
    .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))
    .slice(0, 10);
}

function formatTrending(movies) {
  return movies.map(movie => ({
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    rating: movie.averageRating,
    trendingPosition: movie.trendingPosition
  }));
}

function formatNewReleases(movies) {
  return movies.map(movie => ({
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    releaseDate: movie.releaseDate,
    synopsis: movie.synopsis
  }));
}

function checkIfWatched(movieId, history) {
  return history?.some(item => item.movieId === movieId && item.progress >= 90);
}

function checkWatchlist(movieId, watchlist) {
  return watchlist?.some(item => item.movieId === movieId);
}

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = { id: 'user123' };
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Web BFF] Running on port ${PORT}`);
});

module.exports = app;
