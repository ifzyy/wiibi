import React, { useState } from 'react';
import { ChevronLeft, Cookie, ShieldCheck, Info } from 'lucide-react';

const CookieSettings = () => {
  const [settings, setSettings] = useState({
    essential: true, // Always true/disabled
    analytics: true,
    marketing: false,
    personalization: true,
  });

  const toggle = (key) => {
    if (key === 'essential') return;
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-50">
          <button className="flex items-center text-sm text-gray-500 hover:text-black transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-2 text-lg font-medium">
            <Cookie size={20} className="text-gray-600" /> Cookie Preferences
          </div>
          <div className="w-12"></div>
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold bg-[#F8F9FA] p-4 rounded-lg mb-6">Manage Cookies</h2>

          {/* Intro Text */}
          <div className="flex items-start gap-3 bg-amber-50/50 border border-amber-100 p-4 rounded-xl mb-8">
            <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[13px] text-gray-600 leading-relaxed">
              We use cookies to improve your experience on Wiibi Energy. Essential cookies are necessary for the site to function, while others help us analyze performance.
            </p>
          </div>

          {/* Cookie Types List */}
          <div className="space-y-4">
            <CookieToggle 
              title="Essential Cookies"
              description="Required for the website to function safely and correctly. These cannot be turned off."
              isEnabled={settings.essential}
              onToggle={() => toggle('essential')}
              disabled={true}
            />
            <CookieToggle 
              title="Analytics Cookies"
              description="Helps us understand how visitors interact with the platform so we can improve the user experience."
              isEnabled={settings.analytics}
              onToggle={() => toggle('analytics')}
            />
            <CookieToggle 
              title="Personalization"
              description="Used to remember your preferences, such as your solar calculator inputs and region."
              isEnabled={settings.personalization}
              onToggle={() => toggle('personalization')}
            />
            <CookieToggle 
              title="Marketing Cookies"
              description="Used to track advertising effectiveness and show you relevant content based on your interests."
              isEnabled={settings.marketing}
              onToggle={() => toggle('marketing')}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-12 pt-6 border-t border-gray-50">
            <button className="flex-1 bg-[#FFAA14] hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition-all shadow-sm">
              Save Preferences
            </button>
            <button className="flex-1 bg-white border border-gray-100 text-gray-600 font-medium py-4 rounded-xl hover:bg-gray-50 transition-all">
              Accept All
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

const CookieToggle = ({ title, description, isEnabled, onToggle, disabled = false }) => (
  <div className="flex items-center justify-between p-5 bg-[#F8F9FA] rounded-2xl border border-transparent hover:border-gray-100 transition-all">
    <div className="pr-6">
      <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed max-w-sm">{description}</p>
    </div>
    
    {/* Custom Toggle Switch */}
    <button 
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        isEnabled ? 'bg-amber-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isEnabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export default CookieSettings;