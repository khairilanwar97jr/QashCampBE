const supabase = require('../config/supabase');
const { randomUUID } = require('node:crypto');

async function getBookingByRef(reference) {
  const { data, error } = await supabase.from('user_booking').select('id').eq('booking_ref', reference).maybeSingle();
  if (error) throw error;
  return data;
}

async function getBooking(id) {
  const { data, error } = await supabase.from('user_booking').select('id, booking_ref, start_date').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const today = `${date.year}-${date.month}-${date.day}`;
  return { ...data, review_available: !!data.start_date && String(data.start_date).slice(0, 10) <= today };
}
async function getReview(bookingId) {
  const { data, error } = await supabase.from('reviews')
    .select('id, booking_id, rating, feedback, created_at, photos:review_photos(id, photo_url, created_at)')
    .eq('booking_id', bookingId).maybeSingle();
  if (error) throw error;
  return data;
}

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    if (error.code === 'PGRST202') throw Object.assign(new Error('Review database setup is missing. Run sql/review-submission.sql in Supabase.'), { status: 503 });
    if (error.message === 'REVIEW_LOCK_LOST') throw Object.assign(new Error('Submission expired. Please retry.'), { status: 429 });
    if (error.message === 'REVIEW_NOT_AVAILABLE') throw Object.assign(new Error('Review is not available'), { status: 403 });
    throw error;
  }
  return data;
}

async function createReview(bookingId, rating, feedback, photoUrls, token) {
  return rpc('save_booking_review', {
    p_booking_id: bookingId, p_rating: rating, p_feedback: feedback,
    p_photo_keys: photoUrls, p_token: token,
  });
}

async function withSubmissionLock(id, action) {
  const token = randomUUID();
  const acquired = await rpc('claim_review_submission', { p_booking_id: id, p_token: token });
  if (!acquired) throw Object.assign(new Error('A review submission is in progress'), { status: 429 });
  try {
    return await action(token);
  } finally {
    try { await rpc('release_review_submission', { p_booking_id: id, p_token: token }); }
    catch { console.error('Review lock release failed; lease will expire. Booking:', id); }
  }
}

async function deleteReview(id, token) {
  await rpc('delete_booking_review', { p_booking_id: id, p_token: token });
}

async function listPublicReviews(limit, before) {
  let query = supabase.from('reviews')
    .select('id, rating, feedback, created_at')
    .order('id', { ascending: false }).limit(limit + 1);
  if (before) query = query.lt('id', before);
  const { data, error } = await query;
  if (error) throw error;
  const hasMore = data.length > limit;
  const reviews = data.slice(0, limit);
  if (!reviews.length) return { reviews: [], hasMore: false };
  // Fetch photos only for the visible page, not the extra pagination marker.
  const photos = await supabase.from('review_photos')
    .select('id, review_id, photo_url').in('review_id', reviews.map(review => review.id))
    .order('id', { ascending: true });
  if (photos.error) throw photos.error;
  return {
    reviews: reviews.map(review => ({ ...review, photos: photos.data.filter(photo => String(photo.review_id) === String(review.id)) })),
    hasMore,
  };
}

module.exports = { getBooking, getBookingByRef, getReview, createReview, withSubmissionLock, deleteReview, listPublicReviews };
