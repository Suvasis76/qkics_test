import useThemeClasses from "../../utils/useThemeClasses";

export default function InvestorCard({
  investor,
  onClick,
  isDark,
}) {
  const { border1 } = useThemeClasses(isDark);

  const {
    display_name,
    one_liner,
    investor_type_display,
    location,
    verified_by_admin,
    profile_picture,
    user,
  } = investor;

  const resolveProfileImage = () => {
    const url =
      profile_picture || user?.profile_picture;

    const name =
      display_name ||
      user?.first_name ||
      user?.username ||
      "Investor";

    if (!url) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=random&length=1`;
    }

    return `${url}?t=${Date.now()}`;
  };

  return (
    <div
      onClick={() => onClick(investor)}
      className="cursor-pointer rounded-xl shadow-xl p-5 hover:shadow-2xl transition"
      style={{ border: border1 }}
    >
      {/* PROFILE */}
      <div className="flex items-center gap-4">
        <img
          src={resolveProfileImage()}
          alt="profile"
          className="h-24 w-24 rounded-full object-cover"
        />

        <div>
          <h2 className="font-semibold text-sm">
            {display_name}
          </h2>
          <p className="text-xs opacity-70">
            {user?.first_name} {user?.last_name}
          </p>
        </div>
      </div>

      {/* DETAILS */}
      <div className="mt-4 space-y-1 text-sm">
        {one_liner && (
          <p>
            <span className="font-medium">Thesis:</span>{" "}
            {one_liner}
          </p>
        )}

        {investor_type_display && (
          <p className="text-xs opacity-70">
            {investor_type_display}
          </p>
        )}

        {location && (
          <p className="font-medium">
            {location}
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
