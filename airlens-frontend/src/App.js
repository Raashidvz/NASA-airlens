import React, { useEffect, useState, useRef } from "react";
import Globe from "react-globe.gl";
import "./App.css";

function App() {
  const [points, setPoints] = useState([]);
  const [highlighted, setHighlighted] = useState(null);
  const [pollutedList, setPollutedList] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const globeRef = useRef();

  // Fetch global data & top polluted regions
  useEffect(() => {
    fetch("http://127.0.0.1:5000/aqi")
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(d => ({
          lat: d.lat,
          lng: d.lon,
          composite: d.composite,
          CO: d.CO,
          NO2: d.NO2,
          O3: d.O3,
          SO2: d.SO2,
          size: 0.3,
          color: getColor(d.composite)
        }));
        setPoints(mapped);
      });

    fetch("http://127.0.0.1:5000/polluted?top=10")
      .then(res => res.json())
      .then(data => setPollutedList(data));
  }, []);

  const getColor = val => {
    if (val < 0.2) return "#10b981";
    if (val < 0.4) return "#fbbf24";
    if (val < 0.6) return "#f97316";
    if (val < 0.8) return "#ef4444";
    return "#8b5cf6";
  };

  const getStatus = val => {
    if (val < 0.2) return "Good";
    if (val < 0.4) return "Moderate";
    if (val < 0.6) return "Poor";
    if (val < 0.8) return "Very Poor";
    return "Severe";
  };

  const handleSearch = () => {
    if (!searchCity) return;
    fetch(`http://127.0.0.1:5000/search?city=${searchCity}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          const cityPoint = {
            lat: data.lat,
            lng: data.lon,
            CO: data.CO,
            NO2: data.NO2,
            O3: data.O3,
            SO2: data.SO2,
            composite: data.composite,
            size: 1,
            color: "#fbbf24",
            isHighlighted: true,
            city: data.city
          };
          setHighlighted(cityPoint);

          if (globeRef.current) {
            globeRef.current.pointOfView(
              { lat: cityPoint.lat, lng: cityPoint.lng, altitude: 2.0 },
              1500
            );
          }
        }
      });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <h1 className="title">AirLens Global</h1>
        <p className="subtitle">Real-time Air Quality Monitoring</p>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a city..."
          value={searchCity}
          onChange={e => setSearchCity(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* Globe */}
      <div style={{ 
        position: 'absolute',
        top: '100px',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1
      }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          pointsData={highlighted ? [...points, highlighted] : points}
          pointAltitude={0.01}
          pointColor={d => d.isHighlighted ? d.color : d.color}
          pointRadius={d => d.isHighlighted ? 1 : 0.3}
          pointLabel={d =>
            `${d.city || "Lat:"+d.lat.toFixed(2)+", Lon:"+d.lng.toFixed(2)}\nComposite: ${d.composite.toFixed(2)}`
          }
          ringsData={highlighted ? [highlighted] : []}
          ringLat={d => d.lat}
          ringLng={d => d.lng}
          ringColor={() => "#fbbf24"}
          ringMaxRadius={10}
          ringPropagationSpeed={6}
          ringRepeatPeriod={1000}
        />
      </div>

      {/* Top Polluted Regions */}
      <div className="polluted-panel">
        <h3 className="panel-title">Most Polluted Regions</h3>
        <div className="polluted-list">
          {pollutedList.map((c, i) => (
            <div key={i} className="polluted-item">
              <div className="polluted-rank">{i + 1}</div>
              <div className="polluted-info">
                <div className="polluted-city">{c.city || "Unknown"}</div>
                <div 
                  className="polluted-status"
                  style={{ color: getColor(c.composite) }}
                >
                  {getStatus(c.composite)}
                </div>
              </div>
              <div 
                className="polluted-indicator"
                style={{ backgroundColor: getColor(c.composite) }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Highlight Panel */}
      {highlighted && (
        <div className="highlight-panel">
          <button 
            className="close-button"
            onClick={() => setHighlighted(null)}
          >
            ×
          </button>
          <h3 className="highlight-city">{highlighted.city}</h3>
          <div 
            className="highlight-status"
            style={{ 
              backgroundColor: getColor(highlighted.composite),
              color: '#fff'
            }}
          >
            {getStatus(highlighted.composite)}
          </div>
          <div className="highlight-details">
            <div className="detail-row">
              <span className="detail-label">Composite Index</span>
              <span className="detail-value">{highlighted.composite.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">CO</span>
              <span className="detail-value">{highlighted.CO.toExponential(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">NO₂</span>
              <span className="detail-value">{highlighted.NO2.toExponential(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">O₃</span>
              <span className="detail-value">{highlighted.O3.toExponential(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">SO₂</span>
              <span className="detail-value">{highlighted.SO2.toExponential(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="legend">
        <div className="legend-title">Air Quality Index</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }} />
            <span>Good</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#fbbf24' }} />
            <span>Moderate</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f97316' }} />
            <span>Poor</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef4444' }} />
            <span>Very Poor</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8b5cf6' }} />
            <span>Severe</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;