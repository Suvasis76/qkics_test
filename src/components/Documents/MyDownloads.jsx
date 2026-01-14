import { useEffect, useState } from "react";
import axiosSecure from "../utils/axiosSecure";
import { FaDownload, FaHistory } from "react-icons/fa";

export default function MyDownloads({ theme }) {
  const isDark = theme === "dark";
  const [downloads, setDownloads] = useState([]);

  const fetchDownloads = async () => {
    try {
      const res = await axiosSecure.get("/v1/documents/my-downloads/");
      setDownloads(res.data.results);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  return (
    <div className={`rounded-2xl shadow-xl overflow-hidden ${isDark ? "bg-neutral-800 border border-neutral-700" : "bg-white border border-gray-100"}`}>
      <div className="p-6 border-b border-gray-100 dark:border-neutral-700 flex items-center gap-3">
        <FaHistory className={isDark ? "text-blue-400" : "text-blue-600"} />
        <h2 className="text-xl font-bold">Download History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={isDark ? "bg-neutral-900/50" : "bg-gray-50"}>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Document</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Access</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
            {downloads.length > 0 ? (
              downloads.map((d, i) => (
                <tr key={i} className={`transition-colors ${isDark ? "hover:bg-neutral-700/50" : "hover:bg-blue-50/30"}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? "bg-neutral-700" : "bg-gray-100"}`}>
                        <FaDownload className={`text-sm ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                      </div>
                      <span className="font-semibold text-sm">{d.document_title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${d.access_type_snapshot === "PREMIUM"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}>
                      {d.access_type_snapshot}
                    </span>
                  </td>
                  <td className={`p-4 text-right text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {new Date(d.downloaded_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-10 text-center text-gray-500 italic">
                  No downloads found in your history.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
