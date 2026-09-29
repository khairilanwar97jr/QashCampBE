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

async function listPublicReviews() {
  const reviews = [];
  let before;
  // Read in internal batches so the database response cap cannot truncate the slider.
  // The frontend receives all matching reviews in a single response.
  while (true) {
    let query = supabase.from('reviews')
      .select('id, rating, feedback, created_at, booking:user_booking!booking_id(first_name, last_name, camp_place, createddate, package:package!package_id(name)), photos:review_photos(id, photo_url)')
      .gte('rating', 3)
      .order('id', { ascending: false }).limit(500);
    if (before !== undefined) query = query.lt('id', before);
    const { data, error } = await query;
    if (error) throw error;
    if (!data.length) break;
    reviews.push(...data);
    before = data.at(-1).id;
  }
  return { reviews };
}

module.exports = { getBooking, getBookingByRef, getReview, createReview, withSubmissionLock, deleteReview, listPublicReviews };
