import { useState } from "react";
import Document from "./document";
import MyDownloads from "../components/Documents/MyDownloads";

export default function DocumentsPage({ theme }) {
  const [showDownloads, setShowDownloads] = useState(false);
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen ${isDark ? "bg-neutral-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header Section */}
      <div className="pt-24 pb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Resource Library</h1>
        <p className={`mt-3 text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Access and manage your professional documents and downloads.
        </p>
      </div>

      {/* Modern Segmented Control Tabs */}
      <div className="flex justify-center mb-10">
        <div className={`flex p-1 rounded-xl shadow-inner ${isDark ? "bg-neutral-800" : "bg-gray-200"}`}>
          <button
            onClick={() => setShowDownloads(false)}
            className={`px-8 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${!showDownloads
                ? (isDark ? "bg-blue-600 text-white shadow-lg" : "bg-white text-blue-600 shadow-sm")
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setShowDownloads(true)}
            className={`px-8 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${showDownloads
                ? (isDark ? "bg-blue-600 text-white shadow-lg" : "bg-white text-blue-600 shadow-sm")
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            My Downloads
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="pb-20">
        {!showDownloads ? (
          <Document theme={theme} />
        ) : (
          <div className="max-w-6xl mx-auto px-4">
            <MyDownloads theme={theme} />
          </div>
        )}
      </div>
    </div>
  );
}
