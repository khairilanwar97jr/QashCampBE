const { z } = require("zod");

const bookingSchema = z.object({
  type: z.enum(["BOOKING", "WALK_IN"]),

  firstName: z.string().min(1),
  lastName: z.string().optional(),

  noId: z.string().min(1),

  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),

  startDate: z.string(),   // you can upgrade to date later
  endDate: z.string(),

  packageId: z.number(),

  addOnIds: z.array(z.number()).optional(),

  phoneNo: z.string().min(1),

  emailAddr: z.string().email(),

  campPlace: z.string().optional(),

  total: z.number().min(0),

  total_with_online_charge: z.number().min(0).optional(),

  // 👈 ADD THIS LINE TO VALIDATE THE BASE64 STRING
  summarySnapshot: z.string().optional()
});

module.exports = bookingSchema;