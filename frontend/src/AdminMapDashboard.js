import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function AdminMapDashboard({ complaints }) {

  function HeatmapLayer({ complaints }) {
    const map = useMap();

    useEffect(() => {
      if (!complaints || complaints.length === 0) return;

      const heatPoints = complaints.map(c => [
        parseFloat(c.latitude),
        parseFloat(c.longitude),
        2
      ]);

      const heatLayer = L.heatLayer(heatPoints, {
        radius: 80,
        blur: 45,
        maxZoom: 17,
        minOpacity: 0.6,
        gradient: {
          0.2: "blue",
          0.4: "lime",
          0.6: "yellow",
          0.8: "orange",
          1.0: "red"
        }
      });

      heatLayer.addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };

    }, [complaints, map]);

    return null;
  }

  return (
    <div style={{ marginTop: "20px", maxWidth: "100%" }}>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="dashboard-map"
        style={{ height: "380px", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <HeatmapLayer complaints={complaints} />

        {complaints.length > 0 && (
          <Marker
            position={[
              parseFloat(complaints[0].latitude),
              parseFloat(complaints[0].longitude)
            ]}
          >
            <Popup>
              <strong>Garbage Hotspot Area</strong>
            </Popup>
          </Marker>
        )}

        <MarkerClusterGroup>
          {complaints.map((c) => (
            <Marker
              key={c._id}
              position={[c.latitude, c.longitude]}
            >
              <Popup>
                <strong>{c.description}</strong>
                <br />
                Status: {c.status}
                <br />
                Priority: {c.priority || "Normal"}
                <br />
                Address: {c.address}
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

export default AdminMapDashboard;