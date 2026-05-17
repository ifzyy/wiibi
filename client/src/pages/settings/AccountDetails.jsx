import { useState } from 'react';
import api from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const statusColors = {
  pending:    'bg-yellow-50 text-yellow-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped:    'bg-purple-50 text-purple-600',
  delivered:  'bg-green-50 text-green-600',
  cancelled:  'bg-red-50 text-red-500',
};

const StatusBadge = ({ status }) => (
  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-500'}`}>
    {status}
  </span>
);

const AccountDetailsTab = () => {
  const { user, refreshUser } = useAuth();
  const [editingField, setEditingField] = useState(null);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    phone:     user?.phoneNumber || '',
    shippingAddress: {
      fullName:     user?.shippingAddress?.fullName     || '',
      addressLine1: user?.shippingAddress?.addressLine1 || '',
      addressLine2: user?.shippingAddress?.addressLine2 || '',
      city:         user?.shippingAddress?.city         || '',
      state:        user?.shippingAddress?.state        || '',
      postalCode:   user?.shippingAddress?.postalCode   || '',
      country:      user?.shippingAddress?.country      || '',
      phone:        user?.shippingAddress?.phone        || '',
    },
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (fieldKey) => {
    setSaving(true);
    try {
      // Build only the changed field to send as payload
      let payload = {};
      if (fieldKey === 'shippingAddress') {
        payload = { shippingAddress: form.shippingAddress };
      } else {
        payload = { [fieldKey]: form[fieldKey] };
      }
console.log(payload)
      await api.patch('/users/me', payload);
      await refreshUser();
      setEditingField(null);
    } catch (err) {
      console.error('Update failed', err);
    } finally {
      setSaving(false);
    }
  };

  // Simple field (email, phone)
  const Field = ({ label, value, fieldKey }) => {
    const isEditing = editingField === fieldKey;
    return (
      <div className="py-4 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[11px] text-gray-500 font-medium">{label}</p>
          {!isEditing && (
            <button
              onClick={() => setEditingField(fieldKey)}
              className="text-[10px] text-[#FFAA14] hover:underline font-bold"
            >
              Edit
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-3 mt-2">
            <input
              className="flex-1 bg-white border border-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              value={form[fieldKey] || ''}
              onChange={(e) => setForm(f => ({ ...f, [fieldKey]: e.target.value }))}
              autoFocus
            />
            <button onClick={() => handleSave(fieldKey)} className="text-xs font-bold text-amber-500">
              {saving ? '...' : 'Save'}
            </button>
            <button onClick={() => setEditingField(null)} className="text-xs text-gray-400">
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm font-normal text-gray-900 leading-relaxed">{value || '—'}</p>
        )}
      </div>
    );
  };

  // Shipping address field (nested object)
const AddressField = () => {
    const isEditing = editingField === 'shippingAddress';
    const addr = user?.shippingAddress;
    const displayValue = addr?.addressLine1
      ? `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`
      : null;

    return (
      <div className="py-4 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[11px] text-gray-500 font-medium">Shipping Address</p>
          {!isEditing && (
            <button
              onClick={() => setEditingField('shippingAddress')}
              className="text-[10px] text-[#FFAA14] hover:underline font-bold"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            {[
              { key: 'addressLine1', placeholder: 'Address line 1' },
              { key: 'addressLine2', placeholder: 'Address line 2' },
              { key: 'city',         placeholder: 'City'           },
              { key: 'state',        placeholder: 'State'          },
              { key: 'postalCode',   placeholder: 'Postal code'    },
              { key: 'country',      placeholder: 'Country (2-letter code e.g. NG)' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                placeholder={placeholder}
                className="w-full bg-white border border-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                value={form.shippingAddress[key] || ''}
                onChange={(e) =>
                  setForm(f => ({
                    ...f,
                    shippingAddress: { ...f.shippingAddress, [key]: e.target.value },
                  }))
                }
              />
            ))}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => handleSave('shippingAddress')} className="text-xs font-bold text-amber-500">
                {saving ? '...' : 'Save'}
              </button>
              <button onClick={() => setEditingField(null)} className="text-xs text-gray-400">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-normal text-gray-900 leading-relaxed">{displayValue || '—'}</p>
        )}
      </div>
    );
  };
  return (
    <div className="max-w-2xl">
      <div className="bg-gray-50/50 -mx-6 -mt-6 px-6 py-3 mb-6 border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-800">Account Details</h2>
      </div>

      <div className="space-y-1">
        <div className="py-4 border-b border-gray-50">
          <p className="text-[11px] text-gray-500 font-medium mb-1">Name</p>
          <p className="text-sm font-normal text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
        </div>

        <Field label="Email"        value={user?.email}       fieldKey="email" />
        <Field label="Phone Number" value={user?.phoneNumber} fieldKey="phone" />
        <AddressField />
      </div>
    </div>
  );
};

export default AccountDetailsTab;