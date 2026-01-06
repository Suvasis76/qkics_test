function ModalOverlay({ children, close, bgClass = "bg-black/40" }) {
    return (
        <div
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
            }}
            className={`fixed inset-0 ${bgClass} flex items-center justify-center z-[100]`}
        >
            <div className="w-full flex justify-center" onMouseDown={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

export default ModalOverlay;
