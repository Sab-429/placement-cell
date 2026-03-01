import api from "./axios";

export const getListings = (params) =>
  api.get("/listings", { params });

export const applyToListing = (id) =>
  api.post(`/listing/${id}/apply`);