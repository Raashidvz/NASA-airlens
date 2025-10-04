from flask import Flask, jsonify, request
from flask_cors import CORS
import netCDF4 as nc
import numpy as np
from geopy.geocoders import Nominatim
import time

app = Flask(__name__)
CORS(app)

# Path to your CAMS NetCDF file (contains CO, NO2, O3, SO2)
DATA_FILE = "data/data_sfc.nc"

# Initialize geolocator for city lookup
geolocator = Nominatim(user_agent="airlens_app")
city_cache = {}

def load_cams_data(file_path):
    """
    Load CAMS pollutants (CO, NO2, O3, SO2) from NetCDF file
    Returns dict of gas -> list of {lat, lon, value}
    """
    ds = nc.Dataset(file_path)

    lat = ds.variables['latitude'][:]
    lon = ds.variables['longitude'][:]

    # CAMS variable names
    gases = {
        "CO": ds.variables['tcco'][0, :, :],    # Carbon monoxide
        "NO2": ds.variables['tcno2'][0, :, :],  # Nitrogen dioxide
        "O3": ds.variables['gtco3'][0, :, :],   # Ozone
        "SO2": ds.variables['tcso2'][0, :, :]   # Sulphur dioxide
    }

    global_data = {}

    for gas, data in gases.items():
        points = []
        for i, la in enumerate(lat):
            for j, lo in enumerate(lon):
                val = float(data[i, j])
                if np.isnan(val):
                    continue
                points.append({
                    "lat": float(la),
                    "lon": float(lo),
                    "value": val
                })
        global_data[gas] = points

    return global_data

# Load data once at startup
global_data = load_cams_data(DATA_FILE)
print({k: len(v) for k, v in global_data.items()})


def get_place_name(lat, lon):
    """
    Return a human-readable place name for given coordinates
    Uses caching to avoid hitting Nominatim too often
    """
    key = (round(lat, 2), round(lon, 2))  # reduce unique lookups
    if key in city_cache:
        return city_cache[key]

    city_name = None
    try:
        location = geolocator.reverse((lat, lon), language="en", timeout=10)
        if location and "address" in location.raw:
            addr = location.raw["address"]
            city_name = (
                addr.get("city")
                or addr.get("town")
                or addr.get("village")
                or addr.get("state")
                or addr.get("country")
            )
    except Exception:
        pass

    if not city_name:
        city_name = f"Ocean (Lat:{lat:.2f}, Lon:{lon:.2f})"

    city_cache[key] = city_name
    time.sleep(1)  # respect Nominatim rate limit
    return city_name


@app.route("/aqi", methods=["GET"])
def get_global_aqi():
    """
    Return pollutant values for globe visualization
    Query param: gas=NO2 (default), CO, O3, SO2
    """
    gas = request.args.get("gas", "NO2").upper()
    if gas not in global_data:
        return jsonify({"error": f"Invalid gas '{gas}'. Choose from {list(global_data.keys())}"}), 400

    # Send every 50th point for performance
    return jsonify(global_data[gas][::50])


@app.route("/polluted", methods=["GET"])
def get_polluted_areas():
    """
    Return top polluted areas for given gas
    Query params: gas=NO2 (default), top=10
    """
    gas = request.args.get("gas", "NO2").upper()
    top_n = int(request.args.get("top", 10))

    if gas not in global_data:
        return jsonify({"error": f"Invalid gas '{gas}'. Choose from {list(global_data.keys())}"}), 400

    sorted_points = sorted(global_data[gas], key=lambda d: d['value'], reverse=True)
    top_points = sorted_points[:top_n]

    results = []
    for p in top_points:
        city_name = get_place_name(p['lat'], p['lon'])
        results.append({
            "city": city_name,
            "lat": p['lat'],
            "lon": p['lon'],
            "value": p['value']
        })

    return jsonify(results)


@app.route("/search", methods=["GET"])
def search_city_aqi():
    """
    Search for a city and return nearest pollutant value
    Query params: city=Delhi, gas=NO2 (default)
    """
    city_name = request.args.get("city")
    gas = request.args.get("gas", "NO2").upper()

    if not city_name:
        return jsonify({"error": "City name is required"}), 400
    if gas not in global_data:
        return jsonify({"error": f"Invalid gas '{gas}'. Choose from {list(global_data.keys())}"}), 400

    try:
        location = geolocator.geocode(city_name)
        if not location:
            return jsonify({"error": "City not found"}), 404

        lat = location.latitude
        lon = location.longitude

        # Find closest data point
        closest = min(global_data[gas], key=lambda p: (p['lat']-lat)**2 + (p['lon']-lon)**2)

        return jsonify({
            "city": city_name,
            "lat": lat,
            "lon": lon,
            "gas": gas,
            "value": closest.get("value", None)  # safe access
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
