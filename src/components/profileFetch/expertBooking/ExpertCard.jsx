import useThemeClasses from "../../utils/useThemeClasses";
  
export default function ExpertCard({ expert, onClick, resolveProfileImage, isDark }) {
  const { border1 } = useThemeClasses(isDark);

  // const imageUrl =
  //   expert.profile_picture ||
  //   expert.user?.profile_picture ||
  //   `https://ui-avatars.com/api/?name=${expert.user?.first_name || expert.user?.username}`;

  return (
    <div
      onClick={() => onClick(expert)}
      className={`cursor-pointer rounded-xl shadow-xl p-5 hover:shadow-2xl transition `}
      style={{ border: border1 }}
    >
      {/* PROFILE */}
      <div className="flex items-center gap-4">
        <img
          src={resolveProfileImage(expert)}
          alt="profile"
          className="h-24 w-24 rounded-full object-cover"
        />


        <div>
          <h2 className="font-semibold text-sm">
            {expert.first_name} {expert.last_name}
          </h2>
          <p className="text-xs opacity-70">{expert.headline}</p>
        </div>
      </div>

      {/* DETAILS */}
      <div className="mt-4 space-y-1 text-sm">
        <p>
          <span className="font-medium">Expertise:</span>{" "}
          {expert.primary_expertise}
        </p>

        {expert.other_expertise && (
          <p className="text-xs opacity-70">{expert.other_expertise}</p>
        )}

        <p className="font-medium">₹{expert.hourly_rate} / hour</p>

        <span
          className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${expert.is_available
            ? "bg-green-200 text-green-700"
            : "bg-red-200 text-red-700"
            }`}
        >
          {expert.is_available ? "Available" : "Not Available"}
        </span>
      </div>
    </div>
  );
}
