// src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar";
import Home from "./pages/home";
import Following from "./pages/following";
import Space from "./pages/space";
import Notification from "./pages/notification";
import Logout from "./components/auth/logout";
import checkAuth from "./components/utils/checkAuth";
import Profile from "./profiles/normal_profile";
import EntrepreneurProfile from "./profiles/entrepreneur";
import ExpertProfile from "./profiles/expert";
import Comments from "./components/posts/comment";

function App() {
  /* -----------------------------------------
      LOGIN STATE (Global)
  ----------------------------------------- */
  const [loggedIn, setLoggedIn] = useState(() => {
    return !!localStorage.getItem("access");
  });

  const [userEmail, setUserEmail] = useState(() => {
    const raw = localStorage.getItem("user");
    try {
      const user = JSON.parse(raw || "{}");
      return user.username || "";
    } catch {
      return "";
    }
  });

  const handleLogin = (email) => {
    setLoggedIn(true);
    setUserEmail(email);
  };

  const handleRegister = (email) => {
    setLoggedIn(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserEmail("");
  };

  /* -----------------------------------------
      SECURITY CHECK
  ----------------------------------------- */
  useEffect(() => {
    checkAuth();
  }, []);

  /* -----------------------------------------
      THEME LOGIC
  ----------------------------------------- */
  const getInitialTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("bg-neutral-900", "text-white");
      document.body.classList.remove("bg-white", "text-black");
    } else {
      root.classList.remove("dark");
      document.body.classList.add("bg-white", "text-black");
      document.body.classList.remove("bg-neutral-900", "text-white");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  /* -----------------------------------------
      SEARCH STATE (IMPORTANT)
  ----------------------------------------- */
  const [searchText, setSearchText] = useState("");

  /* -----------------------------------------
      RETURN UI
  ----------------------------------------- */
  return (
    <>
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        loggedIn={loggedIn}
        userEmail={userEmail}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onSearch={(text) => setSearchText(text)}  // 🔥 FIX: PASS SEARCH FUNCTION
      />

      <Routes>
        <Route
          path="/"
          element={
            <Home
              theme={theme}
              loggedIn={loggedIn}
              onLogin={handleLogin}
              onRegister={handleRegister}
              searchQuery={searchText}  // 🔥 PASS SEARCH TEXT TO FEED
            />
          }
        />
        <Route path="/following" element={<Following theme={theme} />} />
        <Route path="/spaces" element={<Space theme={theme} />} />
        <Route path="/notifications" element={<Notification theme={theme} />} />
        <Route path="/profile" element={<Profile theme={theme} />} />
        <Route path="/entrepreneur" element={<EntrepreneurProfile theme={theme} />} />
        <Route path="/expert" element={<ExpertProfile theme={theme} />} />
        <Route path="/post/:id/comments" element={<Comments theme={theme} />} />
        <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
      </Routes>
    </>
  );
}

export default App;
