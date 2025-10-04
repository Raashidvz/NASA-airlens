import React, { useEffect, useState, useRef } from "react";
import Globe from "react-globe.gl";

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

  // Dynamic coloring based on composite
  const getColor = val => {
    if (val < 0.2) return "green";
    if (val < 0.4) return "yellow";
    if (val < 0.6) return "orange";
    if (val < 0.8) return "red";
    return "purple";
  };

  const getStatus = val => {
    if (val < 0.2) return "Good";
    if (val < 0.4) return "Moderate";
    if (val < 0.6) return "Poor";
    if (val < 0.8) return "Very Poor";
    return "Severe";
  };

  // Handle city search
  const handleSearch = () => {
    if (!searchCity) return;
    fetch(`http://127.0.0.1:5000/search?city=${searchCity}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          // Map API response to Globe point format
          const cityPoint = {
            lat: data.lat,
            lng: data.lon,        // important!
            CO: data.CO,
            NO2: data.NO2,
            O3: data.O3,
            SO2: data.SO2,
            composite: data.composite,
            size: 1,
            color: "yellow",
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
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* Controls */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}>
        <input
          type="text"
          placeholder="Search City"
          value={searchCity}
          onChange={e => setSearchCity(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Globe */}
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
        ringColor={() => "yellow"}
        ringMaxRadius={10}
        ringPropagationSpeed={6}
        ringRepeatPeriod={1000}
      />

      {/* Top Polluted Regions */}
      <div style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        background: "#fff",
        padding: "10px",
        maxHeight: "30%",
        overflowY: "auto"
      }}>
        <h3>Top Polluted Regions</h3>
        <ul>
          {pollutedList.map((c,i)=>(
            <li key={i} style={{color:getColor(c.composite)}}>
              {c.city || "Unknown"} - Status: {getStatus(c.composite)} 
            </li>
          ))}
        </ul>
      </div>

      {/* Highlight Panel */}
      {highlighted && (
        <div style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "#fff",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0,0,0,0.3)",
          maxWidth: "300px",
          zIndex: 2
        }}>
          <h3>{highlighted.city}</h3>
          <p><strong>Status:</strong> {getStatus(highlighted.composite)}</p>
          <p><strong>Composite:</strong> {highlighted.composite.toFixed(2)}</p>
          <p><strong>CO:</strong> {highlighted.CO.toExponential(2)}</p>
          <p><strong>NO2:</strong> {highlighted.NO2.toExponential(2)}</p>
          <p><strong>O3:</strong> {highlighted.O3.toExponential(2)}</p>
          <p><strong>SO2:</strong> {highlighted.SO2.toExponential(2)}</p>
        </div>
      )}
    </div>
  );
}

export default App;
