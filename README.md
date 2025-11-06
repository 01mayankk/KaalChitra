# 🕰️ KaalChitra: AI-Powered History Explorer

> **Explore the Past Like Never Before — Where AI Meets History and Visualization**

![KaalChitra Banner](assets/banner.png)

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React.js-blue?logo=react" alt="React.js Badge"/>
  <img src="https://img.shields.io/badge/DataViz-D3.js-orange?logo=d3.js" alt="D3.js Badge"/>
  <img src="https://img.shields.io/badge/Styling-TailwindCSS-38B2AC?logo=tailwindcss" alt="Tailwind CSS Badge"/>
  <img src="https://img.shields.io/badge/State-Redux-764ABC?logo=redux" alt="Redux Badge"/>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License"/>
  <img src="https://img.shields.io/badge/Status-Active-success" alt="Status Badge"/>
</p>

---

## 🎯 Overview

**KaalChitra** is an interactive **AI-powered historical timeline generator** that redefines how people experience history.  
Simply enter a **keyword**, **event**, or **date**, and KaalChitra creates a **visually rich, animated timeline** connecting related historical moments through dynamic visual storytelling.

### 💡 Why KaalChitra?
- Traditional timelines are static and linear.  
- KaalChitra makes history **immersive**, **dynamic**, and **intelligent**.  
- It merges **AI + visualization + storytelling** for a new way to explore human civilization.  
- Designed to **educate, inspire, and engage** learners, researchers, and history enthusiasts alike.

---

## ✨ Features

| Category | Description |
|-----------|--------------|
| 🔍 **Smart Search** | Input keywords, events, or dates to fetch related historical data. |
| 🧠 **AI-Driven Insights** | Uses NLP and historical APIs to summarize and correlate events. |
| 🧭 **Interactive Timeline** | Scroll, zoom, and explore nodes with animations and hover details. |
| 🎨 **Smooth Animations** | Elegant transitions and visual storytelling effects. |
| 🧩 **Layer Filters** | Filter by Political, Cultural, Scientific, or Technological history. |
| 🌓 **Light/Dark Mode** | Adaptive theme switcher for eye comfort and aesthetics. |
| 📤 **Export & Share** | Download or share your generated timelines (coming soon). |
| 🔮 **AI Recommendations** | Suggests related timelines and "Did You Know?" facts (planned). |

---

## 🧱 Tech Stack

| Category | Technologies |
|-----------|--------------|
| **Frontend** | React.js, D3.js / Canvas API |
| **State Management** | Redux Toolkit |
| **Styling** | Tailwind CSS |
| **Backend (optional)** | Node.js / Express or Flask |
| **AI & Data** | NLP-based processing, external APIs |
| **Build Tools** | npm / yarn, Webpack (via CRA) |
| **Deployment** | Vercel / Netlify |
| **Version Control** | Git + GitHub |

---

## 🗂️ Project Structure

```
KaalChitra/
│
├── public/
│ └── index.html
│
├── src/
│ ├── components/
│ │ ├── SearchInput.jsx
│ │ ├── TimelineCanvas.jsx
│ │ ├── EventCard.jsx
│ │ ├── FilterPanel.jsx
│ │ └── ThemeToggle.jsx
│ │
│ ├── redux/
│ │ ├── querySlice.js
│ │ ├── timelineSlice.js
│ │ └── uiSlice.js
│ │
│ ├── utils/
│ │ ├── historyApi.js
│ │ ├── dataProcessor.js
│ │ └── animationHelper.js
│ │
│ ├── assets/
│ │ ├── banner.png
│ │ └── icons/
│ │
│ └── App.jsx
│
└── package.json
```

---

## ⚙️ Getting Started

### 🔧 Prerequisites
- Node.js ≥ 14.x  
- npm or yarn  
- (Optional) API keys for external historical data sources

### 🧩 Installation

```bash
# Clone this repository
git clone https://github.com/01mayankk/KaalChitra.git
cd KaalChitra

# Install dependencies
npm install
# or
yarn install

npm start
# or
yarn start

Visit 👉 https://kaal-chitra.vercel.app/ to explore the app.

🏗️ Build for Production

npm run build

Creates an optimized build inside the /build directory.
```
## 🧩 Architecture Overview

### 🔹 Frontend Modules
- **SearchInput** — Captures and validates user queries.  
- **TimelineCanvas / SVG** — Dynamically renders the timeline.  
- **EventCard** — Displays expanded information when a node is clicked.  
- **FilterPanel** — Lets users toggle between history layers.  
- **ThemeToggle** — Manages dark/light UI preferences.

---

### 🔹 Redux State
- **querySlice** → Manages search queries and API data.  
- **timelineSlice** → Stores processed event nodes and relationships.  
- **uiSlice** → Controls animations, themes, and display modes.

---

### 🔹 Visualization Logic
- D3.js / Canvas maps **time on the X-axis** and **categories on the Y-axis**.  
- Nodes vary by **category**, **color**, and **importance**.  
- Supports **zooming**, **dragging**, **hover animations**, and **transitions**.

---

## 🚧 Current Progress

| Feature | Status |
|----------|--------|
| Search & Query Handling | ✅ Completed |
| Basic Timeline Visualization | ✅ Completed |
| Responsive Design | ✅ Completed |
| Animations & Transitions | ✅ Completed |
| Export / Share Feature | 🔴 Planned |
| AI Recommendations | 🔴 Planned |

✅ = Done 🟡 = In Progress 🔴 = Planned

---

## 🗺️ Roadmap

| Phase | Description | Status |
|--------|-------------|--------|
| **Phase 1** | Core UI, search, and timeline rendering | ✅ Done |
| **Phase 2** | Responsive design, themes, animations | ✅ Done |
| **Phase 3** | Export/share, AI recommendation engine | 🔴 Upcoming |
| **Phase 4** | Mobile optimization, offline mode, personalization | 🔴 Upcoming |

---

## 📸 Preview

> _Add screenshots or GIF demos here_

| Desktop View | Interactive Timeline |
|---------------|----------------------|
| ![App Screenshot](assets/screenshot1.png) | ![Timeline Demo](assets/screenshot2.gif) |

---

## 🤝 Contributing

Contributions are always welcome! 💪  

1. **Fork** this repository  
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
🧑‍💻 Author

Mayank Kumar
🎓 B.Tech CSE (AI/ML) — Lovely Professional University
📧 02mayankk@gmail.com
👥 Teammate: Kunal Sharma

📜 License

This project is licensed under the MIT License.
You’re free to use, modify, and distribute it with proper attribution.

🎉 Acknowledgements

React, D3.js, Redux Toolkit, and Tailwind CSS communities

Open data and history API providers

Inspiration from interactive data visualization and storytelling tools

Special thanks to mentors, teammates, and collaborators for creative input
