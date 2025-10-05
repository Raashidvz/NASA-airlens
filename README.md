# AirLens – Global Air Pollution Visualization

**AirLens** is a full-stack web application that visualizes global air pollution levels across four major gases — **CO**, **NO₂**, **O₃**, and **SO₂** — using **NASA GIOVANNI** NetCDF datasets.
It transforms complex atmospheric data into a simple, intuitive, and interactive **3D globe visualization**.

-----

## 🚀 Overview

AirLens simplifies scientific pollution data into a **Composite Pollution Value (0.0–1.0)**, computed using the average normalized concentrations of the four gases.
This score reflects the region's overall cumulative pollution burden.

Each region on the 3D globe is color-coded based on its pollution level:

| Color | Pollution Level | Meaning |
| :------ | :---------------- | :-------- |
| 🟢 | 0.0–0.25 | Clean Air |
| 🟡 | 0.26–0.50 | Moderate Pollution |
| 🔴 | 0.51–0.75 | High Pollution |
| 🟣 | 0.76–1.0 | Hazardous Level |

The goal is to make **scientific air quality data accessible** to everyone — from students to policymakers — by combining clarity, accuracy, and creativity.

-----

## ⚙️ Tech Stack

**Backend:**

  - Python (Flask)
  - Flask-CORS
  - NumPy
  - netCDF4
  - Nominatim API (for geocoding)

**Frontend:**

  - React
  - `react-globe.gl`
  - HTML5 / CSS3
  - Axios

**Data Source:**

  - NASA GIOVANNI NetCDF Archives

-----

## 🧠 How It Works

1.  Fetch air pollution datasets (NetCDF format) from **NASA GIOVANNI**.
2.  Extract gas concentration values using **NumPy** and **netCDF4**.
3.  Compute a **Composite Pollution Value (CPV)** as the average of normalized gas concentrations.
4.  Assign color codes (Green, Yellow, Red, Purple) based on the CPV.
5.  Render the pollution visualization on a **3D interactive globe** using React and `react-globe.gl`.
6.  Provide search functionality (via Nominatim API) for city-level data breakdown.

-----

## 💻 How to Use

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/AirLens.git
cd AirLens
```

### 2️⃣ Start the Backend (Flask)

```bash
cd backend
pip install flask flask-cors numpy netcdf4 geopy
python app.py
```

### 3️⃣ Start the Frontend (React)

```bash
cd frontend
npm install
npm start
```

Open the app in your browser at 👉 `http://localhost:3000`

-----

## 🎯 Purpose

AirLens aims to translate scientific satellite data into public awareness tools, bridging the gap between space technology and environmental insight.

## 🛰️ Data Source

All atmospheric datasets are sourced from **NASA GIOVANNI**.
