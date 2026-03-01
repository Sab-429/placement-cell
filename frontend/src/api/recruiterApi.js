import api from "./axios";

export const createListing = (data) =>
  api.post("/listings", data);

export const getRecruiterApplications = (listingId) =>
  api.get(`/applications/listing/${listingId}`);