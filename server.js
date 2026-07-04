require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('./rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// State database with cultural accents and predefined cities with coordinates
const STATES_DATA = {
  "Rajasthan": {
    accentPrimary: "#E8A33D", // warm saffron/marigold
    accentSecondary: "#7A2E2E", // deep maroon
    wikiTitle: "Rajasthan",
    cities: [
      { name: "Jaipur", lat: 26.9196, lon: 75.7878 },
      { name: "Udaipur", lat: 24.5854, lon: 73.7125 },
      { name: "Jodhpur", lat: 26.2389, lon: 73.0243 },
      { name: "Jaisalmer", lat: 26.9157, lon: 70.9083 },
      { name: "Pushkar", lat: 26.4897, lon: 74.5511 },
      { name: "Bikaner", lat: 28.0166, lon: 73.3119 },
      { name: "Mount Abu", lat: 24.5925, lon: 72.7156 }
    ]
  },
  "Kerala": {
    accentPrimary: "#2F6E5C", // backwater green
    accentSecondary: "#EFE6D3", // coconut cream
    wikiTitle: "Kerala",
    cities: [
      { name: "Kochi", lat: 9.9312, lon: 76.2673 },
      { name: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
      { name: "Munnar", lat: 10.0889, lon: 77.0595 },
      { name: "Alleppey", lat: 9.4981, lon: 76.3388 },
      { name: "Wayanad", lat: 11.6854, lon: 76.1320 },
      { name: "Kovalam", lat: 8.4021, lon: 76.9787 },
      { name: "Kumarakom", lat: 9.5929, lon: 76.4226 }
    ]
  },
  "Goa": {
    accentPrimary: "#2C7DA0", // sea blue
    accentSecondary: "#F1E9DA", // whitewashed sand
    wikiTitle: "Goa",
    cities: [
      { name: "Panaji", lat: 15.4909, lon: 73.8278 },
      { name: "Calangute", lat: 15.5434, lon: 73.7554 },
      { name: "Margao", lat: 15.2736, lon: 73.9582 },
      { name: "Vasco da Gama", lat: 15.3997, lon: 73.8113 },
      { name: "Canacona", lat: 15.0061, lon: 74.0435 },
      { name: "Colva", lat: 15.2782, lon: 73.9168 },
      { name: "Mapusa", lat: 15.5937, lon: 73.8142 }
    ]
  },
  "Tamil Nadu": {
    accentPrimary: "#C9962C", // temple gold
    accentSecondary: "#1B4B4A", // deep teal
    wikiTitle: "Tamil Nadu",
    cities: [
      { name: "Chennai", lat: 13.0827, lon: 80.2707 },
      { name: "Madurai", lat: 9.9252, lon: 78.1198 },
      { name: "Ooty", lat: 11.4102, lon: 76.6950 },
      { name: "Kodaikanal", lat: 10.2381, lon: 77.4892 },
      { name: "Coimbatore", lat: 11.0168, lon: 76.9558 },
      { name: "Mahabalipuram", lat: 12.6269, lon: 80.1927 },
      { name: "Kanyakumari", lat: 8.0883, lon: 77.5385 }
    ]
  },
  "Uttar Pradesh": {
    accentPrimary: "#A8452F", // Mughal red sandstone
    accentSecondary: "#F3EFE9", // marble white
    wikiTitle: "Uttar Pradesh",
    cities: [
      { name: "Agra", lat: 27.1767, lon: 78.0081 },
      { name: "Varanasi", lat: 25.3176, lon: 82.9739 },
      { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
      { name: "Prayagraj", lat: 25.4358, lon: 81.8463 },
      { name: "Ayodhya", lat: 26.7922, lon: 82.1998 },
      { name: "Mathura", lat: 27.4924, lon: 77.6737 },
      { name: "Jhansi", lat: 25.4484, lon: 78.5685 }
    ]
  },
  "Uttarakhand": {
    accentPrimary: "#3C5B45", // pine green
    accentSecondary: "#E8ECEA", // snow grey
    wikiTitle: "Uttarakhand",
    cities: [
      { name: "Dehradun", lat: 30.3165, lon: 78.0322 },
      { name: "Rishikesh", lat: 30.0869, lon: 78.2676 },
      { name: "Haridwar", lat: 29.9457, lon: 78.1642 },
      { name: "Nainital", lat: 29.3803, lon: 79.4636 },
      { name: "Mussoorie", lat: 30.4598, lon: 78.0796 },
      { name: "Auli", lat: 30.5289, lon: 79.5663 },
      { name: "Kedarnath", lat: 30.7352, lon: 79.0669 }
    ]
  },
  "Himachal Pradesh": {
    accentPrimary: "#6B7FA3", // dusty lavender-blue
    accentSecondary: "#4A3B2E", // deodar brown
    wikiTitle: "Himachal Pradesh",
    cities: [
      { name: "Shimla", lat: 31.1048, lon: 77.1734 },
      { name: "Manali", lat: 32.2396, lon: 77.1887 },
      { name: "Dharamshala", lat: 32.2190, lon: 76.3234 },
      { name: "Kasauli", lat: 30.9013, lon: 76.9649 },
      { name: "Dalhousie", lat: 32.5387, lon: 75.9710 },
      { name: "Spiti Valley", lat: 32.2426, lon: 78.0349 },
      { name: "Solan", lat: 30.9045, lon: 77.0967 }
    ]
  }
};

// Rate limiters: 5 requests/min for guide generation, 10 requests/min for chat bot
const guideRateLimiter = rateLimit(5, 60 * 1000);
const chatRateLimiter = rateLimit(10, 60 * 1000);

// Helper function to perform HTTPS GET requests
function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse JSON response"));
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (err) => reject(err));
  });
}

// 1. Get States Endpoint
app.get('/api/states', (req, res) => {
  res.json(STATES_DATA);
});

// 2. City Coordinates Lookup Proxy (OpenTripMap /geoname)
app.get('/api/city-coords', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: "City parameter is required" });
  }

  const apiKey = process.env.OPENTRIPMAP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenTripMap API key is missing on server" });
  }

  try {
    const url = `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(city)}&apikey=${apiKey}`;
    const data = await fetchJson(url);
    if (data.status === "OK") {
      res.json({
        name: data.name,
        lat: data.lat,
        lon: data.lon,
        country: data.country
      });
    } else {
      res.status(404).json({ error: `City '${city}' not found in OpenTripMap` });
    }
  } catch (error) {
    console.error("Error fetching city coordinates:", error.message);
    res.status(502).json({ error: "Failed to fetch city coordinates from OpenTripMap", details: error.message });
  }
});

// 3. Weather Proxy (Open-Meteo)
app.get('/api/weather', async (req, res) => {
  const { lat, lon, date } = req.query;
  if (!lat || !lon || !date) {
    return res.status(400).json({ error: "lat, lon, and date parameters are required" });
  }

  try {
    // Open-Meteo daily forecast endpoint
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,rain_sum,snowfall_sum,weathercode&timezone=auto`;
    const data = await fetchJson(url);
    
    // Find index of matching date
    const dateIndex = data.daily.time.indexOf(date);
    if (dateIndex !== -1) {
      res.json({
        date: date,
        tempMax: data.daily.temperature_2m_max[dateIndex],
        tempMin: data.daily.temperature_2m_min[dateIndex],
        rainSum: data.daily.rain_sum[dateIndex],
        snowfallSum: data.daily.snowfall_sum[dateIndex],
        weathercode: data.daily.weathercode[dateIndex]
      });
    } else {
      res.json({
        date: date,
        outOfRange: true,
        message: "Date is out of the 16-day forecast range. Sourcing general seasonal weather instead."
      });
    }
  } catch (error) {
    console.error("Error fetching weather:", error.message);
    // Fall back to out-of-range object so we don't break the flow
    res.json({
      date: date,
      error: true,
      message: "Weather server unavailable. Sourcing general seasonal weather."
    });
  }
});

// 4. Wikipedia REST Summary Proxy
app.get('/api/wiki-summary', async (req, res) => {
  const { title } = req.query;
  if (!title) {
    return res.status(400).json({ error: "Title parameter is required" });
  }

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const headers = { 'User-Agent': 'KissaCulturalGuide/1.0 (contact@kissa.guide)' };
    const data = await fetchJson(url, headers);
    res.json({
      title: data.title,
      extract: data.extract,
      thumbnail: data.thumbnail ? data.thumbnail.source : null,
      originalimage: data.originalimage ? data.originalimage.source : null
    });
  } catch (error) {
    console.error("Error fetching Wikipedia summary:", error.message);
    res.status(502).json({ error: "Failed to retrieve Wikipedia summary", details: error.message });
  }
});

// 5. OpenTripMap Attractions Proxy
app.get('/api/attractions', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon parameters are required" });
  }

  const apiKey = process.env.OPENTRIPMAP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenTripMap API key is missing on server" });
  }

  try {
    // Fetch up to 30 historic/cultural attractions (allows room for Gemini to select a hidden gem)
    const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=15000&lon=${lon}&lat=${lat}&kinds=historic,cultural&rate=1&format=json&limit=30&apikey=${apiKey}`;
    const data = await fetchJson(url);
    
    // Sort attractions by rate descending so we prioritize higher rated spots for popular view
    const sorted = [...data].sort((a, b) => b.rate - a.rate);
    res.json(sorted);
  } catch (error) {
    console.error("Error fetching attractions:", error.message);
    res.status(502).json({ error: "Failed to fetch attractions from OpenTripMap", details: error.message });
  }
});

// 6. GenAI Guide Generation Endpoint (Rate Limited)
app.post('/api/generate-guide', guideRateLimiter, async (req, res) => {
  const { username, state, city, date, weather, wikiSummary, attractions } = req.body;

  if (!username || !state || !city || !date || !attractions || attractions.length === 0) {
    return res.status(400).json({ error: "Missing required parameters in request body" });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const weatherString = weather.outOfRange || weather.error
      ? "General seasonal climate for this time of year (approximate seasonal weather)."
      : `Forecast: Max Temp: ${weather.tempMax}°C, Min Temp: ${weather.tempMin}°C, Precipitation: ${weather.rainSum}mm, Weather Code: ${weather.weathercode}.`;

    const cleanAttractions = attractions.map(a => ({
      name: a.name || "Unnamed Heritage Site",
      rate: a.rate,
      kinds: a.kinds,
      lat: a.point.lat,
      lon: a.point.lon
    })).filter(a => a.name && a.name.trim() !== "");

    const prompt = `
      You are an expert cultural guide in India, specializing in personalized, narrative-driven trip planning.
      Generate a travel guide for a traveler named "${username}" visiting "${city}" in the state of "${state}" on date "${date}".

      Grounded Context:
      1. Wikipedia State Summary: "${wikiSummary.extract || 'No summary available'}"
      2. Weather on selected travel date: "${weatherString}"
      3. List of verified nearby attractions from OpenTripMap API:
         ${JSON.stringify(cleanAttractions.slice(0, 15))}

      Strict Grounding Instructions:
      - You MUST ONLY write about attractions, places, and historical facts provided in the context above.
      - Do NOT invent or hallucinate any other tourist attractions.
      - Ensure the output strictly follows the JSON structure specified below.
      - Do not include markdown code block syntax inside the JSON strings.

      JSON Output Format:
      {
        "attractions": [
          {
            "name": "Exact Name of attraction 1",
            "description": "A 1-2 sentence description detailing its cultural/historical significance to ${city}.",
            "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Exact+Name+of+attraction+1+${encodeURIComponent(city)}"
          },
          ... up to 5 popular attractions from the list with rate >= 3 (or the highest rates available)
        ],
        "hiddenGem": {
          "name": "Exact Name of a lesser-known attraction (typically rate 1 or 2 from the list)",
          "description": "Detail why this is a hidden gem and why it is historically/culturally unique. Keep it to 2-3 sentences.",
          "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Exact+Name+of+hidden+gem+${encodeURIComponent(city)}"
        },
        "heritageStory": "An immersive, beautifully written 2-3 paragraph cultural and historical narrative about ${city} and ${state}. It MUST weave in the historical details from the Wikipedia summary and be explicitly grounded in the weather forecast for ${date}: '${weatherString}' (e.g. if raining, mention how the rain highlights the ancient stone facades and what covered pavilions to explore; if hot, recommend early morning excursions). Address the user '${username}' directly with warmth and respect.",
        "localTip": "A highly specific, practical, authentic local tip or etiquette note for travelers in ${city} (e.g., local culinary highlights, custom rules, temple dress code, or local phrases). 2-3 sentences.",
        "socialMediaPick": {
          "name": "Exact Name of one attraction from the list",
          "photoReason": "Why this specific spot makes the most stunning photo. Keep it to 1-2 sentences.",
          "caption": "A creative, ready-to-use Instagram/social media caption with hashtags including #Kissa #${city.replace(/\s+/g, '')} #${state.replace(/\s+/g, '')}."
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the JSON output returned by Gemini
    const guideData = JSON.parse(text);
    res.json(guideData);
  } catch (error) {
    console.error("Gemini Guide Generation Error:", error.message);
    res.status(500).json({ error: "Failed to generate your personalized guide using AI", details: error.message });
  }
});

// 7. Chat Companion Endpoint (Rate Limited)
app.post('/api/chat', chatRateLimiter, async (req, res) => {
  const { username, state, city, message, chatHistory } = req.body;

  if (!username || !state || !city || !message) {
    return res.status(400).json({ error: "Missing required parameters in request body" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Format chat history for Gemini API
    const contents = [];
    
    // System instruction to bind the conversation
    contents.push({
      role: 'user',
      parts: [{
        text: `You are a helpful local travel companion for a traveler named ${username} who is exploring ${city}, ${state}.
               Your answers must be friendly, culturally rich, and highly accurate.
               Gently redirect the user back to the destination context (${city}, ${state}) if they ask questions completely unrelated to travel or this destination.
               Greet ${username} by name when appropriate. Keep answers concise (under 4-5 sentences) and highly readable.`
      }]
    });
    
    contents.push({
      role: 'model',
      parts: [{
        text: `Understood! I am ready to guide ${username} through the culture, heritage, and secrets of ${city}, ${state}.`
      }]
    });

    // Add previous chat history
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add the current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const result = await model.generateContent({ contents });
    const botReply = result.response.text();

    res.json({ text: botReply });
  } catch (error) {
    console.error("Gemini Chat Error:", error.message);
    res.status(500).json({ error: "Failed to connect to your chat companion", details: error.message });
  }
});

// Serve frontend build static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/dist'));
  app.get('*', (req, res) => {
    res.sendFile(require('path').resolve(__dirname, 'client', 'dist', 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
