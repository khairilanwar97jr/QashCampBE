function toDateOnly(value) {
  if (value == null) return null;
  return String(value).slice(0, 10);
}

function hasAttachment(attachment) {
  return Array.isArray(attachment)
    ? attachment.length > 0
    : Boolean(attachment);
}

function toLatestBooking(row) {
  return {
    id: row.id,
    first_name: row.first_name,
    created_date: toDateOnly(row.createddate),
    start_date: toDateOnly(row.start_date),
    end_date: toDateOnly(row.end_date),
    camp_place: row.camp_place,
    payment_status: row.payment_status,
    has_layout: hasAttachment(row.booking_attch),
  };
}

module.exports = { toLatestBooking };
