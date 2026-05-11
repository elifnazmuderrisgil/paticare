import { useEffect, useState } from "react";
import axios from "axios";
import { useDistrictOptions } from "../api/districts";

const API_BASE_URL = "http://127.0.0.1:8000";
const statusOptions = ["Bekliyor", "Onaylandı", "Tamamlandı", "İptal"];

const appointmentTimes = Array.from({ length: 19 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

function formatTime(value) {
  return value ? value.slice(0, 5) : "-";
}

function getTodayDateString() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function normalizeStatus(statusValue) {
  return statusValue?.toLocaleLowerCase("tr-TR") || "";
}

function uniqueClinics(clinics) {
  const seen = new Set();

  return clinics.filter((clinic) => {
    const key = (clinic.email || clinic.full_name || clinic.id)
      .toString()
      .toLocaleLowerCase("tr-TR");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string" && detail.toLocaleLowerCase("tr-TR").includes("dolu")) {
    return "Bu saat dolu, lütfen başka saat seçin.";
  }

  return detail || fallbackMessage;
}

function isPastByDate(appointment) {
  if (!appointment.appointment_date) return false;
  return appointment.appointment_date < getTodayDateString();
}

function isCompletedOrCancelled(appointment) {
  const status = normalizeStatus(appointment.status);
  return status.includes("tamam") || status.includes("iptal");
}

function getVisibleStatus(appointment) {
  const status = normalizeStatus(appointment.status);

  if (status.includes("iptal")) return "İptal";
  if (isPastByDate(appointment)) return "Geçmiş";
  return "Bekliyor";
}

function getStatusClass(statusValue) {
  const status = normalizeStatus(statusValue);

  if (status.includes("geçmiş") || status.includes("gecmis")) return "status-expired";
  if (status.includes("tamam")) return "status-completed";
  if (status.includes("iptal")) return "status-cancelled";
  if (status.includes("onay")) return "status-approved";
  return "status-pending";
}

function isUpcomingAppointment(appointment) {
  return !isPastByDate(appointment) && !isCompletedOrCancelled(appointment);
}

function sortAppointments(appointments) {
  return [...appointments].sort((first, second) => {
    const firstValue = `${first.appointment_date || ""}T${formatTime(first.appointment_time)}`;
    const secondValue = `${second.appointment_date || ""}T${formatTime(second.appointment_time)}`;
    return firstValue.localeCompare(secondValue);
  });
}

function makeCurrentClinicOption(appointment) {
  if (!appointment.veterinarian_id) return null;

  return {
    id: appointment.veterinarian_id,
    full_name: appointment.veterinarian_name,
    clinic_name: appointment.clinic_name,
    city_id: appointment.veterinarian_city_id,
    city_name: appointment.city_name,
    district: appointment.veterinarian_district,
    address: appointment.veterinarian_address,
  };
}

function AppointmentEditForm({
  appointment,
  services,
  onCancel,
  onUpdated,
}) {
  const [formData, setFormData] = useState({
    city_id: appointment.veterinarian_city_id ? String(appointment.veterinarian_city_id) : "",
    district: appointment.veterinarian_district || "",
    appointment_date: appointment.appointment_date || "",
    appointment_time: formatTime(appointment.appointment_time),
    service_id: appointment.service_id ? String(appointment.service_id) : "",
    veterinarian_id: appointment.veterinarian_id ? String(appointment.veterinarian_id) : "",
  });
  const [cities, setCities] = useState([]);
  const [availableClinics, setAvailableClinics] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDistricts = useDistrictOptions(formData.city_id);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
      ...(name === "city_id" ? { district: "", veterinarian_id: "", appointment_time: "" } : {}),
      ...(name === "district" ? { veterinarian_id: "", appointment_time: "" } : {}),
      ...(["veterinarian_id", "appointment_date"].includes(name) ? { appointment_time: "" } : {}),
    }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (formData.appointment_date < getTodayDateString()) {
      setError("Geçmiş tarihe randevu alamazsınız.");
      return;
    }

    const selectedTime = availableTimes.find((timeOption) => timeOption.time === formData.appointment_time);
    const isOriginalSlot =
      String(formData.veterinarian_id) === String(appointment.veterinarian_id) &&
      formData.appointment_date === appointment.appointment_date &&
      formData.appointment_time === formatTime(appointment.appointment_time);

    if (selectedTime && !selectedTime.available && !isOriginalSlot) {
      setError("Bu saat dolu, lütfen başka saat seçin.");
      return;
    }

    setIsSubmitting(true);

    axios
      .patch(`${API_BASE_URL}/appointments/${appointment.id}`, {
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        service_id: Number(formData.service_id),
        veterinarian_id: Number(formData.veterinarian_id),
      })
      .then(() => {
        onUpdated?.();
      })
      .catch((requestError) => {
        console.error(requestError);
        setError(getApiErrorMessage(requestError, "Randevu güncellenemedi."));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/cities`)
      .then((response) => setCities(response.data))
      .catch((requestError) => console.error(requestError));
  }, []);

  useEffect(() => {
    if (!formData.city_id) {
      setAvailableClinics([]);
      return;
    }

    const params = new URLSearchParams();
    ["city_id", "district", "service_id", "appointment_date", "appointment_time"].forEach((key) => {
      if (formData[key]) {
        params.append(key, formData[key]);
      }
    });

    axios
      .get(`${API_BASE_URL}/veterinarians/search?${params.toString()}`)
      .then((response) => {
        let clinics = uniqueClinics(response.data);
        const currentClinic = makeCurrentClinicOption(appointment);

        if (
          currentClinic &&
          String(currentClinic.id) === String(formData.veterinarian_id) &&
          !clinics.some((clinic) => String(clinic.id) === String(currentClinic.id))
        ) {
          clinics = [currentClinic, ...clinics];
        }

        setAvailableClinics(clinics);
      })
      .catch((requestError) => {
        console.error(requestError);
        setAvailableClinics([]);
      });
  }, [
    appointment,
    formData.city_id,
    formData.district,
    formData.service_id,
    formData.appointment_date,
    formData.appointment_time,
    formData.veterinarian_id,
  ]);

  useEffect(() => {
    if (!formData.veterinarian_id || !formData.appointment_date) {
      setAvailableTimes([]);
      return;
    }

    axios
      .get(
        `${API_BASE_URL}/veterinarians/${formData.veterinarian_id}/available-times?date=${formData.appointment_date}`
      )
      .then((response) => setAvailableTimes(response.data))
      .catch((requestError) => {
        console.error(requestError);
        setAvailableTimes([]);
      });
  }, [formData.veterinarian_id, formData.appointment_date]);

  return (
    <form className="appointment-edit-form" onSubmit={handleSubmit}>
      <div className="form-grid compact-form-grid">
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
          Klinik / Veteriner
          <select
            name="veterinarian_id"
            value={formData.veterinarian_id}
            onChange={handleChange}
            disabled={!formData.city_id}
            required
          >
            <option value="">Klinik seçin</option>
            {availableClinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.clinic_name
                  ? `${clinic.clinic_name} - ${clinic.full_name}`
                  : clinic.full_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Hizmet
          <select name="service_id" value={formData.service_id} onChange={handleChange} required>
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
            min={getTodayDateString()}
            value={formData.appointment_date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Saat
          <select
            name="appointment_time"
            value={formData.appointment_time}
            onChange={handleChange}
            required
          >
            {(availableTimes.length > 0
              ? availableTimes
              : appointmentTimes.map((time) => ({ time, available: true }))
            ).map((timeOption) => {
              const isOriginalSlot =
                String(formData.veterinarian_id) === String(appointment.veterinarian_id) &&
                formData.appointment_date === appointment.appointment_date &&
                timeOption.time === formatTime(appointment.appointment_time);

              return (
                <option
                  key={timeOption.time}
                  value={timeOption.time}
                  disabled={!timeOption.available && !isOriginalSlot}
                >
                  {timeOption.time}
                  {!timeOption.available && !isOriginalSlot ? " - Dolu" : ""}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="record-actions split-actions">
        <button className="compact-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button className="danger-button" type="button" onClick={onCancel}>
          Vazgeç
        </button>
      </div>
    </form>
  );
}

function AppointmentCard({
  appointment,
  editable,
  services,
  onAppointmentUpdated,
  onStatusChanged,
  showCustomer,
  autoStatus,
  deletable,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const visibleStatus = autoStatus ? getVisibleStatus(appointment) : appointment.status || "-";

  const handleCancelAppointment = () => {
    const isConfirmed = window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?");

    if (!isConfirmed) {
      return;
    }

    setActionError("");
    setIsCancelling(true);

    axios
      .patch(`${API_BASE_URL}/appointments/${appointment.id}`, {
        status: "İptal",
      })
      .then(() => {
        setIsEditing(false);
        onAppointmentUpdated?.("Randevu iptal edildi.");
      })
      .catch((requestError) => {
        console.error(requestError);
        setActionError(requestError.response?.data?.detail || "Randevu iptal edilemedi.");
      })
      .finally(() => {
        setIsCancelling(false);
      });
  };

  const handleDeleteAppointment = () => {
    const isConfirmed = window.confirm("Bu randevuyu silmek istediğinize emin misiniz?");

    if (!isConfirmed) {
      return;
    }

    setActionError("");
    setIsCancelling(true);

    axios
      .delete(`${API_BASE_URL}/appointments/${appointment.id}`)
      .then(() => {
        onAppointmentUpdated?.("Randevu silindi.");
      })
      .catch((requestError) => {
        console.error(requestError);
        setActionError(requestError.response?.data?.detail || "Randevu silinemedi.");
      })
      .finally(() => {
        setIsCancelling(false);
      });
  };

  return (
    <article className="record-card appointment-card">
      <div className="record-topline">
        <h3>Randevu ID #{appointment.id}</h3>
        <span className={`status-badge ${getStatusClass(visibleStatus)}`}>
          {visibleStatus}
        </span>
      </div>

      <div className="record-grid appointment-grid">
        {showCustomer && (
          <p>
            <span>Müşteri</span>
            {appointment.customer_name || appointment.user_id || "-"}
          </p>
        )}
        <p>
          <span>Hayvan</span>
          {appointment.pet_name || appointment.pet_id || "-"}
        </p>
        <p>
          <span>Klinik</span>
          {appointment.clinic_name || "-"}
        </p>
        <p>
          <span>Şehir / İlçe</span>
          {appointment.city_name || "-"} /{" "}
          {appointment.district || appointment.veterinarian_district || "-"}
        </p>
        <p>
          <span>Veteriner</span>
          {appointment.veterinarian_name || appointment.veterinarian_id || "-"}
        </p>
        <p>
          <span>Hizmet / Neden</span>
          {appointment.service_name || appointment.service_id || "-"}
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

      {editable && isUpcomingAppointment(appointment) && (
        <div className="record-actions split-actions">
          <button
            className="compact-button"
            type="button"
            onClick={() => setIsEditing((currentValue) => !currentValue)}
          >
            Düzenle
          </button>
          <button
            className="danger-button"
            type="button"
            disabled={isCancelling}
            onClick={handleCancelAppointment}
          >
            {isCancelling ? "İptal ediliyor..." : "İptal Et"}
          </button>
        </div>
      )}

      {deletable && !isUpcomingAppointment(appointment) && (
        <div className="record-actions">
          <button
            className="danger-button"
            type="button"
            disabled={isCancelling}
            onClick={handleDeleteAppointment}
          >
            {isCancelling ? "Siliniyor..." : "Sil"}
          </button>
        </div>
      )}

      {actionError && <p className="form-error">{actionError}</p>}

      {isEditing && (
        <AppointmentEditForm
          appointment={appointment}
          services={services}
          onCancel={() => setIsEditing(false)}
          onUpdated={() => {
            setIsEditing(false);
            onAppointmentUpdated?.();
          }}
        />
      )}

      {onStatusChanged && (
        <label className="status-control">
          Durum
          <select
            value={appointment.status}
            onChange={(event) => onStatusChanged(appointment.id, event.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      )}
    </article>
  );
}

function AppointmentGroup({
  title,
  appointments,
  emptyMessage,
  editable,
  services,
  onAppointmentUpdated,
  showCustomer,
  deletable = false,
}) {
  return (
    <div className="appointment-group-card">
      <h3>{title}</h3>
      {appointments.length === 0 ? (
        <div className="empty-card compact-empty">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="record-list appointment-list">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              editable={editable}
              services={services}
              onAppointmentUpdated={onAppointmentUpdated}
              showCustomer={showCustomer}
              deletable={deletable}
              autoStatus
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentList({
  appointments,
  onStatusChanged,
  onAppointmentUpdated,
  title = "Randevular",
  label,
  emptyMessage = "Henüz randevu kaydı yok.",
  showCustomer = true,
  grouped = false,
  editable = false,
  services = [],
  autoStatus = false,
  deletablePast = false,
}) {
  const sortedAppointments = sortAppointments(appointments);
  const upcomingAppointments = sortedAppointments.filter(isUpcomingAppointment);
  const pastAppointments = sortedAppointments.filter(
    (appointment) => !isUpcomingAppointment(appointment)
  );

  return (
    <section className="panel-card appointment-panel">
      <div className="panel-heading">
        {label && <p className="section-label">{label}</p>}
        <h2>{title}</h2>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-card">
          <h3>{emptyMessage}</h3>
          <p>Yeni randevular oluşturulduğunda burada listelenecek.</p>
        </div>
      ) : grouped ? (
        <div className="appointment-group-list">
          <AppointmentGroup
            title="Yaklaşan Randevularım"
            appointments={upcomingAppointments}
            emptyMessage="Yaklaşan randevunuz yok."
            editable={editable}
            services={services}
            onAppointmentUpdated={onAppointmentUpdated}
            showCustomer={showCustomer}
          />
          <AppointmentGroup
            title="Geçmiş Randevularım"
            appointments={pastAppointments}
            emptyMessage="Geçmiş randevunuz yok."
            editable={false}
            services={services}
            onAppointmentUpdated={onAppointmentUpdated}
            showCustomer={showCustomer}
            deletable={deletablePast}
          />
        </div>
      ) : (
        <div className="record-list appointment-list">
          {sortedAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              editable={editable}
              services={services}
              onAppointmentUpdated={onAppointmentUpdated}
              onStatusChanged={onStatusChanged}
              showCustomer={showCustomer}
              autoStatus={autoStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default AppointmentList;
