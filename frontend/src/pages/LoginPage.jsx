import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

const initialFormData = {
  email: "",
  password: "",
};

function LoginPage() {
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

    const email = formData.email;
    const password = formData.password;

    axios
      .post(
        "http://127.0.0.1:8000/auth/login",
        {
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log("LOGIN RESPONSE:", response.data);
        localStorage.setItem("user", JSON.stringify(response.data));

        if (localStorage.getItem("pendingAppointment") && response.data.role === "customer") {
          navigate("/customer");
        } else if (response.data.role === "veterinarian") {
          navigate("/veterinarian");
        } else {
          navigate("/customer");
        }
      })
      .catch((requestError) => {
        console.error(requestError);
        setError(requestError.response?.data?.detail || "Giriş yapılamadı");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Link className="auth-brand" to="/">PatiCare</Link>
        <h1>Giriş Yap</h1>
        <p className="auth-copy">Müşteri veya veteriner hesabınızla devam edin.</p>

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

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>

        <p className="auth-footer">
          Hesabınız yok mu? <Link to="/register">Kayıt oluşturun</Link>
        </p>
      </form>
    </main>
  );
}

export default LoginPage;
