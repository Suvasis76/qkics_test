import { createContext, useContext, useState, useCallback } from "react";
import ConfirmationAlert from "../components/ui/ConfirmationAlert";

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmData, setConfirmData] = useState(null);

  const showConfirm = useCallback(
    ({ title, message, confirmText, cancelText, onConfirm }) => {
      setConfirmData({
        title,
        message,
        confirmText,
        cancelText,
        onConfirm,
      });
    },
    []
  );

  const closeConfirm = () => setConfirmData(null);

  const handleConfirm = () => {
    confirmData?.onConfirm?.();
    closeConfirm();
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}

      {confirmData && (
        <ConfirmationAlert
          title={confirmData.title}
          message={confirmData.message}
          confirmText={confirmData.confirmText}
          cancelText={confirmData.cancelText}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </ConfirmContext.Provider>
  );
};
