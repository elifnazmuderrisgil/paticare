from sqlalchemy import Column, Integer, String, ForeignKey, Date, Time, Text
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String)
    password = Column(String)
    phone = Column(String)
    role = Column(String, default="customer")

class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    species = Column(String)
    breed = Column(String)
    age = Column(Integer)
    gender = Column(String)

class Veterinarian(Base):
    __tablename__ = "veterinarians"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    phone = Column(String)
    email = Column(String)
    password = Column(String)
    clinic_id = Column(Integer, ForeignKey("clinics.id"))

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(Integer, primary_key=True, index=True)
    clinic_name = Column(String, nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"))
    district = Column(String)
    address = Column(Text)

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String)

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    pet_id = Column(Integer, ForeignKey("pets.id"))
    veterinarian_id = Column(Integer, ForeignKey("veterinarians.id"))
    service_id = Column(Integer, ForeignKey("services.id"))
    appointment_date = Column(Date)
    appointment_time = Column(Time)
    status = Column(String)
