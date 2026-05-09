import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

const initialFormData = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  role: "customer",
};

function RegisterPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    axios
      .post("http://127.0.0.1:8000/auth/register", formData)
      .then((response) => {
        const user = response.data;
        localStorage.setItem("user", JSON.stringify(user));
        navigate(user.role === "veterinarian" ? "/veterinarian" : "/customer");
      })
      .catch((requestError) => {
        console.error(requestError);
        setError("Kayıt oluşturulurken bir hata oluştu.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <main className="auth-page">
      <form className="auth-card wide" onSubmit={handleSubmit}>
        <Link className="auth-brand" to="/">PatiCare</Link>
        <h1>Kayıt Oluştur</h1>
        <p className="auth-copy">Randevu almak veya klinik paneline erişmek için hesap oluşturun.</p>

        <div className="form-grid">
          <label>
            Ad Soyad
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Telefon
            <input
              type="tel"
              name="phone"
              value={formData.phone}
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

          <label className="full-width">
            Rol
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="customer">Müşteri</option>
              <option value="veterinarian">Veteriner Hekim</option>
            </select>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>

        <p className="auth-footer">
          Zaten hesabınız var mı? <Link to="/login">Giriş yapın</Link>
        </p>
      </form>
    </main>
  );
}

export default RegisterPage;
