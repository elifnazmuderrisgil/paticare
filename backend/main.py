from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import date, datetime, time
from database import engine, get_db
from email_service import email_service
import models
import schemas

app = FastAPI()

ACTIVE_APPOINTMENT_STATUSES = ("Bekliyor", "Onaylandı")
APPOINTMENT_STATUS_TRANSITIONS = {
    "Bekliyor": {"Bekliyor", "Onaylandı", "Tamamlandı", "İptal"},
    "Onaylandı": {"Onaylandı", "Tamamlandı", "İptal"},
    "Tamamlandı": {"Tamamlandı"},
    "İptal": {"İptal"},
}
APPOINTMENT_TIME_OPTIONS = [
    time(hour, minute)
    for hour in range(8, 18)
    for minute in (0, 30)
    if not (hour == 17 and minute == 30)
]

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

def get_city_name(veterinarian, city):
    if city:
        return city.name
    if veterinarian:
        return veterinarian.city
    return None

def veterinarian_response(veterinarian, city=None):
    city_name = get_city_name(veterinarian, city)

    return {
        "id": veterinarian.id,
        "full_name": veterinarian.full_name,
        "email": veterinarian.email,
        "phone": veterinarian.phone,
        "clinic_name": veterinarian.clinic_name,
        "city_id": veterinarian.city_id,
        "city_name": city_name,
        "city": city_name,
        "district": veterinarian.district,
        "address": veterinarian.address,
    }

def format_email_date(value):
    return value.strftime("%d.%m.%Y") if value else "-"

def format_email_time(value):
    return value.strftime("%H:%M") if value else "-"

def get_clinic_address(veterinarian, city=None):
    address_parts = [
        veterinarian.address,
        veterinarian.district,
        get_city_name(veterinarian, city),
    ]
    return ", ".join(part for part in address_parts if part) or "-"

def get_appointment_email_context(db: Session, appointment_id: int):
    return (
        db.query(
            models.Appointment,
            models.Pet,
            models.Service,
            models.Veterinarian,
            models.User,
            models.City,
        )
        .outerjoin(models.Pet, models.Appointment.pet_id == models.Pet.id)
        .outerjoin(models.Service, models.Appointment.service_id == models.Service.id)
        .outerjoin(
            models.Veterinarian,
            models.Appointment.veterinarian_id == models.Veterinarian.id,
        )
        .outerjoin(models.User, models.Appointment.user_id == models.User.id)
        .outerjoin(models.City, models.Veterinarian.city_id == models.City.id)
        .filter(models.Appointment.id == appointment_id)
        .first()
    )

def send_new_appointment_notification(db: Session, appointment_id: int):
    context = get_appointment_email_context(db, appointment_id)
    if not context:
        return

    appointment, pet, service, veterinarian, user, _ = context
    if not veterinarian or not veterinarian.email or not user or not pet:
        return

    email_service.veterinarian_appointment_notification_email(
        veterinarian_name=veterinarian.full_name or "Veteriner",
        veterinarian_email=veterinarian.email,
        customer_name=user.full_name or "-",
        customer_phone=user.phone or "-",
        pet_name=pet.name or "-",
        pet_species=pet.species or "-",
        appointment_date=format_email_date(appointment.appointment_date),
        appointment_time=format_email_time(appointment.appointment_time),
        service_name=service.service_name if service else "-",
    )

def send_appointment_status_email(db: Session, appointment_id: int, status: str):
    context = get_appointment_email_context(db, appointment_id)
    if not context:
        return

    appointment, pet, service, veterinarian, user, city = context
    if not user or not user.email or not veterinarian:
        return

    if status == "Onaylandı":
        email_service.appointment_confirmation_email(
            customer_name=user.full_name or "PatiCare kullanıcısı",
            customer_email=user.email,
            veterinarian_name=veterinarian.full_name or "-",
            clinic_name=veterinarian.clinic_name or "-",
            appointment_date=format_email_date(appointment.appointment_date),
            appointment_time=format_email_time(appointment.appointment_time),
            pet_name=pet.name if pet else "-",
            service_name=service.service_name if service else "-",
            clinic_address=get_clinic_address(veterinarian, city),
        )
    elif status == "İptal":
        email_service.appointment_cancelled_email(
            customer_name=user.full_name or "PatiCare kullanıcısı",
            customer_email=user.email,
            veterinarian_name=veterinarian.full_name or "-",
            clinic_name=veterinarian.clinic_name or "-",
            appointment_date=format_email_date(appointment.appointment_date),
            appointment_time=format_email_time(appointment.appointment_time),
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
            "veterinarian_city_id": veterinarian.city_id if veterinarian else None,
            "city_name": get_city_name(veterinarian, city),
            "district": veterinarian.district if veterinarian else None,
            "veterinarian_city": get_city_name(veterinarian, city),
            "veterinarian_district": veterinarian.district if veterinarian else None,
            "veterinarian_address": veterinarian.address if veterinarian else None,
            "customer_name": user.full_name if user else None,
            "customer_phone": user.phone if user else None,
            "appointment_date": appointment.appointment_date,
            "appointment_time": appointment.appointment_time,
            "status": appointment.status,
        }
        for appointment, pet, service, veterinarian, user, city in rows
    ]

def appointment_detail_query(db: Session):
    return (
        db.query(
            models.Appointment,
            models.Pet,
            models.Service,
            models.Veterinarian,
            models.User,
            models.City,
        )
        .outerjoin(models.Pet, models.Appointment.pet_id == models.Pet.id)
        .outerjoin(models.Service, models.Appointment.service_id == models.Service.id)
        .outerjoin(
            models.Veterinarian,
            models.Appointment.veterinarian_id == models.Veterinarian.id,
        )
        .outerjoin(models.User, models.Appointment.user_id == models.User.id)
        .outerjoin(models.City, models.Veterinarian.city_id == models.City.id)
    )

def is_past_appointment_datetime(appointment_date: date, appointment_time: time):
    appointment_datetime = datetime.combine(appointment_date, appointment_time)
    return appointment_datetime < datetime.now()

def find_active_appointment_at_time(
    db: Session,
    veterinarian_id: int,
    appointment_date: date,
    appointment_time: time,
    excluded_appointment_id: int | None = None,
):
    query = db.query(models.Appointment).filter(
        models.Appointment.veterinarian_id == veterinarian_id,
        models.Appointment.appointment_date == appointment_date,
        models.Appointment.appointment_time == appointment_time,
        models.Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
    )

    if excluded_appointment_id is not None:
        query = query.filter(models.Appointment.id != excluded_appointment_id)

    return query.first()

def active_appointment_query(db: Session, veterinarian_id: int):
    return db.query(models.Appointment).filter(
        models.Appointment.veterinarian_id == veterinarian_id,
        models.Appointment.appointment_date >= date.today(),
        models.Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
    )

def validate_appointment_status_transition(current_status: str, next_status: str):
    if current_status == next_status:
        return

    allowed_statuses = APPOINTMENT_STATUS_TRANSITIONS.get(
        current_status,
        {current_status},
    )

    if next_status in allowed_statuses:
        return

    if current_status == "Onaylandı" and next_status == "Bekliyor":
        detail = "Onaylanan randevu tekrar bekliyor durumuna alınamaz."
    elif current_status in ("Tamamlandı", "İptal"):
        detail = "Tamamlanan veya iptal edilen randevunun durumu değiştirilemez."
    else:
        detail = "Geçersiz randevu durum geçişi."

    raise HTTPException(status_code=400, detail=detail)

def resolve_city(clinic: schemas.ClinicRegisterCreate, db: Session):
    city = None

    if clinic.city_id:
        city = db.query(models.City).filter(models.City.id == clinic.city_id).first()
    elif clinic.city:
        city = (
            db.query(models.City)
            .filter(models.City.name == clinic.city.strip())
            .first()
        )

    if not city:
        raise HTTPException(status_code=400, detail="Geçerli bir şehir seçin.")

    return city

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
    user_data["role"] = "customer"

    new_user = models.User(**user_data)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    email = user.email.strip().lower()
    password = user.password.strip()

    db_user = (
        db.query(models.User)
        .filter(
            models.User.email == email,
            models.User.password == password,
        )
        .first()
    )

    if db_user:
        if db_user.role == "veterinarian":
            veterinarian = (
                db.query(models.Veterinarian)
                .filter(models.Veterinarian.email == email)
                .first()
            )

            if veterinarian:
                return {
                    "id": veterinarian.id,
                    "full_name": veterinarian.full_name,
                    "email": veterinarian.email,
                    "role": "veterinarian",
                    "clinic_name": veterinarian.clinic_name,
                }

        return {
            "id": db_user.id,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "phone": db_user.phone,
            "role": db_user.role or "customer"
        }

    veterinarian = (
        db.query(models.Veterinarian)
        .filter(
            models.Veterinarian.email == email,
            models.Veterinarian.password == password,
        )
        .first()
    )

    if veterinarian:
        return {
            "id": veterinarian.id,
            "full_name": veterinarian.full_name,
            "email": veterinarian.email,
            "role": "veterinarian",
            "clinic_name": veterinarian.clinic_name,
        }

    raise HTTPException(status_code=401, detail="Email veya şifre hatalı")

@app.post("/clinics/register", response_model=schemas.ClinicRegisterResponse)
def register_clinic(
    clinic: schemas.ClinicRegisterCreate,
    db: Session = Depends(get_db),
):
    email = clinic.email.strip().lower()
    city = resolve_city(clinic, db)

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
        password=clinic.password,
        phone=clinic.phone,
        clinic_name=clinic.clinic_name,
        city_id=city.id,
        city=city.name,
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
        "city_id": new_veterinarian.city_id,
        "city_name": city.name,
        "city": city.name,
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

@app.get("/users/customers", response_model=list[schemas.UserResponse])
def get_customers(db: Session = Depends(get_db)):
    return (
        db.query(models.User)
        .filter(models.User.role == "customer")
        .order_by(models.User.full_name.asc())
        .all()
    )

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

@app.get("/services", response_model=list[schemas.ServiceResponse])
def get_services(db: Session = Depends(get_db)):
    services = db.query(models.Service).order_by(models.Service.id.asc()).all()
    seen_names = set()
    unique_services = []

    for service in services:
        name_key = (service.service_name or "").strip().casefold()
        if name_key in seen_names:
            continue

        seen_names.add(name_key)
        unique_services.append(service)

    return unique_services

@app.get("/cities", response_model=list[schemas.CityResponse])
def get_cities(db: Session = Depends(get_db)):
    return db.query(models.City).order_by(models.City.name.asc()).all()

@app.get("/veterinarians", response_model=list[schemas.VeterinarianResponse])
def get_veterinarians(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Veterinarian, models.City)
        .outerjoin(models.City, models.Veterinarian.city_id == models.City.id)
        .order_by(
            models.City.name.asc(),
            models.Veterinarian.city.asc(),
            models.Veterinarian.district.asc(),
        )
        .all()
    )
    return [veterinarian_response(veterinarian, city) for veterinarian, city in rows]

@app.get("/veterinarians/districts")
def get_veterinarian_districts(
    city_id: int | None = None,
    city: str | None = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Veterinarian.district)
        .outerjoin(models.City, models.Veterinarian.city_id == models.City.id)
        .filter(models.Veterinarian.district.isnot(None))
    )

    if city_id:
        query = query.filter(models.Veterinarian.city_id == city_id)
    elif city:
        city_value = city.strip()
        query = query.filter(
            (func.lower(models.City.name) == city_value.lower())
            | (func.lower(models.Veterinarian.city) == city_value.lower())
        )

    districts = {
        district.strip()
        for (district,) in query.all()
        if district and district.strip()
    }

    return sorted(districts, key=lambda value: value.casefold())

@app.get("/veterinarians/by-email/{email}", response_model=schemas.VeterinarianResponse)
def get_veterinarian_by_email(email: str, db: Session = Depends(get_db)):
    row = (
        db.query(models.Veterinarian, models.City)
        .outerjoin(models.City, models.Veterinarian.city_id == models.City.id)
        .filter(models.Veterinarian.email == email.strip().lower())
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Veteriner kaydı bulunamadı.")

    veterinarian, city = row
    return veterinarian_response(veterinarian, city)

@app.get("/veterinarians/{veterinarian_id}/customers", response_model=list[schemas.UserResponse])
def get_veterinarian_customers(veterinarian_id: int, db: Session = Depends(get_db)):
    customer_ids = (
        db.query(models.Appointment.user_id)
        .filter(models.Appointment.veterinarian_id == veterinarian_id)
        .distinct()
        .subquery()
    )

    return (
        db.query(models.User)
        .join(customer_ids, customer_ids.c.user_id == models.User.id)
        .filter(models.User.role == "customer")
        .order_by(models.User.full_name.asc())
        .all()
    )

@app.get("/veterinarians/search", response_model=list[schemas.VeterinarianResponse])
def search_veterinarians(
    city_id: int | None = None,
    city: str | None = None,
    district: str | None = None,
    service_id: int | None = None,
    appointment_date: date | None = None,
    appointment_time: time | None = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Veterinarian, models.City)
        .outerjoin(models.City, models.Veterinarian.city_id == models.City.id)
    )

    if city_id:
        query = query.filter(models.Veterinarian.city_id == city_id)
    elif city:
        city_value = city.strip()
        query = query.filter(
            (func.lower(models.City.name) == city_value.lower())
            | (func.lower(models.Veterinarian.city) == city_value.lower())
        )

    if district:
        query = query.filter(
            func.lower(models.Veterinarian.district) == district.strip().lower()
        )

    if service_id:
        service_exists = (
            db.query(models.Service.id)
            .filter(models.Service.id == service_id)
            .first()
        )
        if not service_exists:
            raise HTTPException(status_code=404, detail="Hizmet bulunamadı.")

    if appointment_date and appointment_time:
        booked_veterinarian_ids = (
            db.query(models.Appointment.veterinarian_id)
            .filter(
                models.Appointment.appointment_date == appointment_date,
                models.Appointment.appointment_time == appointment_time,
                models.Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            )
            .subquery()
        )
        query = query.filter(~models.Veterinarian.id.in_(booked_veterinarian_ids))

    rows = (
        query.order_by(
            models.City.name.asc(),
            models.Veterinarian.city.asc(),
            models.Veterinarian.district.asc(),
        )
        .all()
    )
    return [veterinarian_response(veterinarian, city) for veterinarian, city in rows]

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

    existing_appointment = find_active_appointment_at_time(
        db,
        appointment.veterinarian_id,
        appointment.appointment_date,
        appointment.appointment_time,
    )
    if existing_appointment:
        raise HTTPException(
            status_code=400,
            detail="Bu saat için seçilen klinikte randevu dolu.",
        )

    new_appointment = models.Appointment(
        **appointment.model_dump()
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    send_new_appointment_notification(db, new_appointment.id)

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

@app.get(
    "/veterinarians/{veterinarian_id}/appointment-stats",
    response_model=schemas.AppointmentStatsResponse,
)
def get_veterinarian_appointment_stats(
    veterinarian_id: int,
    db: Session = Depends(get_db),
):
    active_query = active_appointment_query(db, veterinarian_id)

    return {
        "total": active_query.count(),
        "pending": active_query.filter(models.Appointment.status == "Bekliyor").count(),
        "completed": (
            db.query(models.Appointment)
            .filter(
                models.Appointment.veterinarian_id == veterinarian_id,
                models.Appointment.status == "Tamamlandı",
            )
            .count()
        ),
        "cancelled": (
            db.query(models.Appointment)
            .filter(
                models.Appointment.veterinarian_id == veterinarian_id,
                models.Appointment.status == "İptal",
            )
            .count()
        ),
    }

@app.get("/veterinarians/{veterinarian_id}/available-times")
def get_veterinarian_available_times(
    veterinarian_id: int,
    date: date,
    db: Session = Depends(get_db),
):
    veterinarian = (
        db.query(models.Veterinarian)
        .filter(models.Veterinarian.id == veterinarian_id)
        .first()
    )
    if not veterinarian:
        raise HTTPException(status_code=404, detail="Veteriner bulunamadı.")

    booked_times = {
        appointment_time.strftime("%H:%M")
        for (appointment_time,) in (
            db.query(models.Appointment.appointment_time)
            .filter(
                models.Appointment.veterinarian_id == veterinarian_id,
                models.Appointment.appointment_date == date,
                models.Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            )
            .all()
        )
    }

    return [
        {
            "time": appointment_time.strftime("%H:%M"),
            "available": appointment_time.strftime("%H:%M") not in booked_times,
        }
        for appointment_time in APPOINTMENT_TIME_OPTIONS
    ]

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

    validate_appointment_status_transition(appointment.status, status_update.status)

    previous_status = appointment.status
    appointment.status = status_update.status
    db.commit()
    db.refresh(appointment)

    if previous_status != appointment.status:
        send_appointment_status_email(db, appointment.id, appointment.status)

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

    next_status = update_data.get("status", appointment.status)
    if "status" in update_data:
        validate_appointment_status_transition(appointment.status, next_status)

    should_check_availability = changes_schedule or (
        "status" in update_data and next_status in ACTIVE_APPOINTMENT_STATUSES
    )

    if should_check_availability and next_status in ACTIVE_APPOINTMENT_STATUSES:
        existing_appointment = find_active_appointment_at_time(
            db,
            next_veterinarian_id,
            next_date,
            next_time,
            excluded_appointment_id=appointment_id,
        )
        if existing_appointment:
            raise HTTPException(
                status_code=400,
                detail="Bu saat için seçilen klinikte randevu dolu.",
            )

    previous_status = appointment.status

    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)

    if "status" in update_data and previous_status != appointment.status:
        send_appointment_status_email(db, appointment.id, appointment.status)

    return appointment
