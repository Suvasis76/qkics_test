import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "../redux/tokenManager";

export default function checkAuth() {
  const token = getAccessToken();  // 🔥 read from memory only
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;

    return decoded.exp > now;
  } catch {
    return false;
  }
}
