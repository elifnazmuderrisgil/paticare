import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const appointmentTimes = Array.from({ length: 19 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

function formatTime(value) {
  return value ? value.slice(0, 5) : "-";
}

function normalizeStatus(statusValue) {
  return statusValue?.toLocaleLowerCase("tr-TR") || "";
}

function getStatusClass(statusValue) {
  const status = normalizeStatus(statusValue);

  if (status.includes("iptal")) return "status-cancelled";
  if (status.includes("tamam")) return "status-completed";
  if (status.includes("onay")) return "status-approved";
  return "status-pending";
}

function getStatusCounts(appointments) {
  return appointments.reduce(
    (counts, appointment) => {
      const status = normalizeStatus(appointment.status);

      if (status.includes("iptal")) {
        counts.cancelled += 1;
      } else if (status.includes("tamam")) {
        counts.completed += 1;
      } else {
        counts.pending += 1;
      }

      return counts;
    },
    { pending: 0, completed: 0, cancelled: 0 }
  );
}

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string" && detail.toLocaleLowerCase("tr-TR").includes("uygunluk")) {
    return "Bu saat için seçilen klinikte uygunluk yok.";
  }

  return detail || fallbackMessage;
}

function VeterinarianAppointmentCard({ appointment, onChanged }) {
  const [selectedTime, setSelectedTime] = useState(formatTime(appointment.appointment_time));
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const isCancelled = normalizeStatus(appointment.status).includes("iptal");

  const updateTime = () => {
    setError("");
    setIsUpdating(true);

    axios
      .patch(`${API_BASE_URL}/appointments/${appointment.id}`, {
        appointment_time: selectedTime,
      })
      .then(() => {
        onChanged?.("Randevu saati güncellendi.");
      })
      .catch((requestError) => {
        console.error(requestError);
        setError(getApiErrorMessage(requestError, "Randevu saati güncellenemedi."));
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const cancelAppointment = () => {
    const isConfirmed = window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?");

    if (!isConfirmed) {
      return;
    }

    setError("");
    setIsUpdating(true);

    axios
      .patch(`${API_BASE_URL}/appointments/${appointment.id}`, {
        status: "İptal",
      })
      .then(() => {
        onChanged?.("Randevu iptal edildi.");
      })
      .catch((requestError) => {
        console.error(requestError);
        setError(requestError.response?.data?.detail || "Randevu iptal edilemedi.");
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  return (
    <article className="record-card appointment-card vet-appointment-card">
      <div className="record-topline">
        <h3>Randevu ID #{appointment.id}</h3>
        <span className={`status-badge ${getStatusClass(appointment.status)}`}>
          {appointment.status || "Bekliyor"}
        </span>
      </div>

      <div className="record-grid appointment-grid">
        <p>
          <span>Müşteri</span>
          {appointment.customer_name || "-"}
        </p>
        <p>
          <span>Telefon</span>
          {appointment.customer_phone || "-"}
        </p>
        <p>
          <span>Hayvan</span>
          {appointment.pet_name || "-"}
        </p>
        <p>
          <span>Tür</span>
          {appointment.pet_species || "-"}
        </p>
        <p>
          <span>Hizmet</span>
          {appointment.service_name || "-"}
        </p>
        <p>
          <span>Klinik</span>
          {appointment.clinic_name || "-"}
        </p>
        <p>
          <span>Tarih</span>
          {appointment.appointment_date || "-"}
        </p>
        <p>
          <span>Saat</span>
          {formatTime(appointment.appointment_time)}
        </p>
      </div>

      {!isCancelled && (
        <div className="vet-appointment-actions">
          <label>
            Yeni saat
            <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)}>
              {appointmentTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <button
            className="compact-button"
            type="button"
            disabled={isUpdating}
            onClick={updateTime}
          >
            Saat Güncelle
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={isUpdating}
            onClick={cancelAppointment}
          >
            İptal Et
          </button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </article>
  );
}

function VeterinarianDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [veterinarian, setVeterinarian] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const statusCounts = useMemo(() => getStatusCounts(appointments), [appointments]);

  const fetchAppointments = (veterinarianId) => {
    setIsLoading(true);
    setError("");

    axios
      .get(`${API_BASE_URL}/veterinarians/${veterinarianId}/appointments`)
      .then((response) => setAppointments(response.data))
      .catch((requestError) => {
        console.error(requestError);
        setError("Kliniğinize ait randevular alınırken bir hata oluştu.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const refreshAppointments = (message) => {
    if (message) {
      setSuccessMessage(message);
    }

    if (veterinarian?.id) {
      fetchAppointments(veterinarian.id);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    if (!user?.email) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    axios
      .get(`${API_BASE_URL}/veterinarians/by-email/${encodeURIComponent(user.email)}`)
      .then((response) => {
        setVeterinarian(response.data);
        fetchAppointments(response.data.id);
      })
      .catch((requestError) => {
        console.error(requestError);
        setError("Bu hesaba bağlı klinik kaydı bulunamadı.");
        setIsLoading(false);
      });
  }, [user?.email]);

  useEffect(() => {
    console.log("Veteriner randevuları:", appointments);
  }, [appointments]);

  return (
    <div className="dashboard-layout vet-dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PC</div>
          <div>
            <p className="brand-name">PatiCare</p>
            <p className="brand-subtitle">Veteriner Paneli</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a className="nav-item active" href="#appointments">Randevular</a>
        </nav>
      </aside>

      <main className="dashboard-main vet-main" id="appointments">
        <header className="dashboard-header vet-header">
          <div>
            <p className="page-kicker">Hoş geldiniz, {user?.full_name || "Veteriner"}</p>
            <h1>{veterinarian?.clinic_name || "Veteriner Paneli"}</h1>
          </div>
          <button className="secondary-button" type="button" onClick={logout}>
            Çıkış Yap
          </button>
        </header>

        {error && <p className="form-error page-alert">{error}</p>}
        {successMessage && <p className="form-success page-alert">{successMessage}</p>}

        <section className="stats-grid vet-stats">
          <article className="stat-card">
            <p>Toplam Randevu</p>
            <strong>{appointments.length}</strong>
          </article>
          <article className="stat-card">
            <p>Bekleyen</p>
            <strong>{statusCounts.pending}</strong>
          </article>
          <article className="stat-card">
            <p>Tamamlanan</p>
            <strong>{statusCounts.completed}</strong>
          </article>
          <article className="stat-card">
            <p>İptal</p>
            <strong>{statusCounts.cancelled}</strong>
          </article>
        </section>

        <section className="panel-card appointment-panel vet-appointments-panel">
          <div className="panel-heading">
            <p className="section-label">{isLoading ? "Yükleniyor" : "Klinik Takvimi"}</p>
            <h2>Randevular</h2>
          </div>

          {appointments.length === 0 ? (
            <div className="empty-card">
              <h3>Kliniğinize ait randevu bulunmuyor.</h3>
              <p>Yeni randevu alındığında burada görünecek.</p>
            </div>
          ) : (
            <div className="record-list appointment-list">
              {appointments.map((appointment) => (
                <VeterinarianAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onChanged={refreshAppointments}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default VeterinarianDashboard;
