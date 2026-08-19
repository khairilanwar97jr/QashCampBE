const { z } = require("zod");

const addOnSchema = z.object({
  addonId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

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

  addOns: z.array(addOnSchema).default([]).superRefine((addOns, ctx) => {
    const seen = new Set();

    addOns.forEach(({ addonId }, index) => {
      if (seen.has(addonId)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "addonId"],
          message: "Duplicate addonId",
        });
      }
      seen.add(addonId);
    });
  }),

  phoneNo: z.string().min(1),

  emailAddr: z.string().email(),

  campPlace: z.string().optional(),

  total: z.number().min(0),

  total_with_online_charge: z.number().min(0).optional(),

  // 👈 ADD THIS LINE TO VALIDATE THE BASE64 STRING
  summarySnapshot: z.string().optional()
});

module.exports = bookingSchema;
