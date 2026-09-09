# Receipt reviews API

These routes use the existing public receipt access model. Booking IDs alone do
not verify guest ownership. Before exposing reviews to untrusted users, integrate
a private receipt credential or verified guest session with both routes.

Requires the `reviews` and `review_photos` tables previously created, with a unique
constraint on `reviews.booking_id`. Uses the existing Supabase client (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) and R2 configuration
(`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_ENDPOINT`
or `R2_ACCOUNT_ID`). `R2_PUBLIC_URL` is optional. Run `sql/review-submission.sql` once in the Supabase SQL Editor before POST testing. It adds a private lease table and service-role-only RPC functions. Existing booking and review tables are unchanged. No DB_* variables are needed.

## GET /api/bookings/:bookingRef/review

Call when opening the receipt. Response:

```json
{ "success": true, "status": "AVAILABLE", "review": null }
```

Status is `SUBMITTED` if a review exists, otherwise `AVAILABLE` starting at midnight
Malaysia time on `user_booking.start_date`, or `HIDDEN` before that date. Submitted
responses include the review and its `photos` records. Missing bookings return 404.
No payment/completion requirement is imposed: the agreed rule is the start date.

## POST /api/bookings/:bookingRef/review

Send multipart/form-data with `rating` (integer 1–5), optional `feedback` (up to
5000 characters), and optional repeated `photos` file fields (up to 3 JPEG, PNG,
or WebP images, at most 2 MB each). Let the browser set the multipart boundary.
JSON with rating and feedback is also supported for submissions without photos.

Successful save returns HTTP 201 with `success: true`, `status: "SUBMITTED"`, and
the saved `review`, including `photos`. Only then disable the frontend form.

Errors: 400 invalid input/upload limits, 403 before camping date, 404 unknown
booking, 409 already submitted, 500 storage/database failure. On 409, fetch GET
again to show the saved review. On other errors keep the form retryable.

Review and photo rows are saved in a database transaction. Failed submissions
attempt to remove uploaded R2 objects. Failed cleanup is logged for manual
follow-up. Photo uploads themselves are not part of the database transaction.

New photo records store the R2 object key in the existing `photo_url` database
column (no schema change). API responses expose that value as `object_key` and
return `photo_url: null` until `R2_PUBLIC_URL` is configured. Once configured,
GET builds display URLs for previously uploaded objects without rewriting rows.
Existing absolute photo URLs continue to work. The frontend must not use a null
photo URL as an image source. The R2 S3 endpoint is not a public image URL.

R2 uploads use the S3 SDK with region `auto`, following
[Cloudflare's SDK guide](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/).



Both routes take booking_ref in the URL and resolve the internal booking ID. No X-Booking-Reference header is required. This is a reference check, not verified ownership: existing public booking endpoints expose references. POST checks availability before multipart parsing and again after acquiring a Supabase submission lease before R2 uploads. The lease expires after 10 minutes to recover from crashed processes. Saving checks the same lease token and camping date, then inserts review and photos atomically. Missing RPC setup returns 503 before uploading.

Rate limit: 10 requests per IP per 15 minutes, shared between GET and POST within one process. Returns 429 and Retry-After. Multi-instance deployments need a shared gateway/Redis limiter. The app does not blindly trust forwarded IP headers; configure trusted proxies for your deployment.

Internal reviewService.deleteReview(bookingId) deletes R2 objects before database rows and retains rows on cleanup failure for retry. No public delete or unrestricted upload endpoint exists. Direct SQL deletion bypasses object cleanup. Legacy absolute photo URLs require manual cleanup. Image signatures are checked, not full image decoding.
