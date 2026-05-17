import { useState, useEffect, useCallback } from 'react';
import { StarRating } from './ui.jsx';
import api from '../../utils/api.js';
// ============================================================================
// CONSTANTS
// ============================================================================

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest'  },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest',  label: 'Lowest'  },
];

const EMPTY_SUMMARY = {
  average:   0,
  total:     0,
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

const EMPTY_FORM = { rating: 0, author: '', title: '', body: '' };

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const RatingBar = ({ star, pct }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs font-semibold text-gray-500 w-2">{star}</span>
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#FFAA14] rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
    <span className="text-xs text-gray-400 w-6 text-right">{pct}%</span>
  </div>
);

const ReviewCard = ({ review }) => {
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : review.date;

  return (
    <div className="bg-gray-50 rounded-2xl p-5 flex flex-col gap-3">
      <StarRating rating={review.rating} size="sm" />
      {review.title && (
        <h5 className="font-bold text-gray-900 text-sm leading-snug">{review.title}</h5>
      )}
      {review.body && (
        <p className="text-gray-500 text-xs leading-relaxed">{review.body}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="text-[11px] text-gray-400">{date}</span>
        <span className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
          {review.author}
          {review.verified && (
            <span className="text-green-500 text-xs" title="Verified purchase">●</span>
          )}
        </span>
      </div>
    </div>
  );
};

// ── Star picker used inside the write-review form ─────────────────────────
const StarPicker = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="text-3xl transition-colors leading-none"
        >
          <span className={star <= (hovered || value) ? 'text-[#FFAA14]' : 'text-gray-200'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

// ── Inline field ──────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 ' +
  'placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFAA14]/40 ' +
  'focus:border-[#FFAA14] transition-all';

// ── Write-review panel ─────────────────────────────────────────────────────
const WriteReview = ({ productId, onSuccess }) => {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
    setApiErr('');
  };

  const validate = () => {
    const e = {};
    if (!form.rating)       e.rating = 'Please select a rating';
    if (!form.author.trim()) e.author = 'Name is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setApiErr('');
    try {
      await api.post(`/reviews/${productId}/reviews`, {
        rating: form.rating,
        author: form.author.trim(),
        title:  form.title.trim()  || undefined,
        body:   form.body.trim()   || undefined,
      });
      setDone(true);
      setForm(EMPTY_FORM);
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setApiErr(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="border border-gray-100 rounded-2xl p-6 h-full flex flex-col items-center justify-center gap-3 text-center">
        <span className="text-4xl">🎉</span>
        <p className="text-sm font-bold text-gray-800">Thanks for your review!</p>
        <p className="text-xs text-gray-400">It will appear shortly.</p>
        <button
          onClick={() => setDone(false)}
          className="text-xs text-[#FFAA14] font-semibold mt-1 hover:underline"
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-6 flex flex-col gap-4">
      <p className="text-sm font-semibold text-gray-700">Review this product</p>

      {/* Star picker */}
      <div className="flex flex-col gap-1">
        <StarPicker value={form.rating} onChange={(v) => set('rating', v)} />
        {errors.rating && <p className="text-xs text-red-500">{errors.rating}</p>}
      </div>

      <Field label="Your name *" error={errors.author}>
        <input
          className={inputCls}
          placeholder="e.g. Sarah K."
          value={form.author}
          onChange={(e) => set('author', e.target.value)}
        />
      </Field>

      <Field label="Headline" error={errors.title}>
        <input
          className={inputCls}
          placeholder="Sum it up in a sentence"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </Field>

      <Field label="Your review" error={errors.body}>
        <textarea
          rows={3}
          className={inputCls + ' resize-none'}
          placeholder="What did you love (or not) about this product?"
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
        />
      </Field>

      {apiErr && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{apiErr}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-[#FFAA14] text-white text-sm font-bold
                   hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all active:scale-[0.98]"
      >
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  );
};

// ── Pagination controls ───────────────────────────────────────────────────
const Pagination = ({ pagination, page, setPage }) => {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => setPage(p => p - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-500 border border-gray-200
                   hover:border-[#FFAA14] hover:text-[#FFAA14] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        ← Prev
      </button>
      <span className="text-xs text-gray-400">
        {page} / {pagination.pages}
      </span>
      <button
        onClick={() => setPage(p => p + 1)}
        disabled={page >= pagination.pages}
        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-500 border border-gray-200
                   hover:border-[#FFAA14] hover:text-[#FFAA14] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Next →
      </button>
    </div>
  );
};

// ── Filter bar ────────────────────────────────────────────────────────────
const FilterBar = ({ sort, setSort, ratingFilter, setRatingFilter, total }) => (
  <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-gray-500">
        {total.toLocaleString()} Reviews
      </span>
      {/* Star filter pills */}
      <div className="flex gap-1.5 ml-2">
        {[0, 5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            onClick={() => setRatingFilter(s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
              ${ratingFilter === s
                ? 'bg-[#FFAA14] border-[#FFAA14] text-white'
                : 'border-gray-200 text-gray-500 hover:border-[#FFAA14] hover:text-[#FFAA14]'
              }`}
          >
            {s === 0 ? 'All' : `${s}★`}
          </button>
        ))}
      </div>
    </div>
    {/* Sort */}
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value)}
      className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5
                 focus:outline-none focus:ring-2 focus:ring-[#FFAA14]/40 focus:border-[#FFAA14]
                 bg-white cursor-pointer transition-all"
    >
      {SORT_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TabReviews = ({ product }) => {
  const productId = product?.id;

  const [reviews,      setReviews]      = useState([]);
  const [summary,      setSummary]      = useState(EMPTY_SUMMARY);
  const [pagination,   setPagination]   = useState(null);
  const [page,         setPage]         = useState(1);
  const [sort,         setSort]         = useState('newest');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // ── Fetch reviews ─────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 8, sort };
      if (ratingFilter) params.rating = ratingFilter;

      const { data } = await api.get(`/reviews/${productId}/reviews`, { params });
      setReviews(data.reviews      || []);
      setSummary(data.ratingSummary || EMPTY_SUMMARY);
      setPagination(data.pagination  || null);
    } catch (err) {
      setError('Could not load reviews. Please try again.');
      console.error('TabReviews fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, page, sort, ratingFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Reset to page 1 when filters change
  const handleSortChange = (val)  => { setSort(val);         setPage(1); };
  const handleStarFilter = (val)  => { setRatingFilter(val); setPage(1); };

  // After a successful submission, re-fetch from page 1 so the new review shows
  const handleReviewSuccess = () => {
    setPage(1);
    setSort('newest');
    setRatingFilter(0);
    fetchReviews();
  };

  return (
    <div>
      {/* ── Summary row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        {/* Overall score */}
        <div className="border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-semibold text-gray-400">Overall Rating</p>
          <StarRating rating={summary.average} size="lg" />
          <p className="text-5xl font-black text-gray-900">{summary.average || '—'}</p>
          <p className="text-xs text-gray-400">{summary.total.toLocaleString()} reviews</p>
        </div>

        {/* Breakdown bars */}
        <div className="border border-gray-100 rounded-2xl p-6 flex flex-col justify-center gap-3">
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar key={star} star={star} pct={summary.breakdown[star] || 0} />
          ))}
        </div>

        {/* Write a review */}
        <WriteReview productId={productId} onSuccess={handleReviewSuccess} />
      </div>

      {/* ── Verified feedback header ───────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl px-6 py-3 flex items-center gap-3 mb-6">
        <span className="text-sm font-semibold text-gray-700">Verified customer feedback</span>
        <span className="text-sm font-bold text-gray-400">{summary.total}</span>
      </div>

      {/* ── Filter / sort bar ─────────────────────────────────────────────── */}
      <FilterBar
        sort={sort}
        setSort={handleSortChange}
        ratingFilter={ratingFilter}
        setRatingFilter={handleStarFilter}
        total={summary.total}
      />

      {/* ── Review cards ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-200 rounded" />
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded mt-auto" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button
            onClick={fetchReviews}
            className="text-xs font-bold text-[#FFAA14] border border-[#FFAA14] px-4 py-2 rounded-lg hover:bg-amber-50 transition-all"
          >
            Try again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">
            {ratingFilter
              ? `No ${ratingFilter}-star reviews yet.`
              : 'No reviews yet — be the first!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      <Pagination pagination={pagination} page={page} setPage={setPage} />
    </div>
  );
};

export default TabReviews;