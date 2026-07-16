import { useState } from "react";

export default function RegisterForm() {

  const [formData, setFormData] = useState({
    voter_id: "",
    full_name: "",
    cnic: "",
    phone: "",
    constituency: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://${window.location.hostname}:8000/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log("Response:", data);

      alert(data.message || "Registered successfully");

    } catch (error) {
      console.log("Error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Voter Registration</h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          name="voter_id"
          placeholder="Voter ID"
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          type="text"
          name="cnic"
          placeholder="CNIC"
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          type="text"
          name="constituency"
          placeholder="Constituency"
          onChange={handleChange}
          required
        />
        <br /><br />

        <button type="submit">
          Register
        </button>

      </form>
    </div>
  );
}