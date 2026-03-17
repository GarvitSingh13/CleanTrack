import React, { useState, useRef, useEffect } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function ComplaintForm({ onSuccess, onBack }){
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
              headers: {
                "Accept": "application/json",
                "User-Agent": "smart-waste-management-app"
              }
            }
          );

          const data = await response.json();

          if (data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`${lat}, ${lon}`);
          }
        } catch (err) {
          console.error(err);
          setAddress(`${lat}, ${lon}`);
        }

        setLoadingLocation(false);
      },
      () => {
        alert("Unable to retrieve your location");
        setLoadingLocation(false);
      }
    );
  };

  const searchTimeout = useRef(null);

  const searchAddress = (value) => {
    setAddress(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            value
          )}&format=json&addressdetails=1&limit=5`,
          {
            headers: {
              "Accept": "application/json",
              "User-Agent": "smart-waste-management-app"
            }
          }
        );

        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Address search failed", err);
      }

      setLoadingSuggestions(false);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("description", description);
    formData.append("address", address);
    formData.append("image", image);

    try {
      const token = localStorage.getItem("userToken");

      const response = await fetch(
        "http://localhost:5000/api/complaints/add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      alert(data.message);

      setDescription("");
      setAddress("");
      setImage(null);
      setPreview(null);
      setFileName("");
      setMarkerPosition(null);

      
      onSuccess();
      

    } catch (error) {
      console.error("Submit failed:", error);
      alert("Backend not reachable. Is the server running?");
    }
  };

  function MapClickHandler({ setAddress, setMarkerPosition }) {
    const map = useMapEvents({
      async click(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        setMarkerPosition([lat, lon]);

        // smooth zoom to clicked location
        map.flyTo([lat, lon], 16, {
          duration: 1.5,
        });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );

          const data = await response.json();

          if (data.display_name) {
            setAddress(data.display_name);
          }
        } catch (err) {
          console.error("Reverse geocoding failed", err);
        }
      },
    });

    return null;
  }

  return (
  <div className="row justify-content-center">
    <div className="col-md-8">
      <div className="form-wrapper shadow-sm mb-4">
        <div className="form-wrapper-body">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}
          >
            <button
              onClick={onBack}
              className="resolve-btn"
            >
              ← Back
            </button>

            <h4 style={{ margin: 0 }}>Submit a Complaint</h4>
          </div>

          <form onSubmit={handleSubmit} className="complaint-card">

            <div className="mb-3">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                <FaMapMarkerAlt style={{ marginRight: "6px" }} />
                Address
              </label>

              <div style={{ display: "flex", gap: "10px", position: "relative" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter complaint location address"
                  value={address}
                  onChange={(e) => searchAddress(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="resolve-btn"
                  onClick={getCurrentLocation}
                >
                  {loadingLocation ? "Detecting..." : "Use My Location"}
                </button>
              </div>
            </div>

            {loadingSuggestions && (
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                Searching address...
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="address-suggestions">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => {
                      setAddress(item.display_name.split(",").slice(0,3).join(","));
                      setSuggestions([]);
                    }}
                  >
                    {item.display_name}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "15px" }}>
              <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: "300px", width: "100%", borderRadius: "10px" }}
              >
                <TileLayer
                  attribution="© OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler
                  setAddress={setAddress}
                  setMarkerPosition={setMarkerPosition}
                />

                {markerPosition && <Marker position={markerPosition} />}

              </MapContainer>
            </div>

            {address && (
              <div className="map-preview" style={{ marginTop: "10px" }}>
                <iframe
                  title="preview-map"
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: "8px" }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`}
                ></iframe>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Image</label>

              <input
                type="file"
                className="form-control"
                ref={fileInputRef}
                onClick={(e) => {
                  e.target.value = null;
                }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  setImage(file);
                  setFileName(file.name);

                  const previewUrl = URL.createObjectURL(file);
                  setPreview(previewUrl);
                }}
                required
              />

              {fileName && (
                <p style={{ fontSize: "13px", marginTop: "5px" }}>
                  Selected file: <strong>{fileName}</strong>
                </p>
              )}

            </div>

            {preview && (
              <div className="image-preview">
                <h4>Image Preview</h4>
                <img src={preview} alt="preview" />
              </div>
            )}

            <button type="submit" className="submit-btn">
              Submit Complaint
            </button>

          </form>
        </div>
      </div>
    </div>
  </div>
);
}

export default ComplaintForm; 