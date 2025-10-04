import React, { useEffect, useState, useRef } from "react";
import Globe from "react-globe.gl";

function App() {
  const [points, setPoints] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [highlighted, setHighlighted] = useState(null);
  const [pollutedList, setPollutedList] = useState([]);
  const [selectedGas, setSelectedGas] = useState("NO2");
  const globeRef = useRef();

  const GAS_OPTIONS = ["NO2", "CO", "O3", "SO2"];

  // Fetch points and top polluted areas whenever gas changes
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/aqi?gas=${selectedGas}`)
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(d => ({
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          size: 1.5,
          color: getColor(d.value),
          city: d.city,
          value: d.value,
          gas: selectedGas
        }));
        setPoints(mapped);
      });

    fetch(`http://127.0.0.1:5000/polluted?gas=${selectedGas}&top=10`)
      .then(res => res.json())
      .then(data => setPollutedList(data));
  }, [selectedGas]);

  // Fixed thresholds color mapping (adjust as needed)
  const getColor = (val) => {
    const v = val ?? 0;
    if (v < 1e15) return "green";
    if (v < 3e15) return "yellow";
    if (v < 6e15) return "orange";
    if (v < 1e16) return "red";
    return "purple";
  };

  // Handle city search
  const handleSearch = () => {
    if (!searchCity) return;
    fetch(`http://127.0.0.1:5000/search?city=${searchCity}&gas=${selectedGas}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          const highlightedCity = {
            lat: data.lat,
            lng: data.lon,
            city: data.city,
            value: data.value,
            color: getColor(data.value),
            gas: selectedGas
          };
          setHighlighted(highlightedCity);

          if (globeRef.current) {
            globeRef.current.pointOfView(
              { lat: highlightedCity.lat, lng: highlightedCity.lng, altitude: 2.0 },
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
        <select value={selectedGas} onChange={(e) => setSelectedGas(e.target.value)}>
          {GAS_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search City"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Globe */}
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        pointsData={highlighted ? [...points, highlighted] : points}
        pointAltitude={0.01}
        pointColor={d => d.color}
        pointRadius={0.3}
        pointLabel={d => `${d.city || "Unknown"}: ${(d.value ?? 0).toExponential(2)} ${d.gas}`}

        ringsData={highlighted ? [highlighted] : []}
        ringLat={d => d.lat}
        ringLng={d => d.lng}
        ringColor={() => "yellow"}
        ringMaxRadius={6}
        ringPropagationSpeed={3}
        ringRepeatPeriod={1000}
      />

      {/* Top Polluted Cities */}
      <div style={{
        position: "absolute",
        bottom: 10,
        left: 10,
        background: "#fff",
        padding: "10px",
        maxHeight: "30%",
        overflowY: "auto"
      }}>
        <h3>Top Polluted Cities ({selectedGas})</h3>
        <ul>
          {pollutedList.map((c, i) => (
            <li key={i} style={{ color: getColor(Number(c.value ?? 0)) }}>
              {c.city || "Unknown"}: {(Number(c.value ?? 0)).toExponential(2)} {c.gas || selectedGas}
            </li>
          ))}
        </ul>
      </div>

      {/* Highlighted City Panel */}
      {highlighted && (
        <div style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "#fff",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0,0,0,0.3)",
          maxWidth: "250px",
          zIndex: 2
        }}>
          <h3>{highlighted.city}</h3>
          <p><strong>{highlighted.gas}:</strong> {(highlighted.value ?? 0).toExponential(2)}</p>
          <p><strong>Latitude:</strong> {highlighted.lat.toFixed(2)}</p>
          <p><strong>Longitude:</strong> {highlighted.lng.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default App;
