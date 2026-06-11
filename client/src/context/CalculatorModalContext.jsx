/**
 * CalculatorModalContext — one global solar calculator modal.
 *
 * Every "Solar Calculator" entry point (nav, footer, store banner, account
 * page, calculator page) calls openCalculator() instead of routing to
 * /calculator, so the user keeps their place on the current page. The modal
 * is rendered ONCE here; the /calculator route still exists for deep links.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import CalculatorModal from '../pages/SolarCalculator/CalculatorModal.jsx';

const CalculatorModalContext = createContext(null);

export const CalculatorModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openCalculator  = useCallback(() => setIsOpen(true), []);
  const closeCalculator = useCallback(() => setIsOpen(false), []);

  return (
    <CalculatorModalContext.Provider value={{ openCalculator, closeCalculator, isCalculatorOpen: isOpen }}>
      {children}
      <CalculatorModal isOpen={isOpen} onClose={closeCalculator} />
    </CalculatorModalContext.Provider>
  );
};

export const useCalculatorModal = () => {
  const ctx = useContext(CalculatorModalContext);
  if (!ctx) throw new Error('useCalculatorModal must be used inside <CalculatorModalProvider>');
  return ctx;
};
