import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDistrictOptions } from "../api/districts";

const API_BASE_URL = "http://127.0.0.1:8000";

const appointmentTimes = Array.from({ length: 19 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

function getTodayDateString() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function uniqueClinics(clinics) {
  const seen = new Set();
  return clinics.filter((clinic) => {
    const key = String(clinic.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Per-clinic appointment panel ────────────────────────────────────────────
function ClinicAppointmentPanel({ clinic, services, onBook }) {
  const [veterinarians, setVeterinarians] = useState([]);
  const [veterinarianId, setVeterinarianId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState(null); // null = not loaded yet
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/clinics/${clinic.id}/veterinarians`)
      .then((res) => {
        setVeterinarians(res.data);
        setVeterinarianId("");
      })
      .catch(() => {
        setVeterinarians([]);
        setVeterinarianId("");
      });
  }, [clinic.id]);

  // Fetch busy/available times whenever date changes
  useEffect(() => {
    if (!veterinarianId || !date) {
      setAvailableTimes(null);
      setTime("");
      return;
    }
    setLoadingTimes(true);
    setTime("");
    axios
      .get(`${API_BASE_URL}/veterinarians/${veterinarianId}/available-times?date=${date}`)
      .then((res) => setAvailableTimes(res.data))
      .catch(() => setAvailableTimes(null))
      .finally(() => setLoadingTimes(false));
  }, [date, veterinarianId]);

  const handleBook = () => {
    if (!veterinarianId || !serviceId || !date || !time) {
      setError("Lütfen veteriner, hizmet, tarih ve saat seçin.");
      return;
    }
    setError("");
    const selectedVeterinarian = veterinarians.find(
      (veterinarian) => String(veterinarian.id) === String(veterinarianId)
    );
    onBook(clinic, selectedVeterinarian, serviceId, date, time);
  };

  const isTimeAvailable = (t) => {
    if (!availableTimes) return true; // optimistic before load
    const slot = availableTimes.find((s) => s.time === t);
    return slot ? slot.available : true;
  };

  return (
    <div className="clinic-appt-panel">
      <label className="clinic-appt-label">
        <span>Veteriner</span>
        <select
          value={veterinarianId}
          onChange={(e) => {
            setVeterinarianId(e.target.value);
            setDate("");
            setTime("");
            setError("");
          }}
          className="clinic-appt-select"
        >
          <option value="">Veteriner seÃ§in</option>
          {veterinarians.map((veterinarian) => (
            <option key={veterinarian.id} value={veterinarian.id}>
              {veterinarian.full_name}
            </option>
          ))}
        </select>
      </label>

      {/* Service */}
      <label className="clinic-appt-label">
        <span>Hizmet</span>
        <select
          value={serviceId}
          onChange={(e) => { setServiceId(e.target.value); setError(""); }}
          className="clinic-appt-select"
        >
          <option value="">Hizmet seçin</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.service_name}</option>
          ))}
        </select>
      </label>

      {/* Date */}
      <label className="clinic-appt-label">
        <span>Tarih</span>
        <input
          type="date"
          min={getTodayDateString()}
          value={date}
          onChange={(e) => { setDate(e.target.value); setError(""); }}
          disabled={!veterinarianId}
          className="clinic-appt-select"
        />
      </label>

      {/* Time */}
      <label className="clinic-appt-label">
        <span>
          Saat{loadingTimes && <em className="loading-hint"> yükleniyor…</em>}
        </span>
        <select
          value={time}
          onChange={(e) => { setTime(e.target.value); setError(""); }}
          disabled={!veterinarianId || !date || loadingTimes}
          className="clinic-appt-select"
        >
          <option value="">Saat seçin</option>
          {appointmentTimes.map((t) => {
            const ok = isTimeAvailable(t);
            return (
              <option key={t} value={t} disabled={!ok}>
                {t}{!ok ? " — Dolu" : ""}
              </option>
            );
          })}
        </select>
      </label>

      {error && <p className="clinic-appt-error">{error}</p>}

      <button type="button" className="clinic-book-btn" onClick={handleBook}>
        Randevu Al
      </button>
    </div>
  );
}

// ── Clinic card ──────────────────────────────────────────────────────────────
function ClinicCard({ clinic, services, onBook }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="clinic-card-v2">
      <div className="clinic-card-top">
        <div className="clinic-avatar">
          {(clinic.clinic_name || "K")[0].toUpperCase()}
        </div>
        <div className="clinic-card-info">
          <h3>{clinic.clinic_name}</h3>
          <p className="clinic-card-location">
            📍 {clinic.city_name || "—"} / {clinic.district || "—"}
          </p>
          {clinic.address && (
            <p className="clinic-card-address">{clinic.address}</p>
          )}
        </div>
      </div>

      <div className="clinic-card-footer">
        <button
          type="button"
          className={`clinic-toggle-btn ${open ? "open" : ""}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Kapat ✕" : "Randevu Al →"}
        </button>
      </div>

      {open && (
        <ClinicAppointmentPanel
          clinic={clinic}
          services={services}
          onBook={onBook}
        />
      )}
    </article>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
function LandingPage() {
  const [cityId, setCityId] = useState("");
  const [district, setDistrict] = useState("");
  const [cities, setCities] = useState([]);
  const [services, setServices] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const clinicsRef = useRef(null);
  const navigate = useNavigate();

  const availableDistricts = useDistrictOptions(cityId);

  // Load cities + services once
  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE_URL}/cities`),
      axios.get(`${API_BASE_URL}/services`),
    ])
      .then(([citiesRes, servicesRes]) => {
        setCities(citiesRes.data);
        setServices(servicesRes.data);
      })
      .catch(() => {});
  }, []);

  const handleCityChange = (e) => {
    setCityId(e.target.value);
    setDistrict("");
    setSearchMessage("");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchMessage("");

    if (!cityId) {
      setSearchMessage("Klinik aramak için şehir seçin.");
      return;
    }

    const params = new URLSearchParams({ city_id: cityId });
    if (district) params.append("district", district);

    setIsSearching(true);
    axios
      .get(`${API_BASE_URL}/clinics/search?${params.toString()}`)
      .then((res) => {
        const results = uniqueClinics(res.data);
        setClinics(results);
        setSearched(true);
        if (results.length === 0) {
          setSearchMessage("Bu filtrelere uygun klinik bulunamadı.");
        } else {
          setTimeout(() => {
            clinicsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 80);
        }
      })
      .catch(() => setSearchMessage("Klinikler listelenirken bir hata oluştu."))
      .finally(() => setIsSearching(false));
  };

  const routeToAppointment = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    navigate("/customer");
  };

  const handleBook = (clinic, veterinarian, serviceId, date, time) => {
    const selectedService = services.find((s) => String(s.id) === String(serviceId));
    localStorage.setItem(
      "pendingAppointment",
      JSON.stringify({
        source: "clinic",
        clinic_id: clinic.id,
        veterinarian_id: veterinarian?.id,
        veterinarian_name: veterinarian?.full_name || "",
        clinic_name: clinic.clinic_name,
        city_id: clinic.city_id,
        district: clinic.district,
        address: clinic.address,
        service_id: Number(serviceId),
        service_name: selectedService?.service_name || "",
        appointment_date: date,
        appointment_time: time,
      })
    );
    routeToAppointment();
  };

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" to="/">PatiCare</Link>
        <div className="landing-actions">
          <Link className="ghost-button" to="/clinic-register">Klinik Ekle</Link>
          <Link
            className="ghost-button"
            to="/login"
            onClick={() => localStorage.removeItem("pendingAppointment")}
          >
            Giriş Yap
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">Modern veteriner kliniği deneyimi</p>
          <h1>PatiCare</h1>
          <p>Hayvanlarınızı, randevularınızı ve klinik süreçlerinizi tek panelden yönetin.</p>
          <button
            className="hero-button"
            type="button"
            onClick={() => {
              localStorage.removeItem("pendingAppointment");
              routeToAppointment();
            }}
          >
            Randevu Oluştur
          </button>
        </div>
      </section>

      {/* Search section */}
      <section className="clinic-search-section">
        <div className="clinic-search-inner">
          <div className="clinic-search-heading">
            <p className="section-label">Klinik Arama</p>
            <h2>Size En Yakın Veteriner Kliniğini Bulun</h2>
          </div>

          <form className="landing-search-card" onSubmit={handleSearch}>
            <div className="form-grid landing-filter-grid">
              <label>
                Şehir
                <select name="city_id" value={cityId} onChange={handleCityChange} required>
                  <option value="">Şehir seçin</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </label>

              <label>
                İlçe
                <select
                  name="district"
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setSearchMessage(""); }}
                  disabled={!cityId}
                >
                  <option value="">Tüm ilçeler</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>

            {searchMessage && <p className="form-error">{searchMessage}</p>}

            <button type="submit" disabled={isSearching} className="search-submit-btn">
              {isSearching ? "Aranıyor…" : "Klinik Ara"}
            </button>
          </form>

          {/* Results */}
          {searched && (
            <div ref={clinicsRef} className="clinic-results-section">
              {clinics.length > 0 ? (
                <>
                  <p className="clinic-results-count">
                    <strong>{clinics.length}</strong> klinik bulundu — randevu almak için bir klinik seçin
                  </p>
                  <div className="landing-clinic-list-v2">
                    {clinics.map((clinic) => (
                      <ClinicCard
                        key={clinic.id}
                        clinic={clinic}
                        services={services}
                        onBook={handleBook}
                      />
                    ))}
                  </div>
                </>
              ) : (
                !searchMessage && (
                  <p className="clinic-results-count">Sonuç bulunamadı.</p>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default LandingPage;

