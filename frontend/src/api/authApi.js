import api from "./axios"
export const loginUser = (data) =>
    api.post("/login",data);

export const registerStudent = (data) =>
    api.post("/students",data);