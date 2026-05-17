import React, { useState } from 'react';
import { Trash2, Plus, X, ChevronDown } from 'lucide-react';

const DynamicRequestForm = () => {
  // Initial fields based on your screenshot
  const [fields, setFields] = useState([
    { id: 1, label: 'Service Type ?', type: 'select', value: 'Installation service', options: ['Installation service', 'Maintenance', 'Repair'] },
    { id: 2, label: 'Property Type', type: 'select', value: 'Commercial', options: ['Commercial', 'Residential', 'Industrial'] },
    { id: 3, label: 'Business Name', type: 'text', value: '', placeholder: 'Enter your business name' },
    { id: 4, label: 'Phone Number', type: 'text', value: '+234', placeholder: '+234' },
    { id: 5, label: 'Business Email', type: 'text', value: '', placeholder: 'Enter Email' },
    { id: 6, label: 'Business Description', type: 'text', value: '', placeholder: 'What is your business about ?' },
    { id: 7, label: 'State', type: 'select', value: 'Lagos', options: ['Lagos', 'Abuja', 'Kano', 'Rivers'] },
  ]);

  const [showAddMenu, setShowAddMenu] = useState(false);

  // Update field value
  const handleUpdate = (id, newValue) => {
    setFields(fields.map(field => field.id === id ? { ...field, value: newValue } : field));
  };

  // Remove field
  const removeField = (id) => {
    setFields(fields.filter(field => field.id !== id));
  };

  // Add new field
  const addField = (fieldType) => {
    const newField = {
      id: Date.now(),
      label: fieldType === 'text' ? 'New Input Field' : 'New Dropdown',
      type: fieldType,
      value: '',
      placeholder: 'Enter text...',
      options: fieldType === 'select' ? ['Option 1', 'Option 2'] : []
    };
    setFields([...fields, newField]);
    setShowAddMenu(false);
  };

  return (
    <div className="max-w-xl my-10 p-4 bg-white min-h-screen font-sans text-gray-800">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex flex-col gap-1">
            <div className="h-1 w-6 bg-gray-800 rounded"></div>
            <div className="h-1 w-6 bg-gray-800 rounded"></div>
            <div className="h-1 w-4 bg-gray-800 rounded"></div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Request Form</h1>
        </div>
        <button className="text-gray-500 text-sm hover:underline">Manage forms</button>
      </div>

      {/* Dynamic Fields */}
      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.id} className="relative group flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-base font-semibold mb-2">{field.label}</label>
              
              <div className="relative">
                {field.type === 'select' ? (
                  <div className="relative">
                    <select
                      value={field.value}
                      onChange={(e) => handleUpdate(field.id, e.target.value)}
                      className="w-full bg-gray-100 border-none rounded-lg p-3 appearance-none focus:ring-2 focus:ring-gray-200 outline-none"
                    >
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={20} />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => handleUpdate(field.id, e.target.value)}
                    className="w-full bg-gray-100 border-none rounded-lg p-3 focus:ring-2 focus:ring-gray-200 outline-none"
                  />
                )}
              </div>
            </div>

            {/* Delete Button */}
            <button 
              onClick={() => removeField(field.id)}
              className="mb-3 p-2 text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Button & Popup */}
      <div className="mt-8 relative">
        <button 
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-800 transition-colors"
        >
          <div className="bg-gray-800 text-white rounded-full p-0.5">
            <Plus size={14} />
          </div>
          <span className="text-sm">Add</span>
        </button>

        {showAddMenu && (
          <div className="absolute left-0 mt-4 w-56 bg-white border border-gray-100 rounded-lg shadow-xl z-10 overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
              <span className="text-xs font-bold bg-gray-600 text-white px-2 py-0.5 rounded">Add</span>
              <button onClick={() => setShowAddMenu(false)}><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="p-2 flex gap-2">
              <button 
                onClick={() => addField('text')}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold border rounded p-2 hover:bg-gray-50"
              >
                Input Field <Plus size={10} />
              </button>
              <button 
                onClick={() => addField('select')}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold border rounded p-2 hover:bg-gray-50"
              >
                Drop down <Plus size={10} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicRequestForm;