import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PetList from "../components/PetList";
import AppointmentList from "../components/AppointmentList";
import { useDistrictOptions } from "../api/districts";

const API_BASE_URL = "http://127.0.0.1:8000";

const appointmentTimes = Array.from({ length: 19 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

const speciesOptions = ["Kedi", "Köpek", "Kuş", "Tavşan", "Hamster", "Diğer"];

const breedOptions = {
  Kedi: [
    "Tekir",
    "British Shorthair",
    "Scottish Fold",
    "İran Kedisi",
    "Van Kedisi",
    "Ankara Kedisi",
    "Siyam",
    "Diğer",
  ],
  Köpek: [
    "Golden Retriever",
    "Labrador",
    "Alman Kurdu",
    "Poodle",
    "Beagle",
    "Husky",
    "Terrier",
    "Diğer",
  ],
  Kuş: ["Muhabbet Kuşu", "Kanarya", "Papağan", "Sultan Papağanı", "Diğer"],
  Tavşan: ["Hollanda Lop", "Mini Rex", "Angora", "Diğer"],
  Hamster: ["Suriye Hamsterı", "Roborovski", "Campbell", "Diğer"],
  Diğer: ["Diğer"],
};

const initialPetForm = {
  name: "",
  species: "Kedi",
  breed: "Tekir",
  age: "",
  gender: "",
};

function getStoredUser() {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
}

function getPendingAppointment() {
  const pendingAppointment = localStorage.getItem("pendingAppointment");
  return pendingAppointment ? JSON.parse(pendingAppointment) : null;
}

function getTodayDateString() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function isPastDate(dateValue) {
  return dateValue && dateValue < getTodayDateString();
}

function formatTime(value) {
  return value ? value.slice(0, 5) : "-";
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

function getInitialAppointmentForm(pendingAppointment) {
  return {
    city_id: pendingAppointment?.city_id ? String(pendingAppointment.city_id) : "",
    district: pendingAppointment?.district || "",
    veterinarian_id: pendingAppointment?.veterinarian_id
      ? String(pendingAppointment.veterinarian_id)
      : "",
    service_id: pendingAppointment?.service_id ? String(pendingAppointment.service_id) : "",
    appointment_date: pendingAppointment?.appointment_date || "",
    appointment_time: pendingAppointment?.appointment_time
      ? formatTime(pendingAppointment.appointment_time)
      : "",
  };
}

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string" && detail.toLocaleLowerCase("tr-TR").includes("dolu")) {
    return "Bu saat dolu, lütfen başka saat seçin.";
  }

  return detail || fallbackMessage;
}

function CustomerDashboard() {
  const initialPendingAppointment = getPendingAppointment();
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [cities, setCities] = useState([]);
  const [services, setServices] = useState([]);
  const [availableClinics, setAvailableClinics] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [pendingAppointment, setPendingAppointment] = useState(initialPendingAppointment);
  const [appointmentForm, setAppointmentForm] = useState(() =>
    getInitialAppointmentForm(initialPendingAppointment)
  );
  const [appointmentMode, setAppointmentMode] = useState("existing");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [newPet, setNewPet] = useState(initialPetForm);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user] = useState(getStoredUser);
  const navigate = useNavigate();

  const availableBreeds = breedOptions[newPet.species] || ["Diğer"];
  const availableDistricts = useDistrictOptions(appointmentForm.city_id);

  const selectedAppointmentDetails = useMemo(() => {
    if (!pendingAppointment) return [];

    return [
      ["Klinik", pendingAppointment.clinic_name || "-"],
      ["Veteriner", pendingAppointment.veterinarian_name || "-"],
      ["Hizmet", pendingAppointment.service_name || "-"],
      ["Tarih", pendingAppointment.appointment_date || "-"],
      ["Saat", formatTime(pendingAppointment.appointment_time)],
    ];
  }, [pendingAppointment]);

  const fetchPets = () => {
    if (!user?.id) return;

    axios
      .get(`${API_BASE_URL}/users/${user.id}/pets`)
      .then((response) => {
        setPets(response.data);
        const hasSelectedPet = response.data.some(
          (pet) => String(pet.id) === String(selectedPetId)
        );

        if ((!selectedPetId || !hasSelectedPet) && response.data.length > 0) {
          setSelectedPetId(String(response.data[0].id));
        }

        if (response.data.length === 0) {
          setSelectedPetId("");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const fetchAppointments = () => {
    if (!user?.id) return;

    axios
      .get(`${API_BASE_URL}/users/${user.id}/appointments`)
      .then((response) => setAppointments(response.data))
      .catch((error) => {
        console.error(error);
      });
  };

  const refreshCustomerData = () => {
    fetchPets();
    fetchAppointments();
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleAppointmentFieldChange = (event) => {
    const { name, value } = event.target;

    setAppointmentForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "city_id" ? { district: "", veterinarian_id: "", appointment_time: "" } : {}),
      ...(name === "district" ? { veterinarian_id: "", appointment_time: "" } : {}),
      ...(["veterinarian_id", "appointment_date"].includes(name) ? { appointment_time: "" } : {}),
    }));
    setSuccessMessage("");
    setPageError("");
  };

  const handleModeChange = (event) => {
    setAppointmentMode(event.target.value);
    setSuccessMessage("");
    setPageError("");
  };

  const handleNewPetChange = (event) => {
    const { name, value } = event.target;

    setNewPet((currentPet) => {
      if (name === "species") {
        const nextBreeds = breedOptions[value] || ["Diğer"];
        return {
          ...currentPet,
          species: value,
          breed: nextBreeds[0],
        };
      }

      return {
        ...currentPet,
        [name]: value,
      };
    });
  };

  const createAppointment = async (event) => {
    event.preventDefault();
    setPageError("");
    setSuccessMessage("");

    if (isPastDate(appointmentForm.appointment_date)) {
      setPageError("Geçmiş tarihe randevu alamazsınız.");
      return;
    }

    const selectedTime = availableTimes.find((timeOption) => timeOption.time === appointmentForm.appointment_time);
    if (!pendingAppointment && selectedTime && !selectedTime.available) {
      setPageError("Bu saat dolu, lütfen başka saat seçin.");
      return;
    }

    if (
      !appointmentForm.veterinarian_id ||
      !appointmentForm.service_id ||
      !appointmentForm.appointment_date ||
      !appointmentForm.appointment_time ||
      (!pendingAppointment && !appointmentForm.city_id)
    ) {
      setPageError("Lütfen klinik, hizmet, tarih ve saat alanlarını doldurun.");
      return;
    }

    if (appointmentMode === "existing" && !selectedPetId) {
      setPageError("Lütfen randevu için hayvan seçin.");
      return;
    }

    setIsSubmitting(true);

    try {
      let petId = selectedPetId;

      if (appointmentMode === "new") {
        const petResponse = await axios.post(`${API_BASE_URL}/pets`, {
          user_id: user.id,
          name: newPet.name,
          species: newPet.species,
          breed: newPet.breed,
          age: Number(newPet.age),
          gender: newPet.gender,
        });
        petId = petResponse.data.id;
      }

      await axios.post(`${API_BASE_URL}/appointments`, {
        user_id: user.id,
        pet_id: Number(petId),
        veterinarian_id: Number(appointmentForm.veterinarian_id),
        service_id: Number(appointmentForm.service_id),
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        status: "Bekliyor",
      });

      localStorage.removeItem("pendingAppointment");
      setPendingAppointment(null);
      setNewPet(initialPetForm);
      setAppointmentMode("existing");
      setSuccessMessage("Randevunuz başarıyla oluşturuldu.");
      refreshCustomerData();
    } catch (error) {
      console.error(error);
      setPageError(getApiErrorMessage(error, "Randevu oluşturulurken bir hata oluştu."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppointmentUpdated = (message = "Randevu başarıyla güncellendi.") => {
    setSuccessMessage(message);
    fetchAppointments();
  };

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    refreshCustomerData();

    axios
      .get(`${API_BASE_URL}/cities`)
      .then((response) => setCities(response.data))
      .catch((error) => console.error(error));

    axios
      .get(`${API_BASE_URL}/services`)
      .then((response) => setServices(response.data))
      .catch((error) => console.error(error));
  }, [user?.id]);

  useEffect(() => {
    if (!selectedPetId && pets.length > 0) {
      setSelectedPetId(String(pets[0].id));
    }
  }, [pets, selectedPetId]);

  useEffect(() => {
    if (pendingAppointment || !appointmentForm.city_id) {
      setAvailableClinics([]);
      return;
    }

    const params = new URLSearchParams();
    ["city_id", "district", "service_id", "appointment_date", "appointment_time"].forEach((key) => {
      if (appointmentForm[key]) {
        params.append(key, appointmentForm[key]);
      }
    });

    axios
      .get(`${API_BASE_URL}/veterinarians/search?${params.toString()}`)
      .then((response) => {
        setAvailableClinics(uniqueClinics(response.data));
      })
      .catch((error) => {
        console.error(error);
        setAvailableClinics([]);
      });
  }, [
    appointmentForm.city_id,
    appointmentForm.district,
    appointmentForm.service_id,
    appointmentForm.appointment_date,
    appointmentForm.appointment_time,
    pendingAppointment,
  ]);

  useEffect(() => {
    if (pendingAppointment || !appointmentForm.veterinarian_id || !appointmentForm.appointment_date) {
      setAvailableTimes([]);
      return;
    }

    axios
      .get(
        `${API_BASE_URL}/veterinarians/${appointmentForm.veterinarian_id}/available-times?date=${appointmentForm.appointment_date}`
      )
      .then((response) => {
        setAvailableTimes(response.data);
        const selectedTime = response.data.find(
          (timeOption) => timeOption.time === appointmentForm.appointment_time
        );

        if (selectedTime && !selectedTime.available) {
          setPageError("Bu saat dolu, lütfen başka saat seçin.");
        }
      })
      .catch((error) => {
        console.error(error);
        setAvailableTimes([]);
      });
  }, [
    appointmentForm.veterinarian_id,
    appointmentForm.appointment_date,
    appointmentForm.appointment_time,
    pendingAppointment,
  ]);

  if (!user) {
    return null;
  }

  return (
    <div className="customer-dashboard">
      <header className="customer-topbar">
        <div>
          <p className="customer-brand">PatiCare</p>
          <p className="page-kicker">Hoş geldiniz, {user.full_name}</p>
        </div>
        <button className="secondary-button" type="button" onClick={logout}>
          Çıkış Yap
        </button>
      </header>

      <main className="customer-main">
        {pageError && <p className="form-error page-alert">{pageError}</p>}
        {successMessage && <p className="form-success page-alert">{successMessage}</p>}

        <section className="panel-card appointment-picker-card">
          <div className="panel-heading">
            <p className="section-label">Randevu Al</p>
            <h2>Randevu Bilgileri</h2>
          </div>

          <form className="pending-appointment-form" onSubmit={createAppointment}>
            {pendingAppointment ? (
              <div className="selected-appointment-grid appointment-summary-grid">
                {selectedAppointmentDetails.map(([label, value]) => (
                  <p key={label}>
                    <span>{label}</span>
                    {value}
                  </p>
                ))}
              </div>
            ) : (
              <div className="form-grid appointment-select-grid">
                <label>
                  Şehir
                  <select
                    name="city_id"
                    value={appointmentForm.city_id}
                    onChange={handleAppointmentFieldChange}
                    required
                  >
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
                    value={appointmentForm.district}
                    onChange={handleAppointmentFieldChange}
                    disabled={!appointmentForm.city_id}
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
                    value={appointmentForm.veterinarian_id}
                    onChange={handleAppointmentFieldChange}
                    disabled={!appointmentForm.city_id}
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
                  <select
                    name="service_id"
                    value={appointmentForm.service_id}
                    onChange={handleAppointmentFieldChange}
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
                    onChange={handleAppointmentFieldChange}
                    required
                  />
                </label>

                <label>
                  Saat
                  <select
                    name="appointment_time"
                    value={appointmentForm.appointment_time}
                    onChange={handleAppointmentFieldChange}
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
            )}

            <div className="appointment-type-group">
              <label className="type-option">
                <input
                  type="radio"
                  name="appointmentMode"
                  value="existing"
                  checked={appointmentMode === "existing"}
                  onChange={handleModeChange}
                />
                Kayıtlı hayvanımla randevu al
              </label>
              <label className="type-option">
                <input
                  type="radio"
                  name="appointmentMode"
                  value="new"
                  checked={appointmentMode === "new"}
                  onChange={handleModeChange}
                />
                Yeni hayvan için randevu al
              </label>
            </div>

            {appointmentMode === "existing" ? (
              <label>
                Hayvan
                <select
                  value={selectedPetId}
                  onChange={(event) => setSelectedPetId(event.target.value)}
                  required
                >
                  <option value="">Hayvan seçin</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="form-grid compact-form-grid">
                <label>
                  Hayvan adı
                  <input name="name" value={newPet.name} onChange={handleNewPetChange} required />
                </label>
                <label>
                  Tür
                  <select
                    name="species"
                    value={newPet.species}
                    onChange={handleNewPetChange}
                    required
                  >
                    {speciesOptions.map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Cins
                  <select name="breed" value={newPet.breed} onChange={handleNewPetChange} required>
                    {availableBreeds.map((breed) => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Yaş
                  <input
                    type="number"
                    name="age"
                    min="0"
                    value={newPet.age}
                    onChange={handleNewPetChange}
                    required
                  />
                </label>
                <label className="full-width">
                  Cinsiyet
                  <select name="gender" value={newPet.gender} onChange={handleNewPetChange} required>
                    <option value="">Cinsiyet seçin</option>
                    <option value="Dişi">Dişi</option>
                    <option value="Erkek">Erkek</option>
                  </select>
                </label>
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Oluşturuluyor..." : "Randevu Oluştur"}
            </button>
          </form>
        </section>

        <section className="customer-flow">
          <PetList pets={pets} onPetDeleted={refreshCustomerData} />

          <AppointmentList
            appointments={appointments}
            title="Randevularım"
            emptyMessage="Henüz randevu kaydınız yok."
            showCustomer={false}
            grouped
            editable
            autoStatus
            deletablePast
            services={services}
            onAppointmentUpdated={handleAppointmentUpdated}
          />
        </section>
      </main>
    </div>
  );
}

export default CustomerDashboard;
