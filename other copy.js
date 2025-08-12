"use strict";

///////////////////////////////////////
// APPLICATION ARCHITECTURE
const resetButton = document.querySelector(".reset__button");
const placeType = document.querySelector(".form__input--type");
const placesPopup = document.querySelector(".places"); // Popup container
const placesContent = document.querySelector(".places__content"); // Content inside popup
const closeButton = document.querySelector(".places__close");
window.placelist=[];
class App {
  #map;
  #mapZoomLevel = 16;
  #startCoords;
  #endCoords;
  #routeControl;
  #workouts = [];
  #routes = []; // Array to hold all routes

  constructor() {
    // Get user's position
    this._getPosition();
    document.addEventListener("keydown", this._simulateProgram.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    if (typeof L.Routing === "undefined" || !L.Routing.control) {
      alert("Leaflet Routing Machine is not available.");
      return;
    }
    document.addEventListener("keydown", this._simulateProgram.bind(this));

    this.#map.on("click", this._selectPoint.bind(this));
  }

  _selectPoint(mapE) {
    const { lat, lng } = mapE.latlng;

    if (!this.#startCoords) {
      this.#startCoords = [lat, lng];
      L.marker(this.#startCoords).addTo(this.#map).bindPopup(`You`).openPopup();
      console.log(this.#startCoords);
    } else if (!this.#endCoords) {
      this.#endCoords = [lat, lng];
      L.marker(this.#endCoords)
        .addTo(this.#map)
        .bindPopup(`Friend`)
        .openPopup();
      console.log(this.#endCoords);

      this._calculateRoute(this.#startCoords, this.#endCoords);

      // Reset start and end coordinates after the route is calculated
      this.#startCoords = null;
      this.#endCoords = null;
    }
  }

  _calculateRoute(startCoords, endCoords) {
    if (typeof L.Routing === "undefined" || !L.Routing.control) {
      alert("Leaflet Routing Machine is not available.");
      return;
    }
    // console.log(startCoords, endCoords);

    if (this.#routeControl) {
      this.#map.removeControl(this.#routeControl);
    }

    this.#routeControl = L.Routing.control({
      waypoints: [L.latLng(startCoords), L.latLng(endCoords)],
      routeWhileDragging: false,
      createMarker: () => null,
      alternatives: true,
    })
      .on("routesfound", (e) => {
        const routes = e.routes;

        // Clear existing routes if any
        if (this.#routes.length > 0) {
          this.#routes.forEach((route) => {
            this.#map.removeLayer(route);
          });
          this.#routes = [];
        }

        let minDuration = Infinity;
        let minDurationIndex = -1;

        routes.forEach((route, index) => {
          const duration = route.summary.totalTime;

          if (duration < minDuration) {
            minDuration = duration;
            minDurationIndex = index;
          }
        });

        routes.forEach((route, index) => {
          const distance = route.summary.totalDistance / 1000;
          const duration = route.summary.totalTime / 60;

          const routeLayer = L.Routing.line(route, {
            styles: [
              {
                color: index === 0 ? "red" : "blue",
                weight: 5,
              },
            ],
          }).addTo(this.#map);

          this.#routes.push(routeLayer);

          console.log(
            `Route ${index + 1}: ${distance.toFixed(
              2
            )} km, Duration: ${duration.toFixed(2)} minutes.`
          );
        });

        // Calculate and render midpoint on the actual route
        this._renderMidpointOnRoute(routes[minDurationIndex]);
      })
      .addTo(this.#map);
  }

  async _renderMidpointOnRoute(route) {
    const totalDistance = route.summary.totalDistance; // total distance in meters
    const halfwayDistance = totalDistance / 2; // midpoint in meters
    let cumulativeDistance = 0;

    let midpointCoords = null;

    // Traverse the coordinates of the route's polyline to find the midpoint
    for (let i = 0; i < route.coordinates.length - 1; i++) {
      const startPoint = route.coordinates[i];
      const endPoint = route.coordinates[i + 1];

      // Calculate distance between two consecutive points
      const segmentDistance = this._calculateDistance(
        startPoint.lat,
        startPoint.lng,
        endPoint.lat,
        endPoint.lng
      );

      cumulativeDistance += segmentDistance;

      if (cumulativeDistance >= halfwayDistance) {
        // We have reached the midpoint segment
        midpointCoords = endPoint;
        break;
      }
    }

    if (midpointCoords) {
      // Add a marker at the midpoint
      // L.marker([midpointCoords.lat, midpointCoords.lng])
      //   .addTo(this.#map)
      //   .bindPopup("Midpoint on Route")
      //   .openPopup();

      // Add a circle around the midpoint
      const radius = 2000; // 500 meters
      L.circle([midpointCoords.lat, midpointCoords.lng], {
        color: "white", // Circle border color
        fillColor: "yellow", // Fill color inside the circle
        fillOpacity: 0.5, // Opacity of the fill
        radius: radius, // Radius in meters (adjust as needed)
      }).addTo(this.#map);

      console.log(
        `Midpoint on route: [${midpointCoords.lat}, ${midpointCoords.lng}]`
      );

      // Fetch restaurants within the circle
      const restaurants = await this._fetchNearbyRestaurants(
        midpointCoords,
        radius
      );

      // Add restaurant markers
      restaurants.forEach((restaurant) => {
        const { lat, lon, name } = restaurant;
        L.marker([lat, lon])
          .addTo(this.#map)
          .bindPopup(`Gather Here :  ${name}`)
          .openPopup();
      });
      this._displayPlacesPopup(restaurants);
    } else {
      console.error("Midpoint could not be determined.");
    }
  }

  // Fetch nearby restaurants using Overpass API
  // Fetch nearby restaurants, cafes, and malls using Overpass API
  async _fetchNearbyRestaurants(midpointCoords, radius) {
    console.log(placeType.value);
    const selectedType = placeType.value; // Get the selected place type
    console.log(selectedType);

    const amenityType =
      selectedType === "mall"
        ? "shop=mall"
        : selectedType === "restaurant"
        ? "amenity=restaurant"
        : selectedType === "cafe"
        ? "amenity=cafe"
        : selectedType === "hotel"
        ? "tourism=hotel"
        : null;
    const query = `
      [out:json];
      (
        node[${amenityType}][name](around:${radius},${midpointCoords.lat},${midpointCoords.lng});
        node[${amenityType}][name](around:${radius},${midpointCoords.lat},${midpointCoords.lng});
        node[${amenityType}][name](around:${radius},${midpointCoords.lat},${midpointCoords.lng});
      );
      out;`;

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      query
    )}`;

    try {
      const response = await fetch(overpassUrl);

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const restaurants = data.elements
        .map((el) => ({
          lat: el.lat,
          lon: el.lon,
          name: el.tags.name || "Unnamed Place",
        }))
        .slice(0, 15); // Limit to the first 5 elements
      console.log(restaurants);
      window.placelist=restaurants;
      return restaurants;
    } catch (error) {
      console.error("Error fetching nearby restaurants:", error);
      return [];
    }
  }

  async _fetchNearbyPlaces(midpointCoords, radius, placeType) {
    const apiKey = "YOUR_GOOGLE_MAPS_API_KEY"; // Replace with your actual API key
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${
      midpointCoords.lat
    },${midpointCoords.lng}&radius=${radius}&type=${"mall"}&key=${apiKey}`;

    try {
      const response = await fetch(placesUrl);
      const data = await response.json();
      const places = data.results.map((place) => ({
        lat: place.geometry.location.lat,
        lon: place.geometry.location.lng,
        name: place.name || "Unnamed Place",
      }));
      return places;
    } catch (error) {
      console.error(`Error fetching nearby ${placeType}:`, error);
      return [];
    }
  }

  
  _displayPlacesPopup(restaurants) {
    placesContent.innerHTML = ""; // Clear existing content
    if (restaurants.length === 0) {
      placesContent.innerHTML = "<p>No places found nearby.</p>";
    } else {
      restaurants.forEach((restaurant) => {
        const placeItem = document.createElement("div");
        placeItem.className = "place-item";
        placeItem.innerHTML = `<p>${restaurant.name}</p>`;
        placesContent.appendChild(placeItem);
      });
    }
    placesPopup.classList.add("visible");
    console.log(closeButton);
    // Attach toggle functionality
    closeButton.addEventListener("click", () => {
      console.log("Clicked");
      if (placesPopup.classList.contains("visible")) {
        placesPopup.classList.remove("visible");
      } else {
        placesPopup.classList.add("visible");
      }
    });
    // placesPopup.style.display = "flex"; // Show the popup
  }

  // Helper function to calculate the distance between two coordinates
  _calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
  _simulateProgram(event) {
    if (event.key === "deuibhkhidhbjhfad") {
      // Predefined midpoint
      const midpoint = [-6.23366, 106.82266];
      // const midpoint = [-6.20308, 106.78282];
      const radius = 500; // 500 meters radius

      console.log("Simulating program with midpoint:", midpoint);

      // Add a circle around the midpoint
      L.circle(midpoint, {
        color: "white", // Circle border color
        fillColor: "yellow", // Fill color inside the circle
        fillOpacity: 0.5, // Opacity of the fill
        radius: radius, // Radius in meters (adjust as needed)
      }).addTo(this.#map);

      // Fetch restaurants near the midpoint
      this._fetchNearbyRestaurants(
        { lat: midpoint[0], lng: midpoint[1] },
        radius
      )
        .then((restaurants) => {
          restaurants.forEach((restaurant) => {
            const { lat, lon, name } = restaurant;
            L.marker([lat, lon])
              .addTo(this.#map)
              .bindPopup(`Gather Here: ${name}`)
              .openPopup();
          });
        })
        .catch((error) =>
          console.error("Error during simulated fetch:", error)
        );
    }
  }

  reset() {
    window.location.reload(true);
  }
}

const app = new App();
resetButton.addEventListener("click", function () {
  app.reset();
});
