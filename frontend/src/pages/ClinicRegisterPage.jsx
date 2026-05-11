import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useDistrictOptions } from "../api/districts";

const API_BASE_URL = "http://127.0.0.1:8000";
const NEW_CITY_VALUE = "__new_city__";

const initialFormData = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  clinic_name: "",
  city_id: "",
  city_name: "",
  district: "",
  address: "",
};

function ClinicRegisterPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAddingNewCity = formData.city_id === NEW_CITY_VALUE;
  const availableDistricts = useDistrictOptions(isAddingNewCity ? "" : formData.city_id);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/cities`)
      .then((response) => setCities(response.data))
      .catch((requestError) => {
        console.error(requestError);
        setError("Şehir listesi alınamadı.");
      });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
      ...(name === "city_id"
        ? {
            district: "",
            city_name: value === NEW_CITY_VALUE ? currentFormData.city_name : "",
          }
        : {}),
    }));
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const payload = {
      ...formData,
      city_id: isAddingNewCity ? null : Number(formData.city_id),
      city_name: isAddingNewCity ? formData.city_name.trim() : null,
    };

    axios
      .post(`${API_BASE_URL}/clinics/register`, payload)
      .then(() => {
        setSuccessMessage("Klinik başarıyla eklendi. Giriş yapabilirsiniz.");
        setFormData(initialFormData);
      })
      .catch((requestError) => {
        console.error(requestError);
        setError(requestError.response?.data?.detail || "Klinik kaydı oluşturulamadı.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <main className="auth-page">
      <form className="auth-card wide clinic-register-card" onSubmit={handleSubmit}>
        <Link className="auth-brand" to="/">
          PatiCare
        </Link>
        <h1>Klinik Ekle</h1>
        <p className="auth-copy">
          Kliniğinizi PatiCare ağına ekleyin ve randevularınızı tek panelden yönetin.
        </p>

        <div className="form-grid">
          <label>
            Veteriner adı soyadı
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Şifre
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Telefon
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Klinik adı
            <input
              name="clinic_name"
              value={formData.clinic_name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Şehir
            <select name="city_id" value={formData.city_id} onChange={handleChange} required>
              <option value="">Şehir seçin</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
              <option value={NEW_CITY_VALUE}>+ Yeni şehir ekle</option>
            </select>
          </label>
          {isAddingNewCity && (
            <label className="new-city-field">
              Yeni şehir adı
              <input
                name="city_name"
                value={formData.city_name}
                onChange={handleChange}
                required
              />
            </label>
          )}
          <label>
            İlçe
            {availableDistricts.length > 0 ? (
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.city_id}
                required
              >
                <option value="">İlçe seçin</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.city_id}
                required
              />
            )}
          </label>
          <label className="full-width">
            Adres
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Klinik Ekle"}
        </button>

        <p className="auth-footer">
          Klinik hesabınız var mı? <Link to="/login">Giriş yapın</Link>
        </p>
      </form>
    </main>
  );
}

export default ClinicRegisterPage;
