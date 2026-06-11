
import { Calculator } from 'lucide-react';
import { useCalculatorModal } from '../../context/CalculatorModalContext.jsx';


// ══════════════════════════════════════════════════════════════════════════════
// Solar Calculator History tab
// ══════════════════════════════════════════════════════════════════════════════
const SolarHistoryTab = () => {
  const { openCalculator } = useCalculatorModal();

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">Solar Calculator History</h2>
      <div className="mt-8 text-center py-20">
        <Calculator size={36} className="text-gray-200 mx-auto mb-3" />
        <p className="font-semibold text-gray-400 text-sm">No calculations saved yet</p>
        <button
          onClick={openCalculator}
          className="mt-3 inline-block text-[#FFAA14] text-sm font-bold hover:underline"
        >
          Try the Solar Calculator →
        </button>
      </div>
    </div>
  );
};

export default SolarHistoryTab;