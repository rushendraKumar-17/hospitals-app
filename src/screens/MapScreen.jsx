import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import AppContext from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const generateMapHtml = (hospitals, userLocation) => {
  const hospitalData = JSON.stringify(hospitals);
  const userLat = userLocation?.latitude || 28.6139;
  const userLng = userLocation?.longitude || 77.2090;
  const nearbyRadius = 5; // km

  // Marker icon URLs
  const blueMarker = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";
  const redMarker = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";
  const userMarker = "https://cdn-icons-png.flaticon.com/512/64/64113.png";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Leaflet Map</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <style>
        #map { position: absolute; top: 0; bottom: 0; right: 0; left: 0; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <script>
        var hospitals = ${hospitalData};
        var userLat = ${userLat};
        var userLng = ${userLng};
        var nearbyRadius = ${nearbyRadius};

        function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
          function deg2rad(deg) { return deg * (Math.PI/180); }
          var R = 6371;
          var dLat = deg2rad(lat2-lat1);
          var dLon = deg2rad(lon2-lon1);
          var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        }

        var map = L.map('map', {
          zoomControl: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
          dragging: true,
          boxZoom: true,
          keyboard: true,
          tap: true,
          touchZoom: true,
        }).setView([userLat, userLng], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 20,
          minZoom: 2
        }).addTo(map);

        // User location marker (distinct icon)
        var userIcon = L.icon({
          iconUrl: '${userMarker}',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });
        var userMarkerObj = L.marker([userLat, userLng], {icon: userIcon}).addTo(map);
        userMarkerObj.bindPopup('<b>Your Location</b>').openPopup();

        // Draw a circle around the user to indicate the nearby area
        L.circle([userLat, userLng], {
          color: '#007AFF',
          fillColor: '#007AFF22',
          fillOpacity: 0.2,
          radius: nearbyRadius * 1000 // meters
        }).addTo(map);

        // Add hospital markers
        hospitals.forEach(function(hospital) {
          var distance = getDistanceFromLatLonInKm(userLat, userLng, hospital.Latitude, hospital.Longitude);
          var isNearby = distance <= nearbyRadius;
          var markerIcon = L.icon({
            iconUrl: isNearby ? '${blueMarker}' : '${redMarker}',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            shadowSize: [41, 41]
          });

          var marker = L.marker([hospital.Latitude, hospital.Longitude], {
            icon: markerIcon
          }).addTo(map);

          marker.bindPopup(
            '<b>' + hospital.HospitalName + '</b><br/>' +
            (hospital.Address || '') +
            '<br/><span style="color:#007AFF;font-weight:600;">' + distance.toFixed(2) + ' km from you</span>'
          );
        });
      </script>
    </body>
    </html>
  `;
};


const MapScreen = ({ route }) => {
  const { insurer, tpa } = route.params;
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { apiUrl, userLocation } = useContext(AppContext);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await axios.post(`${apiUrl}/hospital`, { id: tpa });
        setHospitals(response.data);
      } catch (error) {
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, [insurer, tpa]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Hospitals</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : hospitals.length === 0 ? (
        <View style={styles.noDataBox}>
          <Text style={styles.noData}>No hospitals found for this insurer and TPA.</Text>
        </View>
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: generateMapHtml(hospitals, userLocation) }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit
          startInLoadingState
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    paddingTop: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22223B',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  map: {
    width: width * 0.96,
    height: height * 0.7,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  noDataBox: {
    width: width * 0.92,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  noData: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MapScreen;
