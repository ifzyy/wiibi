/**
 * SupportPage — public "Contact Support" form.
 *
 * Submits to POST /api/support/tickets (optionally authenticated — logged-in
 * users get the ticket linked to their account via the auth cookie; guests
 * just need an email). On success shows the ticket number the support team
 * will reference. Tickets appear live in the admin Support Desk.
 */
import { useState } from 'react';
import { LifeBuoy, Loader2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../utils/api.js';

const TICKET_TYPES = [
  { value: 'inquiry',        label: 'General inquiry'   },
  { value: 'complaint',      label: 'Complaint'         },
  { value: 'request',        label: 'Request'           },
  { value: 'refund_request', label: 'Refund request'    },
  { value: 'technical',      label: 'Technical issue'   },
  { value: 'other',          label: 'Other'             },
];

const BLANK = {
  requesterName:  '',
  requesterEmail: '',
  requesterPhone: '',
  type:           'inquiry',
  subject:        '',
  body:           '',
};

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] font-medium text-gray-800 ' +
  'outline-none focus:border-[#FFAA14] transition-colors placeholder:text-gray-300 bg-white';

export default function SupportPage() {
  const [form,    setForm]    = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [done,    setDone]    = useState(null);   // { ticketNumber }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.requesterEmail.trim()) return setError('Email address is required.');
    if (form.subject.trim().length < 3) return setError('Please enter a subject (at least 3 characters).');
    if (form.body.trim().length < 10) return setError('Please describe your issue in at least 10 characters.');

    setLoading(true);
    try {
      const { data } = await api.post('/support/tickets', {
        requesterName:  form.requesterName.trim()  || null,
        requesterEmail: form.requesterEmail.trim(),
        requesterPhone: form.requesterPhone.trim() || null,
        type:           form.type,
        subject:        form.subject.trim(),
        body:           form.body.trim(),
      });
      setDone(data?.data ?? data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-[#FFAA14]" />
          </div>
          <h1 className="text-2xl font-black text-[#1A1102] mb-2">Ticket submitted!</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            Our support team will get back to you within 24 hours at{' '}
            <span className="font-bold text-gray-700">{form.requesterEmail}</span>.
          </p>
          {done.ticketNumber && (
            <div className="inline-block bg-gray-50 border border-gray-100 rounded-xl px-5 py-3 mb-8">
              <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">Your ticket number</p>
              <p className="text-lg font-black text-[#1A1102] font-mono">{done.ticketNumber}</p>
            </div>
          )}
          <div>
            <button
              onClick={() => { setDone(null); setForm(BLANK); }}
              className="px-8 py-3.5 rounded-2xl bg-[#FFAA14] text-white font-black text-sm hover:bg-[#e69912] transition-colors"
            >
              Submit another request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LifeBuoy size={26} className="text-[#FFAA14]" />
        </div>
        <h1 className="text-3xl font-black text-[#1A1102] mb-2">Contact Support</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Have a complaint, question, or issue with an order? Send us the details
          and our team will respond within 24 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* Name + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sp-name" className="block text-sm font-bold text-gray-700 mb-2">
              Full name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input id="sp-name" type="text" value={form.requesterName} onChange={set('requesterName')}
              placeholder="e.g. Emeka Johnson" className={inputClass} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="sp-email" className="block text-sm font-bold text-gray-700 mb-2">
              Email address <span className="text-red-400">*</span>
            </label>
            <input id="sp-email" type="email" value={form.requesterEmail} onChange={set('requesterEmail')}
              placeholder="e.g. emeka@email.com" className={inputClass} autoComplete="email" required />
          </div>
        </div>

        {/* Phone + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sp-phone" className="block text-sm font-bold text-gray-700 mb-2">
              Phone number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input id="sp-phone" type="tel" value={form.requesterPhone} onChange={set('requesterPhone')}
              placeholder="e.g. 08012345678" className={inputClass} autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="sp-type" className="block text-sm font-bold text-gray-700 mb-2">
              What is this about?
            </label>
            <div className="relative">
              <select id="sp-type" value={form.type} onChange={set('type')}
                className={`${inputClass} appearance-none pr-10 cursor-pointer`}>
                {TICKET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="sp-subject" className="block text-sm font-bold text-gray-700 mb-2">
            Subject <span className="text-red-400">*</span>
          </label>
          <input id="sp-subject" type="text" value={form.subject} onChange={set('subject')}
            placeholder="e.g. My inverter stopped charging" maxLength={300} className={inputClass} required />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="sp-body" className="block text-sm font-bold text-gray-700 mb-2">
            Describe your issue <span className="text-red-400">*</span>
          </label>
          <textarea id="sp-body" value={form.body} onChange={set('body')}
            placeholder="Tell us what happened — include your order number if it's about an order."
            rows={6} maxLength={5000} className={`${inputClass} resize-y leading-relaxed`} required />
          <p className="text-right text-[11px] text-gray-400 mt-1">{form.body.length}/5000</p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-[13px] text-red-500 font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
            loading
              ? 'bg-[#FFD699] text-white cursor-not-allowed'
              : 'bg-[#FFAA14] text-white hover:bg-[#e69912] shadow-md shadow-amber-200'
          }`}
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Submitting…</>
            : 'Submit support request'}
        </button>

        <p className="text-[11px] text-gray-400 text-center">
          Already have a ticket? Reply to the email thread, or quote your ticket number when contacting us.
        </p>
      </form>
    </div>
  );
}
