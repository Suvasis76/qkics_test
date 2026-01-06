// src/utils/useThemeClasses.js
export default function useThemeClasses(isDark) {
  return {
    bg: isDark ? "bg-neutral-900 text-white" : "bg-white text-black",
    card: isDark ? "bg-neutral-800" : "bg-neutral-100",
    input: isDark
      ? "bg-neutral-800 text-white"
      : "bg-neutral-100 text-black",
    border: isDark ? "border-neutral-700" : "border-neutral-300",
    border1: isDark
  ? "1px solid rgba(255, 255, 255, 0.35)" // light border for dark mode
  : "1px solid rgba(0, 0, 0, 0.2)",       // dark border for light mode

    // style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
  };
}
