import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const districtOptions = {
  İstanbul: ["Kadıköy", "Beşiktaş", "Üsküdar"],
  Ankara: ["Çankaya", "Keçiören", "Yenimahalle"],
  İzmir: ["Karşıyaka", "Bornova", "Konak"],
  Gaziantep: ["Şahinbey", "Şehitkamil", "Nizip"],
  Mersin: ["Yenişehir", "Mezitli", "Toroslar", "Akdeniz"],
  Adana: ["Seyhan", "Çukurova", "Yüreğir", "Sarıçam"],
  Antalya: ["Muratpaşa", "Konyaaltı", "Kepez", "Alanya"],
  Eskişehir: ["Odunpazarı", "Tepebaşı"],
};

const initialFormData = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  clinic_name: "",
  city_id: "",
  district: "",
  address: "",
};

function ClinicRegisterPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCity = cities.find((city) => String(city.id) === String(formData.city_id));
  const availableDistricts = districtOptions[selectedCity?.name] || [];

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
      ...(name === "city_id" ? { district: "" } : {}),
    }));
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    axios
      .post(`${API_BASE_URL}/clinics/register`, formData)
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
            </select>
          </label>
          <label>
            İlçe
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
