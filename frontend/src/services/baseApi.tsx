import axios from 'axios';

export const apiBase = axios.create({
  baseURL:
    typeof window === "undefined"
      ? "http://backend:3000" // Server-side (Docker internal)
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080", // Client-side (Browser)
});
