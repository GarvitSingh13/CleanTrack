import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import MarkerClusterGroup from "react-leaflet-cluster";

// Base64 Pin SVGs
const getPinSvg = (color) => `
<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40C16 40 32 28 32 16C32 7.16 24.84 0 16 0Z" fill="${color}"/>
  <circle cx="16" cy="16" r="6" fill="white"/>
</svg>
`;

const truckSvg = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="14" width="24" height="18" rx="2" fill="#2563eb"/>
  <rect x="24" y="18" width="12" height="14" rx="2" fill="#2563eb"/>
  <circle cx="10" cy="34" r="4" fill="#1e293b"/>
  <circle cx="30" cy="34" r="4" fill="#1e293b"/>
  <rect x="28" y="20" width="6" height="6" fill="white" opacity="0.6"/>
</svg>
`;

const getMarkerIcon = (priority) => {
  let color = "#2563eb"; // Normal - Blue
  let size = [32, 40];
  
  if (priority === "Very High") {
    color = "#ef4444"; // Very High - Red
    size = [38, 48]; // Slightly larger
  } else if (priority === "High") {
    color = "#f59e0b"; // High - Orange
  }

  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(getPinSvg(color))}`,
    iconSize: size,
    iconAnchor: [size[0]/2, size[1]],
    popupAnchor: [0, -size[1]]
  });
};

const truckIcon = L.icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(truckSvg)}`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Custom Cluster Icon - no external CSS needed
const createClusterCustomIcon = (cluster) => {
  return L.divIcon({
    html: `<div style="background-color: #2563eb; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 3px solid white; box-shadow: 0 8px 16px rgba(0,0,0,0.2); font-size: 14px;">${cluster.getChildCount()}</div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(36, 36, true),
  });
};

function AdminMapDashboard({ complaints, collectorLocation, isNavigating }) {

  function MapResizer() {
    const map = useMap();
    useEffect(() => {
      // Small delay to ensure container is fully painted
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 500);
      return () => clearTimeout(timer);
    }, [map]);
    return null;
  }

  function HeatmapLayer({ complaints }) {
    const map = useMap();
    const heatLayerRef = React.useRef(null);

    useEffect(() => {
      if (!complaints || complaints.length === 0) return;

      // Ensure previous layer is clean and wait a small amount for map to stabilize
      const timer = setTimeout(() => {
        try {
          if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
          }

          const heatPoints = complaints.map(c => [
            parseFloat(c.latitude),
            parseFloat(c.longitude),
            10.0 // Higher intensity per point
          ]);

          heatLayerRef.current = L.heatLayer(heatPoints, {
            radius: 65, // Even larger marks
            blur: 35,
            max: 10.0, // This will make the spots turn red much faster
            minOpacity: 0.5,
            gradient: {
                0.2: "blue",
                0.4: "lime",
                0.6: "yellow",
                0.8: "orange",
                0.9: "red" // Red starts earlier now
            }
          });

          heatLayerRef.current.addTo(map);
        } catch (err) {
          console.error("Heatmap initialization failed:", err);
        }
      }, 800);

      return () => {
        clearTimeout(timer);
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }
      };

    }, [complaints, map]);

    return null;
  }

  // Calculate optimized route using Nearest Neighbor algorithm
  const smartRoutePoints = useMemo(() => {
    if (!isNavigating || !collectorLocation || !complaints || complaints.length === 0) return [];

    let route = [[collectorLocation.lat, collectorLocation.lng]];
    let unvisited = [...complaints].map(c => ({
      ...c,
      lat: parseFloat(c.latitude),
      lng: parseFloat(c.longitude)
    }));

    let currentPos = { lat: collectorLocation.lat, lng: collectorLocation.lng };

    while (unvisited.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        // Simple Euclidean distance for performance (good enough for local routing)
        const d = Math.sqrt(
          Math.pow(unvisited[i].lat - currentPos.lat, 2) + 
          Math.pow(unvisited[i].lng - currentPos.lng, 2)
        );
        
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      if (nearestIdx !== -1) {
        const nextPoint = unvisited.splice(nearestIdx, 1)[0];
        route.push([nextPoint.lat, nextPoint.lng]);
        currentPos = nextPoint;
      } else {
        break;
      }
    }

    return route;
  }, [complaints, collectorLocation, isNavigating]);

  function RoutingLayer() {
    if (!isNavigating || smartRoutePoints.length < 2) return null;

    return (
      <Polyline 
        positions={smartRoutePoints} 
        pathOptions={{ 
          color: "rgba(34, 197, 94, 0.8)", // Greenish to match CleanTrack theme
          weight: 4, 
          dashArray: "10, 10",
          lineJoin: "round"
        }} 
      />
    );
  }

  return (
    <div style={{ width: "100%", height: "450px", position: "relative", borderRadius: "0 0 24px 24px", overflow: "hidden" }}>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="dashboard-map"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapResizer />
        <HeatmapLayer complaints={complaints} />
        <RoutingLayer />

        {collectorLocation && (
          <Marker position={[collectorLocation.lat, collectorLocation.lng]} icon={truckIcon}>
            <Popup><strong>You are here</strong><br />Waste Collector Truck</Popup>
          </Marker>
        )}

        <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
          {complaints.map((c) => (
            <Marker
              key={c._id}
              icon={getMarkerIcon(c.priority)}
              position={[parseFloat(c.latitude), parseFloat(c.longitude)]}
            >
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <strong style={{ fontSize: "14px", color: "var(--primary-color)" }}>{c.description}</strong>
                  <div style={{ marginTop: "5px", fontSize: "12px" }}>
                    <p style={{ margin: "2px 0" }}><strong>Status:</strong> {c.status}</p>
                    <p style={{ 
                      margin: "2px 0", 
                      color: c.priority === "Very High" ? "#ef4444" : c.priority === "High" ? "#f59e0b" : "inherit",
                      fontWeight: "bold"
                    }}>
                      <strong>Priority:</strong> {c.priority || "Normal"}
                    </p>
                    <p style={{ margin: "2px 0", opacity: 0.8 }}><strong>Address:</strong> {c.address}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

export default AdminMapDashboard;