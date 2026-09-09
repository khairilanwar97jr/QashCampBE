# Public review panel

GET `/api/reviews` returns the newest 10 submitted reviews, ordered by ID descending.
Optional `limit` is an integer from 1 to 10; larger values return 400.
For load more, request `/api/reviews?before=<nextCursor>` using the previous response.
Stop when `hasMore` is false. No booking reference is required.

Response: `{ success: true, reviews: [...], hasMore: false, nextCursor: null }`.
Each review has `id`, `rating`, `feedback`, `created_at`, and `photos` containing
`id` and `photo_url`. No customer details, booking IDs/references, or raw object
keys are included. All submitted reviews are public; there is no moderation flag.

The database reads at most 11 review rows to check for another page, then fetches
photo metadata only for the returned reviews. Images are not downloaded by this
API. Responses may be cached for 30 seconds in browsers and 60 seconds in shared
caches; newly submitted/deleted reviews may take that long to appear/disappear.

Frontend: fetch on opening the panel, append on Load more, and lazy-load images.
Skip image elements when photo_url is null. Render feedback as plain text.
These URLs currently point to original images; displaying them small in CSS does
not reduce downloaded bytes. Separate optimized thumbnails remain future work.

## To do

- Build the compact frontend panel (frontend project location still needed).
- Add private review tokens to the receipt links sent over WhatsApp.
- Add shared rate limiting across server instances.
- Generate smaller thumbnails for the review panel.
