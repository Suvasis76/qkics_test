let navigateFunction = null;

export const setNavigate = (fn) => {
  navigateFunction = fn;
};

export const navigateTo = (path) => {
  if (navigateFunction) {
    navigateFunction(path);
  } else {
    console.warn("⚠ navigate() not ready yet");
  }
};
