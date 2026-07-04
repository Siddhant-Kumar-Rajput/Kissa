import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Send, Sparkles, MessageSquare, X, 
  Volume2, VolumeX, AlertTriangle, ArrowRight, 
  Cloud, CloudRain, Sun, Snowflake, RotateCcw
} from 'lucide-react';
import { api } from './api';
import { speech } from './speech';

// Weather Icon Selector based on Open-Meteo weather codes
const getWeatherIcon = (code) => {
  if (code === undefined) return <Cloud className="weather-icon" />;
  if (code === 0) return <Sun className="weather-icon text-yellow-500" />;
  if ([1, 2, 3].includes(code)) return <Cloud className="weather-icon" />;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) {
    return <CloudRain className="weather-icon text-blue-400" />;
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <Snowflake className="weather-icon text-blue-200" />;
  return <Cloud className="weather-icon" />;
};

const getWeatherDesc = (code) => {
  if (code === undefined) return "Unknown Conditions";
  if (code === 0) return "Clear Sky";
  if ([1, 2, 3].includes(code)) return "Mainly Clear / Partly Cloudy";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Rainy";
  if ([71, 73, 75, 77].includes(code)) return "Snowy";
  if ([80, 81, 82].includes(code)) return "Rain Showers";
  if ([85, 86].includes(code)) return "Snow Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Cloudy";
};

// Haversine formula for distance calculation between coordinates
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (val) => (val * Math.PI) / 180;
  const R = 6371; // radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export default function App() {
  // 1. Core State
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [statesList, setStatesList] = useState({});
  
  // 2. Intermediate / Fetch State
  const [stateBgUrl, setStateBgUrl] = useState('');
  const [popularAttractions, setPopularAttractions] = useState([]);
  const [fetchingAttractions, setFetchingAttractions] = useState(false);
  
  // 3. Loading screen progress
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // 4. Final Guide & Companion State
  const [guideData, setGuideData] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [speakingText, setSpeakingText] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // Set default travel date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTravelDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Fetch initial states list
  useEffect(() => {
    api.fetchStates()
      .then(data => setStatesList(data))
      .catch(err => {
        console.error("Failed to fetch states list:", err);
        setError("Could not load regional details. Check server connection.");
      });
  }, []);

  // Scroll chatbot messages to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Handle TTS cleanup on unmount
  useEffect(() => {
    return () => {
      speech.stop();
    };
  }, []);

  // Apply accent colors dynamically to :root when state changes
  const handleStateSelect = async (stateName) => {
    setSelectedState(stateName);
    const meta = statesList[stateName];
    if (meta) {
      document.documentElement.style.setProperty('--accent-primary', meta.accentPrimary);
      document.documentElement.style.setProperty('--accent-secondary', meta.accentSecondary);
      
      // Default to first city in list
      const defaultCity = meta.cities[0].name;
      setSelectedCity(defaultCity);
      
      // Fetch popular attractions for the default city in background
      fetchStateAttractions(defaultCity);
    }
    
    // Fetch Wikipedia Page Image for State Background
    try {
      const wiki = await api.fetchWikiSummary(stateName);
      if (wiki.originalimage) {
        setStateBgUrl(wiki.originalimage);
      } else {
        setStateBgUrl('');
      }
    } catch (err) {
      console.warn("Could not fetch state background image:", err);
      setStateBgUrl('');
    }

    setStep(4);
  };

  // Fetch OTM attractions for popular preview grid
  const fetchStateAttractions = async (cityName) => {
    setFetchingAttractions(true);
    try {
      const coords = await api.fetchCityCoords(cityName);
      const items = await api.fetchAttractions(coords.lat, coords.lon);
      setPopularAttractions(items.slice(0, 6)); // Display top 6
    } catch (err) {
      console.warn("Could not fetch preview attractions:", err);
      setPopularAttractions([]);
    } finally {
      setFetchingAttractions(false);
    }
  };

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    fetchStateAttractions(cityName);
  };

  // Triggered when user requests guide generation
  const handleGenerateGuide = async () => {
    if (!username.trim()) {
      setError("Please write down your name first.");
      setStep(2);
      return;
    }
    if (!selectedState || !selectedCity || !travelDate) {
      setError("Please fill out all state, city, and date details.");
      return;
    }

    setStep(5);
    setLoadingProgress(15);
    setLoadingMessage("Pinpointing coordinates...");
    setError(null);

    try {
      // 1. Fetch Coordinates
      const coords = await api.fetchCityCoords(selectedCity);
      
      setLoadingProgress(35);
      setLoadingMessage("Querying local weather forecast...");

      // 2. Parallel API queries: Weather, Wiki Summary, and OpenTripMap Attractions
      const [weather, wikiSummary, attractions] = await Promise.all([
        api.fetchWeather(coords.lat, coords.lon, travelDate),
        api.fetchWikiSummary(selectedState),
        api.fetchAttractions(coords.lat, coords.lon)
      ]);

      setLoadingProgress(65);
      setLoadingMessage("Connecting to Gemini AI companion...");

      if (!attractions || attractions.length === 0) {
        throw new Error(`We couldn't find any historical attractions in ${selectedCity} via OpenTripMap. Please try another city.`);
      }

      // 3. Request Guide Generation from Gemini
      const guide = await api.generateGuide({
        username,
        state: selectedState,
        city: selectedCity,
        date: travelDate,
        weather,
        wikiSummary,
        attractions
      });

      setLoadingProgress(100);
      setGuideData({
        ...guide,
        coords,
        weather,
        wikiSummary,
        rawAttractions: attractions
      });
      
      // Initialize Chatbot Welcome
      setChatHistory([
        { 
          sender: 'bot', 
          text: `Namaste ${username}! Welcome to ${selectedCity}, ${selectedState}. I am your Kissa guide. Ask me any follow-up questions about local traditions, temples, food, or navigation!` 
        }
      ]);
      
      setStep(6);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to customize guide. The server might be rate-limiting. Please try again.");
      setStep(4);
    }
  };

  // Chat Submission to Gemini
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const response = await api.sendChatMessage({
        username,
        state: selectedState,
        city: selectedCity,
        message: userMsg,
        chatHistory: chatHistory.slice(-10) // Send last 10 messages for context
      });
      setChatHistory(prev => [...prev, { sender: 'bot', text: response.text }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: 'bot', text: "Forgive me, my connection is momentarily interrupted. Let's try that question again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Text-To-Speech Play/Stop Control
  const toggleReadAloud = (text) => {
    if (speakingText) {
      speech.stop();
      setSpeakingText(false);
    } else {
      speech.speak(
        text,
        () => setSpeakingText(true),
        () => setSpeakingText(false),
        (err) => {
          console.error(err);
          setSpeakingText(false);
        }
      );
    }
  };

  // Calculations for nearby cities
  const getNearbyCities = () => {
    if (!guideData || !selectedState || !statesList[selectedState]) return [];
    
    const currentCityCoords = guideData.coords;
    const allCities = statesList[selectedState].cities;
    
    return allCities
      .filter(c => c.name.toLowerCase() !== selectedCity.toLowerCase())
      .map(c => {
        const dist = getDistance(currentCityCoords.lat, currentCityCoords.lon, c.lat, c.lon);
        return { name: c.name, distance: dist };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // top 3 closest cities
  };

  const resetFlow = () => {
    speech.stop();
    setSpeakingText(false);
    setGuideData(null);
    setChatOpen(false);
    setChatHistory([]);
    setStep(1);
  };

  // ==========================================================================
  // Render Screen Flow
  // ==========================================================================

  return (
    <div className="app-container">
      {/* Background Image Overlay with State selection zoom */}
      {selectedState && (
        <div 
          className={`state-bg-overlay ${step === 5 || step === 6 ? 'zoomed' : ''}`}
          style={{ backgroundImage: stateBgUrl ? `url(${stateBgUrl})` : 'none' }}
        />
      )}

      <div className="app-content">
        
        {/* Global Error Banner */}
        {error && (
          <div className="error-banner" style={{
            background: 'rgba(122, 46, 46, 0.9)',
            borderBottom: '1px solid var(--accent-primary)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 99
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="var(--accent-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)} 
              aria-label="Close error message"
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Screen 1: Flash / Landing Screen */}
        {step === 1 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1, 
            padding: '20px', 
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h1 style={{ fontSize: '72px', color: 'var(--accent-primary)', marginBottom: '8px' }}>Kissa</h1>
            <p style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--text-muted)', marginBottom: '40px' }}>
              "Every corner has a story to whisper."
            </p>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '450px' }}>
              Welcome to Kissa. We craft personalized cultural narratives and custom travel guides of India’s states, grounded in real heritage logs and weather parameters.
            </p>
            <button 
              className="primary-button" 
              onClick={() => setStep(2)}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              Begin Journey <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Screen 2: Name Input Screen */}
        {step === 2 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            flex: 1, 
            padding: '20px', 
            maxWidth: '500px', 
            margin: '0 auto',
            width: '100%'
          }}>
            <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>What should we call you?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Kissa personalizes heritage storytelling around you. Write your name or moniker below.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Write your name..." 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={40}
                onKeyDown={(e) => e.key === 'Enter' && username.trim() && setStep(3)}
              />
              <button 
                className="primary-button" 
                disabled={!username.trim()}
                onClick={() => setStep(3)}
                aria-label="Next step"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Screen 3: State Selection Screen */}
        {step === 3 && (
          <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: '36px', marginBottom: '8px', textAlign: 'center' }}>Where are we traveling, {username}?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '40px', textAlign: 'center' }}>
              Select a state to load its unique cultural themes, colors, and travel dropdowns.
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
              gap: 20 
            }}>
              {Object.keys(statesList).map(stateName => (
                <div 
                  key={stateName}
                  className="glass-card"
                  onClick={() => handleStateSelect(stateName)}
                  style={{ 
                    cursor: 'pointer', 
                    borderLeft: `5px solid ${statesList[stateName].accentPrimary}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '24px', marginBottom: '6px' }}>{stateName}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Explore local legends, temples, and attractions.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: '16px' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: statesList[stateName].accentPrimary 
                    }} />
                    <span style={{ 
                      display: 'inline-block', 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: statesList[stateName].accentSecondary 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screen 4: City & Date Selection */}
        {step === 4 && (
          <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <button onClick={() => setStep(3)} className="secondary-button" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Change State
              </button>
              <h2 style={{ fontSize: '28px', color: 'var(--accent-primary)' }}>{selectedState} Explorer</h2>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 2fr', 
              gap: '30px',
              alignItems: 'start'
            }} className="selection-layout">
              
              {/* Form Input Card */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                    Select Destination City
                  </label>
                  <select 
                    className="input-field dropdown-field"
                    value={selectedCity} 
                    onChange={(e) => handleCityChange(e.target.value)}
                  >
                    {statesList[selectedState]?.cities.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                    Travel Date
                  </label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={travelDate} 
                    onChange={(e) => setTravelDate(e.target.value)}
                  />
                </div>

                <button 
                  className="primary-button" 
                  onClick={handleGenerateGuide}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: '10px' }}
                >
                  <Sparkles size={18} /> Customize Guide
                </button>
              </div>

              {/* Popular Attractions Bento Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  Popular in {selectedCity}
                </h3>
                
                {fetchingAttractions ? (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '40px', textAlign: 'center' }}>
                    Sourcing popular attraction points...
                  </div>
                ) : popularAttractions.length > 0 ? (
                  <div className="bento-grid">
                    {popularAttractions.map((item, idx) => (
                      <div 
                        key={item.xid} 
                        className={`glass-card bento-card ${idx === 0 ? 'hero' : ''}`}
                        style={{ borderBottom: '3px solid var(--accent-primary)', minHeight: idx === 0 ? '180px' : '120px' }}
                      >
                        <div>
                          <h4 style={{ fontSize: idx === 0 ? '20px' : '15px', fontWeight: 600, color: '#FFF', marginBottom: '4px' }}>
                            {item.name || "Heritage Spot"}
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '20px', display: 'inline-block' }}>
                            {item.kinds.split(',')[1] || item.kinds.split(',')[0]}
                          </span>
                        </div>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + selectedCity)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '12px', fontWeight: 500, alignSelf: 'flex-start', marginTop: '10px' }}
                        >
                          View Map ↗
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>
                    No landmarks found for this city. Choose another city from the dropdown.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Screen 5: Real Loading Screen */}
        {step === 5 && (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading-progress-container">
              <Sparkles className="animate-spin" size={32} color="var(--accent-primary)" style={{ animation: 'spin 2s linear infinite' }} />
              <div className="loading-text">{loadingMessage}</div>
              <div className="loading-track">
                <div className="loading-bar" style={{ width: `${loadingProgress}%` }} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{loadingProgress}% completed</div>
            </div>
          </div>
        )}

        {/* Screen 6: Custom Guide Dashboard */}
        {step === 6 && guideData && (
          <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>
            
            {/* Guide Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <button onClick={resetFlow} className="secondary-button" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '8px' }}>
                  <RotateCcw size={14} /> Start Over
                </button>
                <h1 style={{ fontSize: '42px', lineHeight: 1.1 }}>Stories of {selectedCity}</h1>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Weather widget */}
                <div className="glass-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: '160px' }}>
                  {getWeatherIcon(guideData.weather.weathercode)}
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {getWeatherDesc(guideData.weather.weathercode)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>
                      {guideData.weather.outOfRange || guideData.weather.error 
                        ? 'Seasonal' 
                        : `${guideData.weather.tempMin}°C - ${guideData.weather.tempMax}°C`}
                    </div>
                  </div>
                </div>

                {/* Open Chatbot Companion */}
                <button 
                  className="primary-button" 
                  onClick={() => setChatOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <MessageSquare size={18} /> Chat Companion
                </button>
              </div>
            </div>

            {/* Guide Layout Columns */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '3fr 2fr', 
              gap: '30px',
              alignItems: 'start'
            }} className="guide-dashboard-layout">
              
              {/* Left Column: Heritage Story & Attractions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                
                {/* Heritage Story */}
                <div className="glass-card" style={{ borderLeft: '5px solid var(--accent-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '24px' }}>Heritage Narrative</h2>
                    <button 
                      onClick={() => toggleReadAloud(guideData.heritageStory)}
                      className="secondary-button"
                      style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {speakingText ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      {speakingText ? "Stop Listening" : "Listen Story"}
                    </button>
                  </div>
                  <div style={{ fontSize: '16px', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                    {guideData.heritageStory}
                  </div>
                </div>

                {/* Attractions List */}
                <div>
                  <h2 style={{ fontSize: '22px', marginBottom: '16px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                    Custom Attraction Routing
                  </h2>
                  <div className="bento-grid">
                    {guideData.attractions.map((attraction, idx) => (
                      <div 
                        key={attraction.name}
                        className={`glass-card bento-card ${idx === 0 ? 'hero' : ''}`}
                        style={{ borderBottom: '3px solid var(--accent-primary)' }}
                      >
                        <div>
                          <h3 style={{ fontSize: idx === 0 ? '22px' : '16px', color: '#FFF', marginBottom: '8px' }}>
                            {attraction.name}
                          </h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {attraction.description}
                          </p>
                        </div>
                        <a 
                          href={attraction.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            color: 'var(--accent-primary)', 
                            textDecoration: 'none', 
                            fontSize: '13px', 
                            fontWeight: 600,
                            marginTop: '16px',
                            display: 'inline-block'
                          }}
                        >
                          Locate on Google Maps ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Hidden Gem, Tips, Social Pick, Nearby */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                
                {/* Hidden Gem */}
                <div className="glass-card" style={{ border: '1px solid var(--accent-primary)', background: 'rgba(31, 26, 23, 0.9)' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    letterSpacing: '0.05em', 
                    textTransform: 'uppercase', 
                    background: 'var(--accent-primary)', 
                    color: 'var(--text-dark)', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '12px'
                  }}>
                    Hidden Gem Discovery
                  </span>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{guideData.hiddenGem.name}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {guideData.hiddenGem.description}
                  </p>
                  <a 
                    href={guideData.hiddenGem.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}
                  >
                    Locate on Google Maps ↗
                  </a>
                </div>

                {/* Local Tip */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--accent-primary)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                    Local Tips & Etiquette
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {guideData.localTip}
                  </p>
                </div>

                {/* Social Media Pick */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                    Instagrammable Angle
                  </h3>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                    {guideData.socialMediaPick.name}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {guideData.socialMediaPick.photoReason}
                  </p>
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#FFF' }}>
                      "{guideData.socialMediaPick.caption}"
                    </p>
                  </div>
                </div>

                {/* Nearby Destinations */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '18px', marginBottom: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                    Nearby Excursions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {getNearbyCities().map(city => (
                      <div key={city.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{city.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>{city.distance} km away</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide-in Chatbot Panel */}
        <div className={`chat-side-panel ${chatOpen ? 'open' : ''}`}>
          <div className="chat-header">
            <div>
              <h3 style={{ fontSize: '20px' }}>Companion Chat</h3>
              <span style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>Grounded in {selectedCity}</span>
            </div>
            <button 
              onClick={() => setChatOpen(false)} 
              aria-label="Close chat panel"
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-messages">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-bubble bot" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Writing response...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendChatMessage} className="chat-input-area">
            <input 
              type="text" 
              placeholder="Ask follow-up questions..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
            />
            <button 
              type="submit" 
              className="primary-button" 
              style={{ padding: '12px' }}
              disabled={chatLoading || !chatInput.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
