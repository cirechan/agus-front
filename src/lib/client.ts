// src/lib/api/client.ts
import axios from "axios"

export const apiClient = axios.create({
  baseURL: "https://agus-back.onrender.com/api", // esto ya lo tienes bien
  headers: {
    "Content-Type": "application/json",
  },
})
