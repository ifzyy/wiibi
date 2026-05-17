import React, { useEffect } from 'react';

const ModalShell = ({ open, onClose, children, maxW = "max-w-[480px]" }) => {
  useEffect(() => {
    if (!open) return;
    
    const esc = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className={`relative w-full ${maxW} bg-white rounded-[28px] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] overflow-hidden`}>
        {children}
      </div>
    </div>
  );
};

export default ModalShell;