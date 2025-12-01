import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosSecure from "../utils/axiosSecure";
import { API_BASE_URL } from "../../config/api";

function Logout({ onLogout }) {
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const doLogout = async () => {
      try {
        await axiosSecure.post(
          `v1/auth/logout/`,
          {},
          { withCredentials: true }
        );

        if (onLogout) onLogout();

        localStorage.clear();

        navigate("/"); // redirect to home
      } catch (error) {
        console.log("Logout error:", error.response?.data);
      }
    };

    doLogout();
  }, [navigate, onLogout]);

  return null;
}

export default Logout;
