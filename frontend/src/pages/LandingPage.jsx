import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const appointmentTimes = Array.from({ length: 19 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

const cityOptions = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Gaziantep",
  "Mersin",
  "Adana",
  "Antalya",
  "Eskişehir",
];

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

const initialFilters = {
  city: "",
  district: "",
  service_id: "",
  appointment_date: "",
  appointment_time: "",
};

function getTodayDateString() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function uniqueClinics(clinics) {
  const seen = new Set();

  return clinics.filter((clinic) => {
    const key = (clinic.email || clinic.full_name || clinic.id).toString().toLocaleLowerCase("tr-TR");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function LandingPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [services, setServices] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/services`)
      .then((response) => setServices(response.data))
      .catch((error) => {
        console.error(error);
        setSearchMessage("Hizmet listesi alınırken bir hata oluştu.");
      });
  }, []);

  const routeToAppointment = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    navigate("/customer");
  };

  const handleAppointmentClick = () => {
    localStorage.removeItem("pendingAppointment");
    routeToAppointment();
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
      ...(name === "city" ? { district: "" } : {}),
    }));
    setSearchMessage("");
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchMessage("");

    if (!filters.city || !filters.service_id || !filters.appointment_date || !filters.appointment_time) {
      setSearchMessage("Klinik aramak için şehir, hizmet, tarih ve saat seçin.");
      return;
    }

    if (filters.appointment_date < getTodayDateString()) {
      setSearchMessage("Geçmiş tarihe randevu alınamaz.");
      return;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    setIsSearching(true);
    axios
      .get(`${API_BASE_URL}/veterinarians/search?${params.toString()}`)
      .then((response) => {
        const results = uniqueClinics(response.data);
        setClinics(results);
        if (results.length === 0) {
          setSearchMessage("Bu filtrelere uygun klinik bulunamadı.");
        }
      })
      .catch((error) => {
        console.error(error);
        setSearchMessage("Klinikler listelenirken bir hata oluştu.");
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const handleClinicAppointment = (clinic) => {
    const selectedService = services.find(
      (service) => String(service.id) === String(filters.service_id)
    );

    localStorage.setItem(
      "pendingAppointment",
      JSON.stringify({
        veterinarian_id: clinic.id,
        veterinarian_name: clinic.full_name,
        clinic_name: clinic.clinic_name,
        city: clinic.city,
        district: clinic.district,
        address: clinic.address,
        service_id: Number(filters.service_id),
        service_name: selectedService?.service_name || "",
        appointment_date: filters.appointment_date,
        appointment_time: filters.appointment_time,
      })
    );
    routeToAppointment();
  };

  const availableDistricts = districtOptions[filters.city] || [];

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" to="/">
          PatiCare
        </Link>
        <div className="landing-actions">
          <Link className="ghost-button" to="/clinic-register">
            Klinik Ekle
          </Link>
          <Link className="ghost-button" to="/login">
          Giriş Yap
          </Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">Modern veteriner kliniği deneyimi</p>
          <h1>PatiCare</h1>
          <p>
            Hayvanlarınızı, randevularınızı ve klinik süreçlerinizi tek panelden yönetin.
          </p>
          <button className="hero-button" type="button" onClick={handleAppointmentClick}>
            Randevu Oluştur
          </button>
        </div>
      </section>

      <section className="clinic-search-section">
        <div className="clinic-search-inner">
          <div className="clinic-search-heading">
            <p className="section-label">Klinik Arama</p>
            <h2>Size En Yakın Veteriner Kliniğini Bulun</h2>
          </div>

          <form className="landing-search-card" onSubmit={handleSearch}>
            <div className="form-grid filter-grid">
              <label>
                Şehir
                <select name="city" value={filters.city} onChange={handleFilterChange} required>
                  <option value="">Şehir seçin</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                İlçe
                <select
                  name="district"
                  value={filters.district}
                  onChange={handleFilterChange}
                  disabled={!filters.city}
                >
                  <option value="">Tüm ilçeler</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Hizmet
                <select name="service_id" value={filters.service_id} onChange={handleFilterChange} required>
                  <option value="">Hizmet seçin</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.service_name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tarih
                <input
                  type="date"
                  name="appointment_date"
                  value={filters.appointment_date}
                  min={getTodayDateString()}
                  onChange={handleFilterChange}
                  required
                />
              </label>

              <label>
                Saat
                <select
                  name="appointment_time"
                  value={filters.appointment_time}
                  onChange={handleFilterChange}
                  required
                >
                  <option value="">Saat seçin</option>
                  {appointmentTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {searchMessage && <p className="form-error">{searchMessage}</p>}

            <button type="submit" disabled={isSearching}>
              {isSearching ? "Aranıyor..." : "Klinik Ara"}
            </button>
          </form>

          {clinics.length > 0 && (
            <div className="landing-clinic-list">
              {clinics.map((clinic) => (
                <article className="clinic-card" key={clinic.id}>
                  <div>
                    <h3>{clinic.clinic_name || clinic.full_name}</h3>
                    <p>{clinic.full_name}</p>
                    <p>{clinic.city || "-"} / {clinic.district || "-"}</p>
                    <p>{clinic.address || "Adres bilgisi yok."}</p>
                  </div>
                  <button
                    className="compact-button"
                    type="button"
                    onClick={() => handleClinicAppointment(clinic)}
                  >
                    Bu Kliniğe Randevu Al
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
