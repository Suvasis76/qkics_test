import { useEffect, useState } from "react";
import axiosSecure from "../components/utils/axiosSecure";
import { FaEye, FaFileAlt } from "react-icons/fa";
import DocumentDetailsModal from "../components/Documents/DocumentDetailsModal";

export default function DocumentList({ theme }) {
  const isDark = theme === "dark";
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDocuments = async () => {
    try {
      const res = await axiosSecure.get("/v1/documents/");
      setDocuments(res.data.results);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {documents.map((doc) => (
          <div
            key={doc.uuid}
            className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 ${isDark
                ? "bg-neutral-800 border border-neutral-700 hover:border-blue-500/50 shadow-lg shadow-black/20"
                : "bg-white border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl"
              }`}
          >
            {/* Icon & Access Badge */}
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${isDark ? "bg-neutral-700" : "bg-blue-50"}`}>
                <FaFileAlt className={`text-xl ${isDark ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${doc.access_type === "PREMIUM"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}
              >
                {doc.access_type}
              </span>
            </div>

            {/* Content */}
            <h3 className={`font-bold text-lg leading-tight mb-2 group-hover:text-blue-500 transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>
              {doc.title}
            </h3>
            <p className={`text-sm line-clamp-3 mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {doc.description}
            </p>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200 dark:border-neutral-700">
              <span className={`text-xs font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Updated {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => setSelectedDoc(doc.uuid)}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                  }`}
              >
                <FaEye className="text-base" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedDoc && (
        <DocumentDetailsModal
          uuid={selectedDoc}
          theme={theme}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
