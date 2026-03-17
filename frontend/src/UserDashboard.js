import React, { useEffect, useState } from "react";
import Loader from "./Loader";

function UserDashboard({ onBack }) {

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyComplaints = async () => {
    try {

      const token = localStorage.getItem("userToken");

      const res = await fetch("http://localhost:5000/api/complaints/my", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      setComplaints(data);
      setLoading(false);

    } catch (err) {
      console.error("Failed to load complaints", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mt-4">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
        <button onClick={onBack} className="resolve-btn">
          ← Back
        </button>

        <h2 style={{ margin: 0 }}>My Complaints</h2>
      </div>

      {loading ? (
        <Loader />
      ) : complaints.length === 0 ? (
        <p>No complaints submitted yet.</p>
      ) : (
        <table className="table table-bordered">

          <thead>
            <tr>
              <th>Description</th>
              <th>Address</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {complaints.map((c) => (
              <tr key={c._id}>
                <td>{c.description}</td>
                <td>{c.address}</td>
                <td>{c.status}</td>
                <td>{c.priority}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>

        </table>
      )}

    </div>
  );
}

export default UserDashboard;