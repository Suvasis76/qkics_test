import { jwtDecode } from "jwt-decode";


export default function checkAuth() {
    const token = localStorage.getItem("access_token");
    if (!token) return false;

    try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        return decoded.exp > now;
    } catch {
        return false;
    }
}
