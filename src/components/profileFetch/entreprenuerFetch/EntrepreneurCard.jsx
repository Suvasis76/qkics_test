import useThemeClasses from "../../utils/useThemeClasses";

export default function EntrepreneurCard({
  entrepreneur,
  onClick,
  isDark,
}) {
  const { border1 } = useThemeClasses(isDark);

  const {
    startup_name,
    one_liner,
    industry,
    funding_stage,
    verified_by_admin,
    logo,
    user,
  } = entrepreneur;

  /* ----------------------------
      IMAGE RESOLVER (MATCHES EXPERT)
  ----------------------------- */
  const resolveProfileImage = () => {
  const url =
    user?.profile_picture || logo;

  const name =
    startup_name ||
    user?.first_name ||
    user?.username ||
    "Startup";

  if (!url) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&length=1`;
  }

  return `${url}?t=${Date.now()}`;
};


  return (
    <div
      onClick={() => onClick(entrepreneur)}
      className="cursor-pointer rounded-xl shadow-xl p-5 hover:shadow-2xl transition"
      style={{ border: border1 }}
    >
      {/* PROFILE (EXACT STRUCTURE AS EXPERT) */}
      <div className="flex items-center gap-4">
        <img
          src={resolveProfileImage()}
          alt="profile"
          className="h-24 w-24 rounded-full object-cover"
        />

        <div>
          <h2 className="font-semibold text-sm">
            {startup_name}
          </h2>
          <p className="text-xs opacity-70">
            {user?.first_name} {user?.last_name}
          </p>
        </div>
      </div>

      {/* DETAILS (EXACT SPACING / TYPOGRAPHY) */}
      <div className="mt-4 space-y-1 text-sm">
        {one_liner && (
          <p>
            <span className="font-medium">About:</span>{" "}
            {one_liner}
          </p>
        )}

        {industry && (
          <p className="text-xs opacity-70">
            {industry}
          </p>
        )}

        {funding_stage && (
          <p className="font-medium">
            Stage: {funding_stage}
          </p>
        )}

        <span
          className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
            verified_by_admin
              ? "bg-green-200 text-green-700"
              : "bg-red-200 text-red-700"
          }`}
        >
          {verified_by_admin ? "Verified" : "Not Verified"}
        </span>
      </div>
    </div>
  );
}
