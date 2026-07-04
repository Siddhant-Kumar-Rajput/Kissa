/**
 * Frontend API client helper to interact with backend endpoints.
 */

// Basic helper to handle fetch responses and handle JSON/Errors
async function request(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${url}:`, error.message);
    throw error;
  }
}

export const api = {
  // Fetch list of states and accent colors
  fetchStates: () => request('/api/states'),

  // Get lat/lon for a city
  fetchCityCoords: (city) => request(`/api/city-coords?city=${encodeURIComponent(city)}`),

  // Get daily forecast for a given lat, lon and date
  fetchWeather: (lat, lon, date) => request(`/api/weather?lat=${lat}&lon=${lon}&date=${date}`),

  // Get Wikipedia REST summary for page title
  fetchWikiSummary: (title) => request(`/api/wiki-summary?title=${encodeURIComponent(title)}`),

  // Get local attractions from OpenTripMap
  fetchAttractions: (lat, lon) => request(`/api/attractions?lat=${lat}&lon=${lon}`),

  // POST request to generate GenAI cultural guide
  generateGuide: (payload) => request('/api/generate-guide', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // POST request to chat with local AI companion
  sendChatMessage: (payload) => request('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
};
