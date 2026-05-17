import React, { useState } from 'react';
import { ChevronLeft, CreditCard, Trash2, AlertCircle, Menu } from 'lucide-react';

const PaymentSettings = () => {
  const [cards, setCards] = useState([
    { id: 1, type: 'Master Card', last4: '87348', expiry: '05/24' },
    { id: 2, type: 'Master Card', last4: '87350', expiry: '05/24' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  const openDeleteModal = (card) => {
    setCardToDelete(card);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    setCards(cards.filter(c => c.id !== cardToDelete.id));
    setIsModalOpen(false);
    setCardToDelete(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Menu size={20} className="text-gray-600 cursor-pointer" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">W</div>
            <span className="font-semibold text-sm">Wiibi Energy</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full pl-3">
          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
            <UserIcon size={14} className="text-amber-600" />
          </div>
          <ChevronDown size={14} className="text-gray-400 mr-1" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Sub Header */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
          <button className="flex items-center text-sm text-gray-500 hover:text-black transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-2 text-lg font-medium">
            <CreditCard size={20} className="text-gray-600" /> Payment Settings
          </div>
          <div className="w-12"></div>
        </div>

        {/* Content Area */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold bg-[#F8F9FA] p-4 rounded-lg mb-6">Cards</h2>

          {/* Alert Box */}
          <div className="flex items-center gap-3 bg-[#F8F9FA] border border-gray-100 p-4 rounded-xl mb-8">
            <AlertCircle size={18} className="text-gray-400 shrink-0" />
            <p className="text-[13px] text-gray-500">
              You cannot add a payment method here. You can add it during a purchase.
            </p>
          </div>

          {/* Card List */}
          <div className="space-y-6">
            {cards.map((card) => (
              <div key={card.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="bg-[#F3F4F6] p-4 rounded-t-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center">
                      <CreditCard size={16} className="text-gray-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {card.type} <span className="text-gray-400 font-normal ml-2">XXXX-{card.last4}</span>
                    </span>
                  </div>
                  <div className="bg-[#F9FAFB] p-4 rounded-b-xl">
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">Expiry date</span>
                    <span className="text-[11px] text-gray-600 ml-4 font-medium">{card.expiry}</span>
                  </div>
                </div>
                <button 
                  onClick={() => openDeleteModal(card)}
                  className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="text-red-500" size={24} />
                <h3 className="text-lg font-bold">Delete this card</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Please confirm if you want to delete {cardToDelete?.type} XXXX-{cardToDelete?.last4}
              </p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-[#FFAA14] hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Yes
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-white border border-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Icon Placeholders for the Header
const UserIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const ChevronDown = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

export default PaymentSettings;