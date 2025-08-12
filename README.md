# 🗺️ NongkiPlus : LLM-Powered Map-Based Recommender System

## Overview
NongkiPlus is a location-based web application that helps people find the perfect midpoint for meetups.  
By combining geolocation technology, midpoint calculations, and AI-powered recommendations, the app makes choosing a hangout spot easier and more personalized.

This project was developed as part of a research paper:  
**"NONGKI: Integrating Large Language Models and Personality-Based Midpoint Recommendations for Social Meetups"**  
It also includes comparative analysis across **generations** (Gen Alpha, Gen Z, Millennials/Gen Y, Gen X) and **occupations** (Student, Employee, Entrepreneur).

---

## ✨ Features
- **📍 Midpoint Calculation** – Automatically finds the geographic midpoint between two selected locations.
- **🗺️ Map Visualization** – Uses Leaflet to display user locations, midpoint, and recommended venues.
- **🍽️ Venue Discovery** – Lists restaurants/cafés within a 1 km radius of the midpoint.
- **🧠 AI-Powered Recommendation** – Integrates with ChatGPT to select the best place based on user preferences (e.g., “I want desserts”).
- **🎯 Preference Filtering** – Filter venues by category, cuisine, or ambiance.
- **📊 Demographic Insights** – Research-based comparisons between generations and occupations.

---

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Map & Geolocation**: [Leaflet.js](https://leafletjs.com/)
- **Routing & Midpoint Calculation**: Leaflet Routing Machine
- **AI Recommendation**: OpenAI API (ChatGPT)
- **Data Sources**: Mall and restaurant datasets for Indonesia

---

## 🚀 How It Works
1. **Set User Locations**
   - User taps on the map to set their location.
   - User taps again to set their friend’s location.
2. **Calculate Midpoint**
   - The app computes the midpoint and draws a 1 km radius around it.
3. **Discover Venues**
   - Lists nearby restaurants/cafés in the radius.
4. **Refine with Preferences**
   - User types preferences (e.g., “I want desserts”).
   - AI filters and recommends the most suitable spot.
5. **View Final Recommendation**
   - Displayed in the list and highlighted on the map.

---

## 🧪 Research & Evaluation
NongkiPlus was tested and analyzed based on:
- **Generational differences** in preferences.
- **Occupational patterns** in meetup spot choices.
- AI recommendation accuracy compared to manual selection.

---

## 📌 Future Improvements
- Add multi-user location support for group meetups.
- Integrate real-time traffic and public transport data.
- Enable saving and sharing meetup plans.
- Expand dataset for global coverage.

---
## Try it : 
- [Nongkiplus](https://nongkiplus.netlify.app/)

