# import h5py

# file_path = "data/OMNO2d_latest.he5"

# with h5py.File(file_path, "r") as f:
#     def print_all(name, obj):
#         print(name, type(obj))
#     f.visititems(print_all)

import netCDF4 as nc

ds = nc.Dataset("data/data_sfc.nc")
print(ds)

print("Variables:", list(ds.variables.keys()))
print("Dimensions:", ds.dimensions.keys())
