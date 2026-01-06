import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import { FaBell } from "react-icons/fa";
import { FaUsersGear } from "react-icons/fa6";

function MobileBottomNav({ theme, isLoggedIn, setShowLogin }) {
    const isDark = theme === "dark";
    const location = useLocation();
    const navigate = useNavigate();

    const getNavClass = (path) => {
        const isActive = location.pathname === path;
        const base = "flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all duration-200 text-[10px] font-medium w-full";

        if (isDark) {
            return isActive
                ? `${base} text-red-400 bg-neutral-800`
                : `${base} text-neutral-400 hover:text-neutral-200`;
        } else {
            return isActive
                ? `${base} text-red-600 bg-red-100`
                : `${base} text-neutral-500 hover:text-neutral-900`;
        }
    };

    const handleAuthNavigation = (path) => {
        if (!isLoggedIn) {
            setShowLogin(true);
        } else {
            navigate(path);
        }
    };

    return (
        <div
            className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t pb-safe
        ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"}
      `}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex justify-around items-center h-14 px-2">

                {/* HOME */}
                <Link to="/" className="flex-1 text-center">
                    <div className={getNavClass("/")}>
                        <FaHome  className="h-7 w-7" />
                        
                    </div>
                </Link>

                {/* PROFESSIONALS */}
                <button
                    onClick={() => handleAuthNavigation("/booking")}
                    className="flex-1 text-center"
                >
                    <div className={getNavClass("/booking")}>
                        <FaUsersGear className="h-7 w-7" />
                        
                    </div>
                </button>

                {/* NOTIFICATIONS */}
                <button
                    onClick={() => handleAuthNavigation("/notifications")}
                    className="flex-1 text-center"
                >
                    <div className={getNavClass("/notifications")}>
                        <FaBell className="h-7 w-7" />
                        
                    </div>
                </button>

            </div>
        </div>
    );
}

export default MobileBottomNav;
