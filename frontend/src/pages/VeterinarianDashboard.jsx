import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const appointmentTimes = Array.from({ length: 19 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

const statusOptions = ["Bekliyor", "Onaylandı", "Tamamlandı", "İptal"];
const statusTransitions = {
  Bekliyor: ["Bekliyor", "Onaylandı", "Tamamlandı", "İptal"],
  Onaylandı: ["Onaylandı", "Tamamlandı", "İptal"],
  Tamamlandı: ["Tamamlandı"],
  İptal: ["İptal"],
};
const NEW_CUSTOMER_VALUE = "new";
const NEW_PET_VALUE = "new";

const initialAppointmentForm = {
  user_id: "",
  pet_id: "",
  service_id: "",
  appointment_date: "",
  appointment_time: "",
};

const initialNewCustomer = {
  full_name: "",
  phone: "",
  email: "",
  password: "",
};

const initialNewPet = {
  name: "",
  species: "",
  breed: "",
  age: "",
  gender: "",
};

const initialAppointmentStats = {
  total: 0,
  pending: 0,
  completed: 0,
  cancelled: 0,
};

function formatTime(value) {
  return value ? value.slice(0, 5) : "-";
}

function getTodayDateString() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function uniqueServices(services) {
  const seenNames = new Set();

  return services.filter((service) => {
    const nameKey = service.service_name?.trim().toLocaleLowerCase("tr-TR");

    if (!nameKey || seenNames.has(nameKey)) {
      return false;
    }

    seenNames.add(nameKey);
    return true;
  });
}

function normalizeStatus(statusValue) {
  return statusValue?.toLocaleLowerCase("tr-TR") || "";
}

function isPastDate(dateValue) {
  return dateValue && dateValue < getTodayDateString();
}

function isActiveAppointment(appointment) {
  const status = normalizeStatus(appointment.status);
  return (
    !isPastDate(appointment.appointment_date) &&
    (status.includes("bekliyor") || status.includes("onay"))
  );
}

function getDisplayStatus(appointment) {
  const status = normalizeStatus(appointment.status);

  if (status.includes("iptal")) return "İptal";
  if (status.includes("tamam")) return "Tamamlandı";
  if (isPastDate(appointment.appointment_date)) return "Geçmiş";
  return appointment.status || "Bekliyor";
}

function getStatusClass(statusValue) {
  const status = normalizeStatus(statusValue);

  if (status.includes("geçmiş") || status.includes("gecmis")) return "status-expired";
  if (status.includes("iptal")) return "status-cancelled";
  if (status.includes("tamam")) return "status-completed";
  if (status.includes("onay")) return "status-approved";
  return "status-pending";
}

function getCanonicalStatus(statusValue) {
  const status = normalizeStatus(statusValue);

  if (status.includes("iptal")) return "İptal";
  if (status.includes("tamam")) return "Tamamlandı";
  if (status.includes("onay")) return "Onaylandı";
  return "Bekliyor";
}

function getStatusTransitionOptions(statusValue) {
  return statusTransitions[getCanonicalStatus(statusValue)] || statusOptions;
}

function isLockedStatus(statusValue) {
  const status = getCanonicalStatus(statusValue);
  return status === "Tamamlandı" || status === "İptal";
}

function getStatusCounts(appointments) {
  return appointments.reduce(
    (counts, appointment) => {
      const status = normalizeStatus(appointment.status);

      if (status.includes("iptal")) {
        counts.cancelled += 1;
      } else if (status.includes("tamam")) {
        counts.completed += 1;
      } else if (isActiveAppointment(appointment) && status.includes("bekliyor")) {
        counts.pending += 1;
      }

      if (isActiveAppointment(appointment)) {
        counts.total += 1;
      }

      return counts;
    },
    { ...initialAppointmentStats }
  );
}

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string" && detail.toLocaleLowerCase("tr-TR").includes("dolu")) {
    return "Bu saat dolu, lütfen başka saat seçin.";
  }

  return detail || fallbackMessage;
}

function VeterinarianAppointmentCard({ appointment, onChanged, mode = "active", onRepeat }) {
  const [selectedDate, setSelectedDate] = useState(appointment.appointment_date || "");
  const [selectedTime, setSelectedTime] = useState(formatTime(appointment.appointment_time));
  const [selectedStatus, setSelectedStatus] = useState(appointment.status || "Bekliyor");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const isActive = mode === "active" && isActiveAppointment(appointment);
  const displayStatus = getDisplayStatus(appointment);
  const statusTransitionOptions = getStatusTransitionOptions(appointment.status);
  const isStatusLocked = isLockedStatus(appointment.status);

  useEffect(() => {
    setSelectedDate(appointment.appointment_date || "");
    setSelectedTime(formatTime(appointment.appointment_time));
    setSelectedStatus(appointment.status || "Bekliyor");
  }, [appointment]);

  useEffect(() => {
    if (!appointment.veterinarian_id || !selectedDate) {
      setAvailableTimes([]);
      return;
    }

    axios
      .get(`${API_BASE_URL}/veterinarians/${appointment.veterinarian_id}/available-times?date=${selectedDate}`)
      .then((response) => setAvailableTimes(response.data))
      .catch((requestError) => {
        console.error(requestError);
        setAvailableTimes([]);
      });
  }, [appointment.veterinarian_id, selectedDate]);

  const updateAppointment = () => {
    setError("");

    const selectedTimeOption = availableTimes.find((timeOption) => timeOption.time === selectedTime);
    const isOriginalSlot =
      selectedDate === appointment.appointment_date &&
      selectedTime === formatTime(appointment.appointment_time);

    if (selectedTimeOption && !selectedTimeOption.available && !isOriginalSlot) {
      setError("Bu saat dolu, lütfen başka saat seçin.");
      return;
    }

    setIsUpdating(true);

    axios
      .patch(`${API_BASE_URL}/appointments/${appointment.id}`, {
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: selectedStatus,
      })
      .then(() => {
        onChanged?.("Randevu güncellendi.");
      })
      .catch((requestError) => {
        console.error(requestError);
        setError(getApiErrorMessage(requestError, "Randevu güncellenemedi."));
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
        <span className={`status-badge ${getStatusClass(displayStatus)}`}>
          {displayStatus}
        </span>
      </div>

      <div className="record-grid appointment-grid vet-appointment-grid">
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
          <span>Tarih</span>
          {appointment.appointment_date || "-"}
        </p>
        <p>
          <span>Saat</span>
          {formatTime(appointment.appointment_time)}
        </p>
      </div>

      {isActive ? (
        <div className="vet-appointment-actions">
          <label>
            Yeni tarih
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <label>
            Yeni saat
            <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)}>
              {(availableTimes.length > 0
                ? availableTimes
                : appointmentTimes.map((time) => ({ time, available: true }))
              ).map((timeOption) => {
                const isOriginalSlot =
                  selectedDate === appointment.appointment_date &&
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
          <label>
            Durum
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              disabled={isStatusLocked}
            >
              {statusTransitionOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button
            className="compact-button"
            type="button"
            disabled={isUpdating}
            onClick={updateAppointment}
          >
            Güncelle
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
      ) : (
        <div className="record-actions">
          <button
            className="compact-button"
            type="button"
            onClick={() => onRepeat?.(appointment)}
          >
            Tekrar Randevu Ver
          </button>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </article>
  );
}

function VeterinarianDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [veterinarian, setVeterinarian] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerPets, setCustomerPets] = useState([]);
  const [services, setServices] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [activeAppointmentTab, setActiveAppointmentTab] = useState("active");
  const [newCustomer, setNewCustomer] = useState(initialNewCustomer);
  const [newPet, setNewPet] = useState(initialNewPet);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const createFormRef = useRef(null);

  const computedStatusCounts = useMemo(() => getStatusCounts(appointments), [appointments]);
  const statusCounts = appointmentStats || computedStatusCounts;
  const activeAppointments = useMemo(
    () => appointments.filter(isActiveAppointment),
    [appointments]
  );
  const oldAppointments = useMemo(
    () => appointments.filter((appointment) => !isActiveAppointment(appointment)),
    [appointments]
  );
  const visibleAppointments =
    activeAppointmentTab === "active" ? activeAppointments : oldAppointments;
  const isAddingCustomer = appointmentForm.user_id === NEW_CUSTOMER_VALUE;
  const isAddingPet = isAddingCustomer || appointmentForm.pet_id === NEW_PET_VALUE;

  const fetchAppointments = (veterinarianId) => {
    setIsLoading(true);
    setError("");

    Promise.all([
      axios.get(`${API_BASE_URL}/veterinarians/${veterinarianId}/appointments`),
      axios.get(`${API_BASE_URL}/veterinarians/${veterinarianId}/appointment-stats`),
    ])
      .then(([appointmentsResponse, statsResponse]) => {
        setAppointments(appointmentsResponse.data);
        setAppointmentStats(statsResponse.data);
      })
      .catch((requestError) => {
        console.error(requestError);
        setError("Kliniğinize ait randevular alınırken bir hata oluştu.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const fetchAppointmentFormData = () => {
    Promise.all([axios.get(`${API_BASE_URL}/services`)])
      .then(([servicesResponse]) => {
        setServices(uniqueServices(servicesResponse.data));
      })
      .catch((requestError) => {
        console.error(requestError);
        setCreateError("Randevu formu verileri alınırken bir hata oluştu.");
      });
  };

  const fetchClinicCustomers = (veterinarianId) => {
    axios
      .get(`${API_BASE_URL}/veterinarians/${veterinarianId}/customers`)
      .then((response) => setCustomers(response.data))
      .catch((requestError) => {
        console.error(requestError);
        setCreateError("Klinik müşteri listesi alınırken bir hata oluştu.");
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

  const handleAppointmentFormChange = (event) => {
    const { name, value } = event.target;

    setAppointmentForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "user_id"
        ? { pet_id: value === NEW_CUSTOMER_VALUE ? NEW_PET_VALUE : "" }
        : {}),
      ...(name === "appointment_date" ? { appointment_time: "" } : {}),
    }));
    setCreateError("");
    setSuccessMessage("");
  };

  const handleNewCustomerChange = (event) => {
    const { name, value } = event.target;
    setNewCustomer((currentCustomer) => ({ ...currentCustomer, [name]: value }));
    setCreateError("");
  };

  const handleNewPetChange = (event) => {
    const { name, value } = event.target;
    setNewPet((currentPet) => ({ ...currentPet, [name]: value }));
    setCreateError("");
  };

  const handleRepeatAppointment = (appointment) => {
    setAppointmentForm({
      user_id: appointment.user_id ? String(appointment.user_id) : "",
      pet_id: appointment.pet_id ? String(appointment.pet_id) : "",
      service_id: appointment.service_id ? String(appointment.service_id) : "",
      appointment_date: "",
      appointment_time: "",
    });
    setNewCustomer(initialNewCustomer);
    setNewPet(initialNewPet);
    setCreateError("");
    setSuccessMessage("");
    createFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const createClinicAppointment = async (event) => {
    event.preventDefault();
    setCreateError("");
    setSuccessMessage("");

    if (!veterinarian?.id) {
      setCreateError("Veteriner bilgisi alınamadı.");
      return;
    }

    setIsCreatingAppointment(true);

    try {
      let userId = appointmentForm.user_id;
      let petId = appointmentForm.pet_id;

      const selectedTime = availableTimes.find(
        (timeOption) => timeOption.time === appointmentForm.appointment_time
      );
      if (selectedTime && !selectedTime.available) {
        setCreateError("Bu saat dolu, lütfen başka saat seçin.");
        setIsCreatingAppointment(false);
        return;
      }

      if (isAddingCustomer) {
        const customerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
          ...newCustomer,
          role: "customer",
        });
        userId = customerResponse.data.id;
      }

      if (isAddingPet) {
        const petResponse = await axios.post(`${API_BASE_URL}/pets`, {
          user_id: Number(userId),
          name: newPet.name,
          species: newPet.species,
          breed: newPet.breed,
          age: Number(newPet.age),
          gender: newPet.gender,
        });
        petId = petResponse.data.id;
      }

      await axios.post(`${API_BASE_URL}/appointments`, {
        user_id: Number(userId),
        pet_id: Number(petId),
        veterinarian_id: Number(veterinarian.id),
        service_id: Number(appointmentForm.service_id),
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        status: "Onaylandı",
      });

      setAppointmentForm(initialAppointmentForm);
      setNewCustomer(initialNewCustomer);
      setNewPet(initialNewPet);
      setCustomerPets([]);
      fetchClinicCustomers(veterinarian.id);
      refreshAppointments("Randevu başarıyla oluşturuldu.");
    } catch (requestError) {
      console.error(requestError);
      setCreateError(requestError.response?.data?.detail || "Randevu oluşturulamadı.");
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  useEffect(() => {
    if (!user?.id || user.role !== "veterinarian") {
      navigate("/login");
      return;
    }

    setVeterinarian(user);
    fetchAppointments(user.id);
    fetchClinicCustomers(user.id);
    fetchAppointmentFormData();
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!appointmentForm.user_id || isAddingCustomer) {
      setCustomerPets([]);
      return;
    }

    axios
      .get(`${API_BASE_URL}/users/${appointmentForm.user_id}/pets`)
      .then((response) => setCustomerPets(response.data))
      .catch((requestError) => {
        console.error(requestError);
        setCustomerPets([]);
        setCreateError("Müşteriye ait hayvanlar alınamadı.");
      });
  }, [appointmentForm.user_id, isAddingCustomer]);

  useEffect(() => {
    if (!veterinarian?.id || !appointmentForm.appointment_date) {
      setAvailableTimes([]);
      return;
    }

    axios
      .get(
        `${API_BASE_URL}/veterinarians/${veterinarian.id}/available-times?date=${appointmentForm.appointment_date}`
      )
      .then((response) => {
        setAvailableTimes(response.data);
        const selectedTime = response.data.find(
          (timeOption) => timeOption.time === appointmentForm.appointment_time
        );

        if (selectedTime && !selectedTime.available) {
          setCreateError("Bu saat dolu, lütfen başka saat seçin.");
        }
      })
      .catch((requestError) => {
        console.error(requestError);
        setAvailableTimes([]);
      });
  }, [veterinarian?.id, appointmentForm.appointment_date, appointmentForm.appointment_time]);

  return (
    <div className="vet-dashboard">
      <main className="vet-main" id="appointments">
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
            <strong>{statusCounts.total}</strong>
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

        <section className="panel-card appointment-panel vet-create-panel" ref={createFormRef}>
          <div className="panel-heading">
            <p className="section-label">Randevu Ver</p>
            <h2>Kliniğiniz İçin Randevu Oluşturun</h2>
          </div>

          <form className="vet-create-form" onSubmit={createClinicAppointment}>
            <div className="form-grid vet-create-grid">
              <label>
                Müşteri seç
                <select
                  name="user_id"
                  value={appointmentForm.user_id}
                  onChange={handleAppointmentFormChange}
                  required
                >
                  <option value="">Müşteri seçin</option>
                  <option value={NEW_CUSTOMER_VALUE}>Yeni müşteri ekle</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} - {customer.phone || customer.email}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Hayvan seç
                <select
                  name="pet_id"
                  value={appointmentForm.pet_id}
                  onChange={handleAppointmentFormChange}
                  disabled={!appointmentForm.user_id || isAddingCustomer}
                  required
                >
                  <option value="">Hayvan seçin</option>
                  {appointmentForm.user_id && !isAddingCustomer && (
                    <option value={NEW_PET_VALUE}>Yeni hayvan ekle</option>
                  )}
                  {customerPets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} - {pet.species}
                    </option>
                  ))}
                </select>
              </label>

              {isAddingCustomer && (
                <>
                  <label>
                    Ad Soyad
                    <input
                      name="full_name"
                      value={newCustomer.full_name}
                      onChange={handleNewCustomerChange}
                      required
                    />
                  </label>
                  <label>
                    Telefon
                    <input
                      name="phone"
                      value={newCustomer.phone}
                      onChange={handleNewCustomerChange}
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={newCustomer.email}
                      onChange={handleNewCustomerChange}
                      required
                    />
                  </label>
                  <label>
                    Şifre
                    <input
                      type="password"
                      name="password"
                      value={newCustomer.password}
                      onChange={handleNewCustomerChange}
                      required
                    />
                  </label>
                </>
              )}

              {isAddingPet && (
                <>
                  <label>
                    Hayvan adı
                    <input
                      name="name"
                      value={newPet.name}
                      onChange={handleNewPetChange}
                      required
                    />
                  </label>
                  <label>
                    Tür
                    <input
                      name="species"
                      value={newPet.species}
                      onChange={handleNewPetChange}
                      required
                    />
                  </label>
                  <label>
                    Cins
                    <input
                      name="breed"
                      value={newPet.breed}
                      onChange={handleNewPetChange}
                      required
                    />
                  </label>
                  <label>
                    Yaş
                    <input
                      type="number"
                      min="0"
                      name="age"
                      value={newPet.age}
                      onChange={handleNewPetChange}
                      required
                    />
                  </label>
                  <label>
                    Cinsiyet
                    <select
                      name="gender"
                      value={newPet.gender}
                      onChange={handleNewPetChange}
                      required
                    >
                      <option value="">Cinsiyet seçin</option>
                      <option value="Dişi">Dişi</option>
                      <option value="Erkek">Erkek</option>
                    </select>
                  </label>
                </>
              )}

              <label>
                Hizmet seç
                <select
                  name="service_id"
                  value={appointmentForm.service_id}
                  onChange={handleAppointmentFormChange}
                  required
                >
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
                  value={appointmentForm.appointment_date}
                  onChange={handleAppointmentFormChange}
                  required
                />
              </label>

              <label>
                Saat
                <select
                  name="appointment_time"
                  value={appointmentForm.appointment_time}
                  onChange={handleAppointmentFormChange}
                  required
                >
                  <option value="">Saat seçin</option>
                  {(availableTimes.length > 0
                    ? availableTimes
                    : appointmentTimes.map((time) => ({ time, available: true }))
                  ).map((timeOption) => (
                    <option
                      key={timeOption.time}
                      value={timeOption.time}
                      disabled={!timeOption.available}
                    >
                      {timeOption.time}
                      {!timeOption.available ? " - Dolu" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {createError && <p className="form-error">{createError}</p>}

            <button type="submit" disabled={isCreatingAppointment}>
              {isCreatingAppointment ? "Oluşturuluyor..." : "Randevu Oluştur"}
            </button>
          </form>
        </section>

        <section className="panel-card appointment-panel vet-appointments-panel">
          <div className="panel-heading">
            <p className="section-label">{isLoading ? "Yükleniyor" : "Klinik Takvimi"}</p>
            <h2>Randevular</h2>
          </div>

          <div className="vet-tabs">
            <button
              className={activeAppointmentTab === "active" ? "active" : ""}
              type="button"
              onClick={() => setActiveAppointmentTab("active")}
            >
              Aktif Randevular
            </button>
            <button
              className={activeAppointmentTab === "old" ? "active" : ""}
              type="button"
              onClick={() => setActiveAppointmentTab("old")}
            >
              Eski Randevular
            </button>
          </div>

          {visibleAppointments.length === 0 ? (
            <div className="empty-card">
              <h3>
                {activeAppointmentTab === "active"
                  ? "Aktif randevu bulunmuyor."
                  : "Eski randevu bulunmuyor."}
              </h3>
              <p>Randevular oluştuğunda bu sekmede görünecek.</p>
            </div>
          ) : (
            <div className="record-list appointment-list">
              {visibleAppointments.map((appointment) => (
                <VeterinarianAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onChanged={refreshAppointments}
                  mode={activeAppointmentTab}
                  onRepeat={handleRepeatAppointment}
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
