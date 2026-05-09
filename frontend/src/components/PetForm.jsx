import { useState } from "react";
import axios from "axios";

const initialFormData = {
  name: "",
  species: "",
  breed: "",
  age: "",
  gender: "",
};

function PetForm({ user, onPetCreated }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    axios
      .post("http://127.0.0.1:8000/pets", {
        ...formData,
        user_id: user.id,
        age: Number(formData.age),
      })
      .then(() => {
        setFormData(initialFormData);
        onPetCreated();
      })
      .catch((requestError) => {
        console.error(requestError);
        setError("Hayvan eklenirken bir hata oluştu.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <p className="section-label">Hayvan Kaydı</p>
        <h2>Hayvan Ekle</h2>
      </div>

      <div className="form-grid">
        <label>
          Hayvan Adı
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>

        <label>
          Tür
          <input type="text" name="species" value={formData.species} onChange={handleChange} required />
        </label>

        <label>
          Cins
          <input type="text" name="breed" value={formData.breed} onChange={handleChange} required />
        </label>

        <label>
          Yaş
          <input type="number" name="age" value={formData.age} onChange={handleChange} required />
        </label>

        <label className="full-width">
          Cinsiyet
          <input type="text" name="gender" value={formData.gender} onChange={handleChange} required />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Ekleniyor..." : "Hayvan Ekle"}
      </button>
    </form>
  );
}

export default PetForm;
