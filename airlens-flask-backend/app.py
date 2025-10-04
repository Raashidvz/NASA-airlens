from flask import Flask, jsonify, request
from flask_cors import CORS
import netCDF4 as nc
import numpy as np
from geopy.geocoders import Nominatim
import time

app = Flask(__name__)
CORS(app)

DATA_FILE = "data/data_sfc.nc"
geolocator = Nominatim(user_agent="airlens_app")
city_cache = {}

def load_cams_data(file_path):
    ds = nc.Dataset(file_path)
    lat = ds.variables['latitude'][:]
    lon = ds.variables['longitude'][:]

    gases = {
        "CO": ds.variables['tcco'][0, :, :],
        "NO2": ds.variables['tcno2'][0, :, :],
        "O3": ds.variables['gtco3'][0, :, :],
        "SO2": ds.variables['tcso2'][0, :, :]
    }

    data_points = []
    for i, la in enumerate(lat):
        for j, lo in enumerate(lon):
            try:
                val_co = float(gases["CO"][i,j])
                val_no2 = float(gases["NO2"][i,j])
                val_o3 = float(gases["O3"][i,j])
                val_so2 = float(gases["SO2"][i,j])
                if any(np.isnan(x) for x in [val_co,val_no2,val_o3,val_so2]):
                    continue
                data_points.append({
                    "lat": float(la),
                    "lon": float(lo),
                    "CO": val_co,
                    "NO2": val_no2,
                    "O3": val_o3,
                    "SO2": val_so2
                })
            except IndexError:
                continue

    # Calculate max per gas for dynamic normalization
    co_max = max(p["CO"] for p in data_points)
    no2_max = max(p["NO2"] for p in data_points)
    o3_max = max(p["O3"] for p in data_points)
    so2_max = max(p["SO2"] for p in data_points)

    # Compute composite dynamically
    for p in data_points:
        co_score = p["CO"]/co_max
        no2_score = p["NO2"]/no2_max
        o3_score = p["O3"]/o3_max
        so2_score = p["SO2"]/so2_max
        p["composite"] = max(co_score,no2_score,o3_score,so2_score)

    return data_points

global_data = load_cams_data(DATA_FILE)
print(f"Loaded {len(global_data)} global points")

def get_place_name(lat, lon):
    key = (round(lat,2), round(lon,2))
    if key in city_cache:
        return city_cache[key]
    city_name = None
    try:
        location = geolocator.reverse((lat, lon), language="en", timeout=10)
        if location and "address" in location.raw:
            addr = location.raw["address"]
            city_name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("state") or addr.get("country")
    except:
        pass
    if not city_name:
        city_name = f"Ocean (Lat:{lat:.2f}, Lon:{lon:.2f})"
    city_cache[key] = city_name
    time.sleep(1)
    return city_name

@app.route("/aqi")
def get_global_aqi():
    return jsonify(global_data[::50])

@app.route("/polluted")
def get_polluted_areas():
    top_n = int(request.args.get("top",10))
    sorted_points = sorted(global_data, key=lambda p: p['composite'], reverse=True)
    top_points = sorted_points[:top_n]
    results = []
    for p in top_points:
        city_name = get_place_name(p['lat'],p['lon'])
        results.append({
            "city": city_name,
            "lat": p['lat'],
            "lon": p['lon'],
            "composite": p['composite'],
            "CO": p["CO"],
            "NO2": p["NO2"],
            "O3": p["O3"],
            "SO2": p["SO2"]
        })
    return jsonify(results)

@app.route("/search")
def search_city_aqi():
    city_name = request.args.get("city")
    if not city_name:
        return jsonify({"error":"City name required"}),400
    try:
        location = geolocator.geocode(city_name)
        if not location:
            return jsonify({"error":"City not found"}),404
        lat, lon = location.latitude, location.longitude
        closest = min(global_data, key=lambda p: (p['lat']-lat)**2 + (p['lon']-lon)**2)
        return jsonify({
            "city": city_name,
            "lat": lat,
            "lon": lon,
            "composite": closest["composite"],
            "CO": closest["CO"],
            "NO2": closest["NO2"],
            "O3": closest["O3"],
            "SO2": closest["SO2"]
        })
    except Exception as e:
        return jsonify({"error":str(e)}),500

if __name__=="__main__":
    app.run(debug=True)
