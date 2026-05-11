from pydantic import BaseModel
from datetime import date, time

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    phone: str
    role: str = "customer"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None = None
    role: str

    class Config:
        from_attributes = True

class PetCreate(BaseModel):
    user_id: int
    name: str
    species: str
    breed: str
    age: int
    gender: str

class PetResponse(PetCreate):
    id: int

    class Config:
        from_attributes = True

class ServiceResponse(BaseModel):
    id: int
    service_name: str

    class Config:
        from_attributes = True

class CityResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ClinicResponse(BaseModel):
    id: int
    clinic_name: str
    city_id: int | None = None
    city_name: str | None = None
    district: str | None = None
    address: str | None = None

    class Config:
        from_attributes = True

class VeterinarianResponse(BaseModel):
    id: int
    full_name: str
    email: str | None = None
    phone: str | None = None
    clinic_id: int | None = None
    clinic_name: str | None = None
    city_id: int | None = None
    city_name: str | None = None
    district: str | None = None
    address: str | None = None

    class Config:
        from_attributes = True

class VeterinarianCreate(BaseModel):
    owner_veterinarian_id: int
    full_name: str
    email: str
    password: str
    phone: str

class VeterinarianCreateResponse(VeterinarianResponse):
    user_id: int

class AppointmentCreate(BaseModel):
    user_id: int
    pet_id: int
    veterinarian_id: int
    service_id: int
    appointment_date: date
    appointment_time: time
    status: str

class AppointmentResponse(AppointmentCreate):
    id: int

    class Config:
        from_attributes = True

class AppointmentStatsResponse(BaseModel):
    total: int
    pending: int
    completed: int
    cancelled: int

class AppointmentDetailResponse(BaseModel):
    id: int
    user_id: int | None = None
    pet_id: int | None = None
    veterinarian_id: int | None = None
    service_id: int | None = None
    pet_name: str | None = None
    pet_species: str | None = None
    service_name: str | None = None
    veterinarian_name: str | None = None
    clinic_id: int | None = None
    clinic_name: str | None = None
    veterinarian_city_id: int | None = None
    city_name: str | None = None
    district: str | None = None
    veterinarian_district: str | None = None
    veterinarian_address: str | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    appointment_date: date
    appointment_time: time
    status: str

class AppointmentStatusUpdate(BaseModel):
    status: str

class AppointmentUpdate(BaseModel):
    veterinarian_id: int | None = None
    service_id: int | None = None
    appointment_date: date | None = None
    appointment_time: time | None = None
    status: str | None = None

class ClinicRegisterCreate(BaseModel):
    full_name: str
    email: str
    password: str
    phone: str
    clinic_name: str
    city_id: int | None = None
    city_name: str | None = None
    district: str
    address: str

class ClinicRegisterResponse(BaseModel):
    user_id: int
    veterinarian_id: int
    clinic_id: int
    full_name: str
    email: str
    clinic_name: str
    city_id: int | None = None
    city_name: str | None = None
    district: str
    address: str

class VeterinarianAppointmentResponse(AppointmentDetailResponse):
    pass
