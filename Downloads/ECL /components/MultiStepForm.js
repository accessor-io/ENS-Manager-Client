import React, { useState } from "react";

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  switch (step) {
    case 1:
      return (
        <div>
          <h2>Step 1: Enter Name</h2>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <button onClick={nextStep}>Next</button>
        </div>
      );
    case 2:
      return (
        <div>
          <h2>Step 2: Enter Email</h2>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <button onClick={prevStep}>Back</button>
          <button onClick={nextStep}>Next</button>
        </div>
      );
    case 3:
      return (
        <div>
          <h2>Review Information</h2>
          <p>Name: {formData.name}</p>
          <p>Email: {formData.email}</p>
          <button onClick={prevStep}>Back</button>
          <button onClick={() => alert("Submitted!")}>Submit</button>
        </div>
      );
    default:
      return null;
  }
};

export default MultiStepForm;