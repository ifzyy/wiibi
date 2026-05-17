import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const AccountManagement = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'security'
  const [form, setForm] = useState({ fullName: '', email: '', gender: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityStatus, setSecurityStatus] = useState({ type: '', message: '' });

  const formatShippingAddress = (shippingAddress) => {
    if (!shippingAddress) return '';
    return [
      shippingAddress.fullName,
      shippingAddress.addressLine1,
      shippingAddress.addressLine2,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.postalCode,
      shippingAddress.country,
    ]
      .filter(Boolean)
      .join(', ');
  };

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || '',
      gender: '',
      address: formatShippingAddress(user.shippingAddress),
    });
  }, [user]);

  const handleAccountSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    const [firstName, ...rest] = form.fullName.trim().split(' ');
    const lastName = rest.join(' ');

    try {
      await api.patch('/users/me', {
        firstName: firstName || null,
        lastName: lastName || null,
      });
      await refreshUser();
      setStatus({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile. Please try again.',
      });
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async (event) => {
    event.preventDefault();
    setSecuritySaving(true);
    setSecurityStatus({ type: '', message: '' });

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityStatus({ type: 'error', message: 'Passwords do not match.' });
      setSecuritySaving(false);
      return;
    }

    try {
      const payload = {
        newPassword: securityForm.newPassword,
      };
      if (securityForm.currentPassword) payload.currentPassword = securityForm.currentPassword;

      await api.post('/auth/set-password', payload);
      setSecurityStatus({ type: 'success', message: 'Password updated successfully.' });
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setSecurityStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update password. Please try again.',
      });
      console.error('Password update error:', err);
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setForm({
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || '',
      gender: '',
      address: formatShippingAddress(user.shippingAddress),
    });
    setStatus({ type: '', message: '' });
    setSecurityStatus({ type: '', message: '' });
  };

  // Common styling for inputs to match the "Apple-esque" minimalist look
  const inputCls = "w-full bg-[#F8F9FA] border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-amber-400 outline-none transition-all placeholder:text-gray-300";
  const labelCls = "block text-sm font-medium text-gray-400 mb-2";

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 max-w-5xl mx-auto">
        <button className="flex items-center text-sm text-gray-600 hover:text-black transition-colors">
          <ChevronLeft size={18} className="mr-1" /> Back
        </button>
        <div className="flex items-center gap-2 text-lg font-medium text-gray-800">
          <User size={20} /> Account Management
        </div>
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>

      <div className="max-w-xl mx-auto mt-10 px-6">
        {/* Tab Switcher */}
        <div className="flex gap-8 mb-8">
          <button 
            onClick={() => setActiveTab('account')}
            className={`text-sm font-medium pb-1 transition-all ${activeTab === 'account' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400'}`}
          >
            Account Settings
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`text-sm font-medium pb-1 transition-all ${activeTab === 'security' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400'}`}
          >
            Security Settings
          </button>
        </div>

        {activeTab === 'account' ? (
          <AccountTab
            inputCls={inputCls}
            labelCls={labelCls}
            form={form}
            setForm={setForm}
            onSave={handleAccountSave}
            onCancel={handleCancel}
            saving={saving}
            status={status}
          />
        ) : (
          <SecurityTab
            inputCls={inputCls}
            labelCls={labelCls}
            form={securityForm}
            setForm={setSecurityForm}
            onSave={handleSecuritySave}
            onCancel={() => setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
            saving={securitySaving}
            status={securityStatus}
          />
        )}
      </div>
    </div>
  );
};

const AccountTab = ({ inputCls, labelCls, form, setForm, onSave, onCancel, saving, status }) => {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-gray-900 bg-[#F8F9FA] p-4 rounded-lg mb-8">Profile Details</h2>
      <form className="space-y-6" onSubmit={onSave}>
        <div>
          <label className={labelCls}>Full Name</label>
          <input
            type="text"
            placeholder="Enter name"
            className={inputCls}
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            placeholder="Your account email"
            className={inputCls}
            value={form.email}
            disabled
          />
          <p className="text-xs text-gray-400 mt-2">Email cannot be updated from this form.</p>
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <div className="relative">
            <select
              className={`${inputCls} appearance-none cursor-not-allowed`}
              value={form.gender}
              disabled
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>Address</label>
          <input
            type="text"
            placeholder="Shipping address is managed elsewhere"
            className={inputCls}
            value={form.address}
            disabled
          />
          <p className="text-xs text-gray-400 mt-2">Shipping address can only be updated through the dedicated checkout or profile address flow.</p>
        </div>

        {status.message && (
          <p className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {status.message}
          </p>
        )}

        <ActionButtons saving={saving} onCancel={onCancel} />
      </form>
    </div>
  );
};

const SecurityTab = ({ inputCls, labelCls, form, setForm, onSave, onCancel, saving, status }) => {
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const toggle = (field) => setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-gray-900 bg-[#F8F9FA] p-4 rounded-lg mb-8">Security Settings</h2>
      <form className="space-y-6" onSubmit={onSave}>
        <PasswordField
          label="Current password"
          show={showPass.current}
          onToggle={() => toggle('current')}
          inputCls={inputCls}
          labelCls={labelCls}
          value={form.currentPassword}
          onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
          placeholder="Enter current password"
        />
        <PasswordField
          label="New Password"
          show={showPass.new}
          onToggle={() => toggle('new')}
          inputCls={inputCls}
          labelCls={labelCls}
          value={form.newPassword}
          onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
          placeholder="Enter new password"
        />
        <PasswordField
          label="Confirm password"
          show={showPass.confirm}
          onToggle={() => toggle('confirm')}
          inputCls={inputCls}
          labelCls={labelCls}
          value={form.confirmPassword}
          onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          placeholder="Confirm password"
        />

        {status.message && (
          <p className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {status.message}
          </p>
        )}

        <ActionButtons saving={saving} onCancel={onCancel} />
      </form>
    </div>
  );
};

const PasswordField = ({ label, show, onToggle, inputCls, labelCls, placeholder, value, onChange }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputCls}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

const ActionButtons = ({ saving, onCancel }) => (
  <div className="flex gap-4 pt-4">
    <button
      type="submit"
      disabled={saving}
      className="flex-1 bg-[#FFAA14] hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition-all shadow-sm disabled:opacity-60"
    >
      {saving ? 'Saving...' : 'Save'}
    </button>
    <button
      type="button"
      onClick={onCancel}
      className="flex-1 bg-white border border-gray-100 text-gray-600 font-medium py-4 rounded-xl hover:bg-gray-50 transition-all"
    >
      Cancel
    </button>
  </div>
);

export default AccountManagement;