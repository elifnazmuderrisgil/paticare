from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date, datetime, time
from database import engine, get_db
import models
import schemas

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def appointment_detail_rows(query):
    rows = query.all()

    return [
        {
            "id": appointment.id,
            "user_id": appointment.user_id,
            "pet_id": appointment.pet_id,
            "veterinarian_id": appointment.veterinarian_id,
            "service_id": appointment.service_id,
            "pet_name": pet.name if pet else None,
            "pet_species": pet.species if pet else None,
            "service_name": service.service_name if service else None,
            "veterinarian_name": veterinarian.full_name if veterinarian else None,
            "clinic_name": veterinarian.clinic_name if veterinarian else None,
            "veterinarian_city": veterinarian.city if veterinarian else None,
            "veterinarian_district": veterinarian.district if veterinarian else None,
            "veterinarian_address": veterinarian.address if veterinarian else None,
            "customer_name": user.full_name if user else None,
            "customer_phone": user.phone if user else None,
            "appointment_date": appointment.appointment_date,
            "appointment_time": appointment.appointment_time,
            "status": appointment.status,
        }
        for appointment, pet, service, veterinarian, user in rows
    ]

def appointment_detail_query(db: Session):
    return (
        db.query(
            models.Appointment,
            models.Pet,
            models.Service,
            models.Veterinarian,
            models.User,
        )
        .outerjoin(models.Pet, models.Appointment.pet_id == models.Pet.id)
        .outerjoin(models.Service, models.Appointment.service_id == models.Service.id)
        .outerjoin(
            models.Veterinarian,
            models.Appointment.veterinarian_id == models.Veterinarian.id,
        )
        .outerjoin(models.User, models.Appointment.user_id == models.User.id)
    )

def is_past_appointment_datetime(appointment_date: date, appointment_time: time):
    appointment_datetime = datetime.combine(appointment_date, appointment_time)
    return appointment_datetime < datetime.now()

def vaccination_detail_rows(query):
    rows = query.all()

    return [
        {
            "id": vaccination.id,
            "pet_id": vaccination.pet_id,
            "pet_name": pet.name if pet else None,
            "vaccine_name": vaccination.vaccine_name,
            "vaccination_date": vaccination.vaccination_date,
            "next_due_date": vaccination.next_due_date,
            "notes": vaccination.notes,
        }
        for vaccination, pet in rows
    ]

def vaccination_detail_query(db: Session):
    return (
        db.query(models.Vaccination, models.Pet)
        .join(models.Pet, models.Vaccination.pet_id == models.Pet.id)
    )

@app.get("/")
def home():
    return {"message": "PatiCare API çalışıyor"}

@app.get("/test-db")
def test_db():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 'Supabase bağlantısı başarılı'")
        )
        return {"message": result.scalar()}

@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    email = user.email.strip().lower()
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı.")

    user_data = user.model_dump()
    user_data["email"] = email

    new_user = models.User(**user_data)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    email = user.email.strip().lower()
    password = user.password.strip()

    db_user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Bu email ile kullanıcı bulunamadı")

    if db_user.password != password:
        raise HTTPException(status_code=401, detail="Şifre hatalı")

    return {
        "id": db_user.id,
        "full_name": db_user.full_name,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role or "customer"
    }

@app.post("/clinics/register", response_model=schemas.ClinicRegisterResponse)
def register_clinic(
    clinic: schemas.ClinicRegisterCreate,
    db: Session = Depends(get_db),
):
    email = clinic.email.strip().lower()

    existing_user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )
    existing_veterinarian = (
        db.query(models.Veterinarian)
        .filter(models.Veterinarian.email == email)
        .first()
    )

    if existing_user or existing_veterinarian:
        raise HTTPException(status_code=400, detail="Bu email ile kayıt zaten var.")

    new_user = models.User(
        full_name=clinic.full_name,
        email=email,
        password=clinic.password,
        phone=clinic.phone,
        role="veterinarian",
    )
    db.add(new_user)
    db.flush()

    new_veterinarian = models.Veterinarian(
        full_name=clinic.full_name,
        email=email,
        phone=clinic.phone,
        clinic_name=clinic.clinic_name,
        city=clinic.city,
        district=clinic.district,
        address=clinic.address,
    )
    db.add(new_veterinarian)
    db.commit()
    db.refresh(new_user)
    db.refresh(new_veterinarian)

    return {
        "user_id": new_user.id,
        "veterinarian_id": new_veterinarian.id,
        "full_name": new_veterinarian.full_name,
        "email": new_veterinarian.email,
        "clinic_name": new_veterinarian.clinic_name,
        "city": new_veterinarian.city,
        "district": new_veterinarian.district,
        "address": new_veterinarian.address,
    }

@app.get("/debug/users")
def debug_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "password": user.password,
            "phone": user.phone,
            "role": user.role
        }
        for user in users
    ]

@app.get("/pets", response_model=list[schemas.PetResponse])
def get_pets(db: Session = Depends(get_db)):
    return db.query(models.Pet).all()

@app.get("/users/{user_id}/pets", response_model=list[schemas.PetResponse])
def get_user_pets(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Pet).filter(models.Pet.user_id == user_id).all()

@app.post("/pets", response_model=schemas.PetResponse)
def create_pet(pet: schemas.PetCreate, db: Session = Depends(get_db)):
    new_pet = models.Pet(**pet.model_dump())
    db.add(new_pet)
    db.commit()
    db.refresh(new_pet)
    return new_pet

@app.delete("/pets/{pet_id}")
def delete_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()

    if not pet:
        raise HTTPException(status_code=404, detail="Hayvan bulunamadı.")

    db.query(models.Appointment).filter(models.Appointment.pet_id == pet_id).delete(
        synchronize_session=False
    )
    db.delete(pet)
    db.commit()

    return {"message": "Hayvan başarıyla silindi."}

@app.get(
    "/pets/{pet_id}/vaccinations",
    response_model=list[schemas.VaccinationResponse],
)
def get_pet_vaccinations(pet_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Vaccination)
        .filter(models.Vaccination.pet_id == pet_id)
        .order_by(models.Vaccination.next_due_date.asc())
        .all()
    )

@app.post("/vaccinations", response_model=schemas.VaccinationResponse)
def create_vaccination(
    vaccination: schemas.VaccinationCreate,
    db: Session = Depends(get_db),
):
    pet = db.query(models.Pet).filter(models.Pet.id == vaccination.pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Hayvan bulunamadı.")

    new_vaccination = models.Vaccination(**vaccination.model_dump())
    db.add(new_vaccination)
    db.commit()
    db.refresh(new_vaccination)
    return new_vaccination

@app.get(
    "/users/{user_id}/vaccinations",
    response_model=list[schemas.VaccinationDetailResponse],
)
def get_user_vaccinations(user_id: int, db: Session = Depends(get_db)):
    query = (
        vaccination_detail_query(db)
        .filter(models.Pet.user_id == user_id)
        .order_by(models.Vaccination.next_due_date.asc())
    )
    return vaccination_detail_rows(query)

@app.get("/services", response_model=list[schemas.ServiceResponse])
def get_services(db: Session = Depends(get_db)):
    return db.query(models.Service).all()

@app.get("/veterinarians", response_model=list[schemas.VeterinarianResponse])
def get_veterinarians(db: Session = Depends(get_db)):
    return db.query(models.Veterinarian).all()

@app.get("/veterinarians/by-email/{email}", response_model=schemas.VeterinarianResponse)
def get_veterinarian_by_email(email: str, db: Session = Depends(get_db)):
    veterinarian = (
        db.query(models.Veterinarian)
        .filter(models.Veterinarian.email == email.strip().lower())
        .first()
    )

    if not veterinarian:
        raise HTTPException(status_code=404, detail="Veteriner kaydı bulunamadı.")

    return veterinarian

@app.get("/veterinarians/search", response_model=list[schemas.VeterinarianResponse])
def search_veterinarians(
    city: str | None = None,
    district: str | None = None,
    service_id: int | None = None,
    appointment_date: date | None = None,
    appointment_time: time | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Veterinarian)

    if city:
        query = query.filter(models.Veterinarian.city == city)

    if district:
        query = query.filter(models.Veterinarian.district == district)

    if appointment_date and appointment_time:
        booked_veterinarian_ids = (
            db.query(models.Appointment.veterinarian_id)
            .filter(
                models.Appointment.appointment_date == appointment_date,
                models.Appointment.appointment_time == appointment_time,
            )
            .subquery()
        )
        query = query.filter(~models.Veterinarian.id.in_(booked_veterinarian_ids))

    return query.order_by(models.Veterinarian.city, models.Veterinarian.district).all()

@app.get("/appointments", response_model=list[schemas.AppointmentDetailResponse])
def get_appointments(db: Session = Depends(get_db)):
    query = appointment_detail_query(db).order_by(
        models.Appointment.appointment_date.asc(),
        models.Appointment.appointment_time.asc(),
    )
    return appointment_detail_rows(query)

@app.post("/appointments", response_model=schemas.AppointmentResponse)
def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db)
):
    if is_past_appointment_datetime(
        appointment.appointment_date,
        appointment.appointment_time,
    ):
        raise HTTPException(
            status_code=400,
            detail="Geçmiş tarihe randevu oluşturulamaz.",
        )

    pet = (
        db.query(models.Pet)
        .filter(
            models.Pet.id == appointment.pet_id,
            models.Pet.user_id == appointment.user_id,
        )
        .first()
    )
    if not pet:
        raise HTTPException(
            status_code=400,
            detail="Seçilen hayvan bu kullanıcıya ait değil.",
        )

    veterinarian = (
        db.query(models.Veterinarian)
        .filter(models.Veterinarian.id == appointment.veterinarian_id)
        .first()
    )
    if not veterinarian:
        raise HTTPException(status_code=404, detail="Veteriner bulunamadı.")

    service = (
        db.query(models.Service)
        .filter(models.Service.id == appointment.service_id)
        .first()
    )
    if not service:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı.")

    existing_appointment = (
        db.query(models.Appointment)
        .filter(
            models.Appointment.veterinarian_id == appointment.veterinarian_id,
            models.Appointment.appointment_date == appointment.appointment_date,
            models.Appointment.appointment_time == appointment.appointment_time,
        )
        .first()
    )
    if existing_appointment:
        raise HTTPException(
            status_code=400,
            detail="Bu saat için seçilen klinikte uygunluk yok.",
        )

    new_appointment = models.Appointment(
        **appointment.model_dump()
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return new_appointment

@app.get(
    "/users/{user_id}/appointments",
    response_model=list[schemas.AppointmentDetailResponse],
)
def get_user_appointments(user_id: int, db: Session = Depends(get_db)):
    query = (
        appointment_detail_query(db)
        .filter(models.Appointment.user_id == user_id)
        .order_by(
            models.Appointment.appointment_date.asc(),
            models.Appointment.appointment_time.asc(),
        )
    )
    return appointment_detail_rows(query)

@app.get(
    "/veterinarians/{veterinarian_id}/appointments",
    response_model=list[schemas.VeterinarianAppointmentResponse],
)
def get_veterinarian_appointments(veterinarian_id: int, db: Session = Depends(get_db)):
    query = (
        appointment_detail_query(db)
        .filter(models.Appointment.veterinarian_id == veterinarian_id)
        .order_by(
            models.Appointment.appointment_date.asc(),
            models.Appointment.appointment_time.asc(),
        )
    )
    return appointment_detail_rows(query)

@app.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = (
        db.query(models.Appointment)
        .filter(models.Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı.")

    db.delete(appointment)
    db.commit()

    return {"message": "Randevu silindi."}

@app.put("/appointments/{appointment_id}/status", response_model=schemas.AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    status_update: schemas.AppointmentStatusUpdate,
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(models.Appointment)
        .filter(models.Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı.")

    appointment.status = status_update.status
    db.commit()
    db.refresh(appointment)

    return appointment

@app.patch("/appointments/{appointment_id}", response_model=schemas.AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment_update: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(models.Appointment)
        .filter(models.Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı.")

    update_data = appointment_update.model_dump(exclude_unset=True)

    next_date = update_data.get("appointment_date", appointment.appointment_date)
    next_time = update_data.get("appointment_time", appointment.appointment_time)
    next_veterinarian_id = update_data.get(
        "veterinarian_id",
        appointment.veterinarian_id,
    )

    changes_schedule = any(
        field in update_data
        for field in ("appointment_date", "appointment_time", "veterinarian_id")
    )

    if changes_schedule and is_past_appointment_datetime(next_date, next_time):
        raise HTTPException(
            status_code=400,
            detail="Geçmiş tarihe randevu güncellenemez.",
        )

    if "veterinarian_id" in update_data:
        veterinarian = (
            db.query(models.Veterinarian)
            .filter(models.Veterinarian.id == next_veterinarian_id)
            .first()
        )
        if not veterinarian:
            raise HTTPException(status_code=404, detail="Veteriner bulunamadı.")

    if "service_id" in update_data:
        service = (
            db.query(models.Service)
            .filter(models.Service.id == update_data["service_id"])
            .first()
        )
        if not service:
            raise HTTPException(status_code=404, detail="Hizmet bulunamadı.")

    existing_appointment = (
        db.query(models.Appointment)
        .filter(
            models.Appointment.id != appointment_id,
            models.Appointment.veterinarian_id == next_veterinarian_id,
            models.Appointment.appointment_date == next_date,
            models.Appointment.appointment_time == next_time,
        )
        .first()
    )
    if existing_appointment:
        raise HTTPException(
            status_code=400,
            detail="Bu saat için seçilen klinikte uygunluk yok.",
        )

    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)

    return appointment
