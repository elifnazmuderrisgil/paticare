import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

function PetList({ pets, onBookAppointment, onPetDeleted }) {
  const handleDelete = (pet) => {
    const isConfirmed = window.confirm("Bu hayvanı silmek istediğine emin misin?");

    if (!isConfirmed) {
      return;
    }

    axios
      .delete(`${API_BASE_URL}/pets/${pet.id}`)
      .then(() => {
        onPetDeleted?.();
      })
      .catch((error) => {
        console.error(error);
        alert("Hayvan silinirken bir hata oluştu.");
      });
  };

  return (
    <section className="panel-card" id="pets">
      <div className="panel-heading">
        <p className="section-label">Kayıtlı Dostlar</p>
        <h2>Hayvanlarım</h2>
      </div>

      {pets.length === 0 && <p className="empty-state">Henüz hayvan kaydı yok.</p>}

      <div className="pet-card-grid">
        {pets.map((pet) => (
          <article className="record-card pet-card" key={pet.id}>
            <div className="record-topline">
              <h3>{pet.name}</h3>
            </div>
            <div className="record-grid pet-info-grid">
              <p>Tür: {pet.species}</p>
              <p>Cins: {pet.breed}</p>
              <p>Yaş: {pet.age}</p>
              <p>Cinsiyet: {pet.gender}</p>
            </div>
            <div className="record-actions split-actions">
              {onBookAppointment && (
                <button
                  className="compact-button"
                  type="button"
                  onClick={() => onBookAppointment(pet)}
                >
                  Randevu Al
                </button>
              )}
              <button
                className="danger-button"
                type="button"
                onClick={() => handleDelete(pet)}
              >
                Sil
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PetList;
