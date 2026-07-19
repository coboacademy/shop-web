export interface CountryItem {
  id: number;
  country_code: string;
  country_name: string;
  capital: string;
  currency: string;
  language: string;
  created_at?: string;
  updated_at?: string;
}

export interface CountryPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CountryStats {
  total_countries: number;
}

export interface CountryFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface CountryPayload {
  country_code: string;
  country_name: string;
  capital: string;
  currency: string;
  language: string;
}

export interface CountryListResponse {
  status: string;
  message: string;
  data: {
    countries: CountryItem[];
    pagination: CountryPagination;
    stats?: CountryStats;
  };
}

export const useCountry = () => {
  const api = useApi();

  const getCountries = async (filters: CountryFilters = {}) => {
    const response = await api.get("/countries", {
      params: filters,
    });

    return response.data as CountryListResponse;
  };

  const createCountry = async (payload: CountryPayload) => {
    const response = await api.post("/countries", payload);

    return response.data;
  };

  const updateCountry = async (id: number, payload: CountryPayload) => {
    const response = await api.put(`/countries/${id}`, payload);

    return response.data;
  };

  const deleteCountry = async (id: number) => {
    const response = await api.delete(`/countries/${id}`);

    return response.data;
  };

  return {
    getCountries,
    createCountry,
    updateCountry,
    deleteCountry,
  };
};