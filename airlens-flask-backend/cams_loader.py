import netCDF4 as nc
import numpy as np

def load_cams_data(file_path):
    ds = nc.Dataset(file_path)

    lat = ds.variables['latitude'][:]
    lon = ds.variables['longitude'][:]

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
                points.append({"lat": float(la), "lon": float(lo), "value": val})
        global_data[gas] = points

    return global_data
