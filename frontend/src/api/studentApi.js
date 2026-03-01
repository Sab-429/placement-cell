import api from "./axios";

export const getStudentProfile = (id) =>
  api.get(`/students/${id}`);

export const updateStudentProfile = (id, data) =>
  api.put(`/students/${id}`, data);

export const getStudentApplications = (id) =>
  api.get(`/applications?student_id=${id}`);