<div align="center">

<br/>

# 🌬️ AirSense

### Global AQI Prediction · Source Apportionment · Health Analysis Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green?style=for-the-badge)](./LICENSE)

<br/>

> **AirSense** is an AI-powered, full-featured air quality intelligence platform built as a Community Engagement Project (CEP). It enables users to monitor, predict, and understand air pollution across cities globally — through interactive maps, real-time AQI dashboards, source analysis, carbon footprint calculators, and community-driven environmental reporting.

<br/>

---

</div>

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [🤖 AI Integration](#-ai-integration)
- [👥 Team](#-team)
- [📄 License](#-license)

---

## ✨ Features

AirSense is packed with powerful modules to help users understand and act on air quality data:

| Module | Description |
|---|---|
| 📊 **Dashboard** | Real-time AQI overview with city-wise stats, health index summaries, and trend charts |
| 🗺️ **Interactive Map** | Global Leaflet-powered map with color-coded AQI markers and city drill-downs |
| 🏙️ **City Detail** | Deep-dive into a specific city's air quality, historical trends, and health advisories |
| ⚖️ **City Comparison** | Side-by-side comparison of pollution levels across multiple cities |
| 🔬 **Source Analysis** | Identify major pollutant contributors — vehicles, industries, agriculture, etc. |
| 🧪 **Simulator** | Simulate the impact of pollution reduction policies on AQI levels |
| 🌱 **Carbon Calculator** | Estimate your personal carbon footprint and discover offset strategies |
| 📰 **Awareness Hub** | Articles, educational guides, and DIY air purifier instructions |
| 🧑‍🤝‍🧑 **Community Feed** | Citizen science reports — submit and view pollution sightings near you |
| 🔔 **Alerts Manager** | Set air quality threshold alerts for cities you care about |
| 🔍 **Data Provenance** | Full transparency on data sources, methodologies, and sensor networks |
| 🛡️ **Admin Console** | Manage platform data, validate community reports, and configure settings |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — UI library with functional components and hooks
- **TypeScript 5.8** — Strongly typed JavaScript
- **Vite 6** — Lightning-fast dev server and bundler
- **Tailwind CSS 4** — Utility-first styling
- **Leaflet.js** — Interactive maps
- **Recharts** — Data visualization and charts
- **Lucide React** — Clean icon library
- **Motion (Framer)** — Smooth animations

### AI & Backend
- **Google Gemini AI (`@google/genai`)** — AI-powered insights, analysis, and recommendations
- **Express.js** — Lightweight backend server

### Developer Tooling
- **ESBuild** — Fast bundling
- **tsx** — TypeScript execution
- **Autoprefixer** — CSS compatibility

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- A **Gemini API Key** — get one at [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Deveshonmac/CEP-group-project.git
cd CEP-group-project

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Open .env.local and add your Gemini API key:
# GEMINI_API_KEY=your_api_key_here

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove build artifacts |

---

## 📁 Project Structure

```
CEP-group-project/
├── src/
│   ├── components/          # All UI components
│   │   ├── Dashboard.tsx        # Main AQI dashboard
│   │   ├── InteractiveMap.tsx   # Leaflet map view
│   │   ├── CityDetail.tsx       # Per-city deep dive
│   │   ├── CityComparison.tsx   # Multi-city comparison
│   │   ├── Simulator.tsx        # Policy impact simulator
│   │   ├── SourceAnalysis.tsx   # Pollution source breakdown
│   │   ├── CarbonCalculator.tsx # Carbon footprint tool
│   │   ├── AwarenessHub.tsx     # Articles + DIY guides
│   │   ├── CommunityFeed.tsx    # Citizen science reports
│   │   ├── AlertsManager.tsx    # AQI alert configuration
│   │   ├── DataProvenance.tsx   # Data source transparency
│   │   ├── AdminConsole.tsx     # Admin management panel
│   │   └── Header.tsx           # Navigation header
│   ├── context/
│   │   └── AppContext.tsx       # Global state management
│   ├── data/
│   │   └── mockData.ts          # Mock AQI and city data
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── aqiCalculations.ts   # AQI computation utilities
│   ├── App.tsx                  # Root application component
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── .env.example                 # Environment variable template
└── package.json                 # Project dependencies
```

---

## 🤖 AI Integration

AirSense leverages **Google Gemini AI** to provide:

- 🧠 **Intelligent AQI Analysis** — AI-generated summaries of air quality conditions
- 💡 **Health Recommendations** — Personalized advice based on pollution levels and user profiles
- 🔍 **Source Attribution** — AI-assisted identification of pollution sources
- 📈 **Predictive Insights** — Trend forecasting and scenario simulations
- 🗣️ **Natural Language Reports** — Human-readable pollution reports generated on-the-fly

Configure your Gemini API key in `.env.local` to enable all AI features.

---

## 👥 Team

This project was developed as part of a **Community Engagement Project (CEP)** by a group of students passionate about environmental data and public health.

| Name | Role |
|---|---|
| Devesh | Project Lead / Frontend |
| *(Add members)* | *(Add roles)* |

---

## 📄 License

This project is licensed under the **Apache 2.0 License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for cleaner air and a healthier planet 🌍**

*AirSense — Because every breath matters.*

</div>
