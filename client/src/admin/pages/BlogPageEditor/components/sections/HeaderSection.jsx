import React from 'react';
import { ChevronRight } from 'lucide-react';
import Editable from '../common/Editable';

const HeaderSection = ({ subHeading, onSubHeadingChange, mainHeading, onMainHeadingChange }) => (
  <header className="max-w-7xl mx-auto px-6 pt-16 pb-12">
    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6">
      <span className="hover:text-amber-500 cursor-pointer transition-colors">Home</span>
      <ChevronRight size={10} strokeWidth={3} />
      <span className="text-amber-500">Our Services</span>
    </nav>

    {/* Editable sub-heading */}
    <Editable
      value={subHeading}
      onChange={onSubHeadingChange}
      className="text-amber-500 font-bold text-[11px] uppercase tracking-[0.3em] block mb-3"
      tag="span"
    />

    {/* Editable main heading */}
    <Editable
      value={mainHeading}
      onChange={onMainHeadingChange}
      className="text-5xl font-black text-[#0C0901] tracking-tight"
      tag="h1"
    />
  </header>
);

export default HeaderSection;