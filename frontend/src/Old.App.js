// frontend/src/App.js

import React, { useState } from "react";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    address: "",
    age: "",
    choice: "",
    education: "",
    email: "",
    name: "",
    phone: "",
    political: "",
    sex: "",
    relationship: "",
    voterId: "",
    work: "",
    zip: ""
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:4000/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Server response:", data);

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Ballot Submission</h1>
      </header>

      {!submitted ? (
        <form className="form-box" onSubmit={handleSubmit}>
          <label>
            Address:
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </label>

          <label>
            Age:
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Choice:
            <select
              name="choice"
              value={formData.choice}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              <option value="Candidate A">Candidate A</option>
              <option value="Candidate B">Candidate B</option>
              <option value="Candidate C">Candidate C</option>
            </select>
          </label>

          <label>
            Education:
            <select
              name="education"
              value={formData.education}
              onChange={handleChange}
              required
            >
              <option value="">Select...</option>
              <option value="Community College">Community College</option>
              <option value="College graduate">College graduate</option>
              <option value="Doctor">Doctor</option>
              <option value="Drop Out">Drop Out</option>
              <option value="GED">GED</option>
              <option value="High School">High School</option>
              <option value="Home School">Home School</option>
              <option value="MBA">MBA</option>
              <option value="Other">Other</option>
               <option value="Post Graduate">Post Graduate</option>
              <option value="PhD">PhD</option>
              <option value="Prefer not to Answer">Prefer not to Answer</option>
              <option value="Self taught">Self taught</option>
              <option value="Student">Student</option>
            </select>
          </label>

          <label>
            Email (optional):
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </label>

          <label>
            Full Name:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

      <label>
  Phone (optional):
  <input
    type="tel"
    name="phone"
    value={formData.phone}
    onChange={handleChange}
    pattern="\d{3}-\d{3}-\d{4}"
    placeholder="123-456-7890"
    title="Phone number must be in the format xxx-xxx-xxxx"
  />
</label>

          <label>
            Political Leaning (optional):
            <select
              name="political"
              value={formData.political}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="Democrat">Democrat</option>
              <option value="Independent">Independent</option>
              <option value="Other">Other</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
              <option value="Republican">Republican</option>
              <option value="Undecided">Undecided</option>
            </select>
          </label>
          <label>
            Sex (optional):
            <select
              name="sex"
              value={formData.sex}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
              <option value="Undecided">Undecided</option>
            </select>
          </label>
           <label>
            Relationship (optional):
            <select
              name="Relationship"
              value={formData.relationship}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="Complicated">Complicated</option>
              <option value="Dating">Dating</option>
              <option value="Divorced">Divorced</option>
              <option value="Married">Married</option>
              <option value="Other">Other</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
              <option value="Single">Single</option>
              <option value="Undecided">Undecided</option>
            </select>
          </label>

          <label>
            Voter ID (optional):
            <input
              type="text"
              name="voterId"
              value={formData.voterId}
              onChange={handleChange}
            />
          </label>

          <label>
            Work:
            <select
              name="work"
              value={formData.work}
              onChange={handleChange}
              required
            >
              <option value="">Select...</option>
              <option value="Armed Forces">Armed Forces</option>
              <option value="Artist">Artist</option>
              <option value="Banker">Banker</option>
              <option value="Clergy">Clergy</option>
              <option value="Educator">Educator</option>
              <option value="Employee">Employee</option>
              <option value="Entrepreneur">Entrepreneur</option>
              <option value="First Responder">First Responder</option>
              <option value="Founder">Founder</option>
              <option value="Gaurd">Gaurd</option>
              <option value="Government Employee">Government Employee</option>
              <option value="I.C.E">I.C.E</option>
              <option value="Influencer">Influencer</option>
              <option value="Owner">Owner</option>
              <option value="Other">Other</option>
              <option value="Parolee">Parolee</option>
              <option value="Politician">Politician</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
              <option value="">Priest</option>
              <option value="Retail">Retail</option>
              <option value="Retired">Retired</option>
              <option value="Small Business">Small Business</option>
              <option value="Student">Student</option>
              <option value="Technologist">Technologist</option>
              
            </select>
          </label>

          <label>
            Zip Code:
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              pattern="\d{5}"
              placeholder="12345"
              required
            />
          </label>

          <button type="submit" className="submit-btn">
            Submit
          </button>
        </form>
      ) : (
        <div className="thank-you">
          <h2>✅ Thank you for submitting your ballot!</h2>
          <p>You voted for: <strong>{formData.choice}</strong></p>
        </div>
      )}
    </div>
  );
}

export default App;
