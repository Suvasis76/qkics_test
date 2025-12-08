// src/components/auth/Login.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { loginUser, fetchUserProfile } from "../../redux/slices/userSlice";
import { useAlert } from "../../context/AlertContext";

function LoginModal({ onClose, openSignup, isDark }) {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const bg = isDark ? "bg-neutral-800 text-white" : "bg-white text-black";

  const handleLogin = async () => {
    try {
      const result = await dispatch(loginUser({ username, password }));

      if (loginUser.rejected.match(result)) {
        showAlert("Invalid username or password", "error");
        return;
      }

      await dispatch(fetchUserProfile());
      showAlert("Login successful!", "success");

      onClose();
    } catch (err) {
      console.log(err);
      showAlert("Login failed", "error");
    }
  };

  return (
    <div className={`p-6 rounded-2xl shadow-xl w-96 ${bg}`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Login</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}   // ❌ removed lowercase
        className={`w-full px-3 py-2 rounded border mb-3 ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
      />

      <button
        onClick={handleLogin}
        className="w-full mt-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
      >
        Login
      </button>

      <button onClick={openSignup} className="w-full mt-2 text-sm underline">
        Create an account
      </button>
    </div>
  );
}

export default LoginModal;
