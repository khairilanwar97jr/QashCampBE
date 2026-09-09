const repo = require('../repositories/reviewRepo');
const storage = require('./r2Service');

const fail = (status, message) => Object.assign(new Error(message), { status });

function validateId(id) {
  if (!/^[1-9]\d{0,18}$/.test(String(id)) || BigInt(id) > 9223372036854775807n) {
    throw fail(400, 'A valid booking ID is required');
  }
}

async function getStatus(id, reference) {
  validateId(id);
  const booking = await repo.getBooking(id);
  if (!booking) throw fail(404, 'Booking not found');
  if (typeof reference !== 'string' || !reference || reference.length > 100 || reference !== booking.booking_ref) {
    throw fail(403, 'A matching booking reference is required');
  }
  const review = await repo.getReview(id);
  return {
    status: review ? 'SUBMITTED' : booking.review_available ? 'AVAILABLE' : 'HIDDEN',
    review: storage.presentReview(review),
  };
}

async function assertAvailable(id, reference) {
  const current = await getStatus(id, reference);
  if (current.status === 'SUBMITTED') throw fail(409, 'Already submitted');
  if (current.status === 'HIDDEN') throw fail(403, 'Reviews open on the camping start date');
}

async function submit(id, body = {}, files = [], reference) {
  validateId(id);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail(400, 'Invalid review fields');
  if (!['string', 'number'].includes(typeof body.rating)) throw fail(400, 'Invalid rating');
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw fail(400, 'Rating must be an integer from 1 to 5');
  }
  if (body.feedback != null && typeof body.feedback !== 'string') {
    throw fail(400, 'Feedback must be text');
  }
  const feedback = body.feedback?.trim() || null;
  if (feedback && feedback.length > 5000) throw fail(400, 'Feedback must be at most 5000 characters');
  if (!Array.isArray(files) || files.length > 3) throw fail(400, 'At most 3 photos are allowed');
  files.forEach(storage.validatePhoto);
  return repo.withSubmissionLock(id, async (token) => {
  await assertAvailable(id, reference);

  const uploaded = [];
  try {
    for (const file of files) uploaded.push(await storage.uploadPhoto(file));
    const review = await repo.createReview(id, rating, feedback, uploaded.map(photo => photo.key), token);
    return { status: 'SUBMITTED', review: storage.presentReview(review) };
  } catch (error) {
    const cleanup = await Promise.allSettled(uploaded.map(photo => storage.deletePhoto(photo.key)));
    cleanup.forEach((result, index) => {
      if (result.status === 'rejected') console.error('Review photo cleanup failed:', uploaded[index].key);
    });
    if (error.code === '23505') throw fail(409, 'Already submitted');
    throw error;
  }
  });
}

// Internal admin operation only; intentionally not exposed as a public route.
// Keep rows if storage deletion fails so an administrator can retry cleanup.
async function deleteReview(id) {
  validateId(id);
  return repo.withSubmissionLock(id, async (token) => {
    const review = await repo.getReview(id);
    if (!review) throw fail(404, 'Review not found');
    for (const photo of review.photos) {
      if (!photo.photo_url.startsWith('reviews/')) throw fail(400, 'Legacy photo requires manual storage cleanup');
    }
    for (const photo of review.photos) await storage.deletePhoto(photo.photo_url);
    await repo.deleteReview(id, token);
  });
}

async function resolveReference(reference) {
  if (typeof reference !== 'string' || !/^[A-Za-z0-9-]{1,100}$/.test(reference)) {
    throw fail(400, 'A valid booking reference is required');
  }
  const booking = await repo.getBookingByRef(reference);
  if (!booking) throw fail(404, 'Booking not found');
  return booking.id;
}

async function getStatusByRef(reference) {
  return getStatus(await resolveReference(reference), reference);
}

async function assertAvailableByRef(reference) {
  return assertAvailable(await resolveReference(reference), reference);
}

async function submitByRef(reference, body, files) {
  return submit(await resolveReference(reference), body, files, reference);
}

async function listPublicReviews(query = {}) {
  const rawLimit = query.limit === undefined ? '10' : query.limit;
  if (typeof rawLimit !== 'string' || !/^(?:[1-9]|10)$/.test(rawLimit)) {
    throw fail(400, 'Limit must be between 1 and 10');
  }
  if (query.before !== undefined) {
    if (typeof query.before !== 'string') throw fail(400, 'Invalid pagination cursor');
    validateId(query.before);
  }
  const result = await repo.listPublicReviews(Number(rawLimit), query.before);
  const reviews = result.reviews.map(review => {
    const presented = storage.presentReview(review);
    return {
      id: presented.id, rating: presented.rating, feedback: presented.feedback,
      created_at: presented.created_at,
      photos: presented.photos.map(photo => ({ id: photo.id, photo_url: photo.photo_url })),
    };
  });
  return { reviews, hasMore: result.hasMore, nextCursor: result.hasMore ? String(reviews.at(-1).id) : null };
}

module.exports = { getStatus, submit, assertAvailable, deleteReview, getStatusByRef, assertAvailableByRef, submitByRef, listPublicReviews };
