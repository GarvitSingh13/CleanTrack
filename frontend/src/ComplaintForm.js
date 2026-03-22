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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

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
        setMarkerPosition([lat, lon]);

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

    // Send coordinates directly if we have them
    if (markerPosition) {
      formData.append("latitude", markerPosition[0]);
      formData.append("longitude", markerPosition[1]);
    }

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
      alert(`🌿 Awesome! ${data.message} 🌟`);

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

  const handleFile = (file) => {
    if (!file) return;
    
    // Check if it's an image by type or extension
    const isImage = file.type.startsWith("image/") || 
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

    if (isImage) {
      setImage(file);
      setFileName(file.name);
      
      const reader = new FileReader();
      
      reader.onloadstart = () => {
        console.log("Starting to read file:", file.name);
      };

      reader.onload = (e) => {
        const result = e.target.result;
        if (result) {
          setPreview(result);
          console.log("Preview set successfully for:", file.name);
        } else {
          console.error("FileReader returned empty result");
        }
      };

      reader.onerror = (err) => {
        console.error("FileReader error:", err);
        // Fallback to ObjectURL if FileReader fails
        try {
          const url = URL.createObjectURL(file);
          setPreview(url);
        } catch (e) {
          console.error("Fallback ObjectURL also failed", e);
        }
      };

      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid image file (jpg, png, etc.)");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
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
    <div className="complaint-form-wrapper">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Report Garbage</h2>
          <p>Provide details and location to help us clean up</p>
        </div>
        <button onClick={onBack} className="role-btn admin-btn" style={{ padding: "10px 20px" }}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="complaint-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        <div className="auth-form-group">
          <label>Description</label>
          <input
            type="text"
            className="auth-input"
            placeholder="What's the issue? (e.g. Overflowing bin, plastic waste)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="auth-form-group">
          <label>Location Address</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              className="auth-input"
              placeholder="Detecting location..."
              value={address}
              onChange={(e) => searchAddress(e.target.value)}
              required
            />
            <button
              type="button"
              className="role-btn admin-btn"
              onClick={getCurrentLocation}
              style={{ whiteSpace: "nowrap", padding: "10px 20px", fontSize: "14px" }}
            >
              {loadingLocation ? "..." : <FaMapMarkerAlt />}
            </button>
          </div>
          
          {loadingSuggestions && <p style={{ fontSize: "12px", marginTop: "5px", opacity: 0.6 }}>Searching...</p>}
          
          {suggestions.length > 0 && (
            <div className="address-suggestions" style={{ 
              background: "white", 
              borderRadius: "12px", 
              border: "1px solid rgba(0,0,0,0.1)", 
              marginTop: "10px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.05)"
            }}>
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  style={{ padding: "10px 15px", cursor: "pointer", borderBottom: index < suggestions.length -1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
                  onClick={() => {
                    setAddress(item.display_name.split(",").slice(0,3).join(","));
                    setMarkerPosition([parseFloat(item.lat), parseFloat(item.lon)]);
                    setSuggestions([]);
                  }}
                >
                  {item.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ margin: "25px 0", borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler setAddress={setAddress} setMarkerPosition={setMarkerPosition} />
            {markerPosition && <Marker position={markerPosition} />}
          </MapContainer>
        </div>

        <div className="auth-form-group">
          <label>Upload Proof (Image)</label>
          <div 
            className={`upload-zone ${isDragging ? "dragging" : ""}`}
            style={{ 
              border: isDragging ? "2px dashed var(--primary-color)" : "2px dashed rgba(0,0,0,0.1)", 
              borderRadius: "16px", 
              padding: "20px", 
              textAlign: "center",
              cursor: "pointer",
              background: isDragging ? "rgba(34,197,94,0.05)" : "rgba(0,0,0,0.02)",
              transition: "all 0.3s ease"
            }}
            onClick={() => fileInputRef.current.click()}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {preview ? (
              <div style={{ position: "relative" }}>
                <img 
                  src={preview} 
                  alt="preview" 
                  key={preview} // Force re-render
                  style={{ 
                    maxHeight: "250px", 
                    width: "100%",
                    objectFit: "contain",
                    borderRadius: "12px",
                    border: "2px solid var(--primary-color)",
                    background: "#f0fdf4" // Light green background to see transparency
                  }}
                  onError={(e) => {
                    console.error("Image load error", e);
                    alert("Browser couldn't render this image preview. It might be a format issue (e.g. HEIC).");
                  }}
                />
              </div>
            ) : (
              <p style={{ margin: 0, opacity: 0.6 }}>Click to upload or drag & drop</p>
            )}
            {fileName && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "12px", margin: 0, fontWeight: "600", color: "var(--primary-color)" }}>{fileName}</p>
                {image && <p style={{ fontSize: "10px", margin: 0, opacity: 0.6 }}>{(image.size / 1024).toFixed(1)} KB</p>}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="role-btn" style={{ width: "100%", padding: "16px" }}>
          Submit Report
        </button>

      </form>
    </div>
  );
}

export default ComplaintForm;