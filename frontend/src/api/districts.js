import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export function useDistrictOptions(cityId) {
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    if (!cityId) {
      setDistricts([]);
      return;
    }

    axios
      .get(`${API_BASE_URL}/veterinarians/districts?city_id=${cityId}`)
      .then((response) => setDistricts(response.data))
      .catch((error) => {
        console.error(error);
        setDistricts([]);
      });
  }, [cityId]);

  return districts;
}
