import { body, param, query } from "express-validator";
import { MIN_PACKAGE_IMAGES } from "@/modules/booking/booking.constants";

export const listMyBookingsValidation = () => [
  query("status")
    .notEmpty()
    .withMessage("status is required")
    .isIn(["live", "completed"])
    .withMessage("status must be 'live' or 'completed'"),
];

const contactValidator = (prefix: string, countryOptional = false) => [
  body(`${prefix}.name`).notEmpty().trim().withMessage(`${prefix}.name required`),
  body(`${prefix}.phone`).notEmpty().trim().withMessage(`${prefix}.phone required`),
  ...(countryOptional
    ? [
        body(`${prefix}.countryCode`)
          .optional()
          .trim()
          .isIn(["+1", "+91"])
          .withMessage(`${prefix}.countryCode must be +1 or +91 when provided`),
      ]
    : []),
];

export const createBookingValidation = () => [
  body("tripId").notEmpty().withMessage("tripId required"),
  body("parcel.weight").isFloat({ min: 0.01 }).withMessage("parcel.weight required and > 0"),
  body("parcel.length").isFloat({ min: 0.01 }).withMessage("parcel.length required and > 0"),
  body("parcel.width").isFloat({ min: 0.01 }).withMessage("parcel.width required and > 0"),
  body("parcel.height").isFloat({ min: 0.01 }).withMessage("parcel.height required and > 0"),
  body("parcel.description").optional().isString(),
  ...contactValidator("senderDetails"),
  ...contactValidator("receiverDetails", true),
  body("packageImages")
    .isArray({ min: MIN_PACKAGE_IMAGES })
    .withMessage(`At least ${MIN_PACKAGE_IMAGES} package images required`),
  body("packageImages.*").isString().notEmpty(),
  body("agreedPrice").isFloat({ min: 0.01 }).withMessage("agreedPrice required and > 0"),
  body("illegalItemsDeclaration")
    .isBoolean()
    .custom((value) => value === true)
    .withMessage("illegalItemsDeclaration must be true"),
];

export const acceptBookingValidation = () => [
  param("id").notEmpty().withMessage("Booking id is required"),
];

export const createBookingPaymentIntentValidation = () => [
  param("id").notEmpty().withMessage("Booking id is required"),
  body("paymentMethodId").optional().isString().trim().notEmpty(),
];

export const payBookingValidation = () => [
  body("paymentSignature").optional().isString(),
  body("paymentIntentId").optional().isString(),
];

const parcelOtpBody = () => [
  body("bookingId").notEmpty().isMongoId().withMessage("bookingId must be a valid id"),
  body("otp")
    .notEmpty()
    .matches(/^\d{4}$/)
    .withMessage("otp must be exactly 4 digits"),
];

export const verifyPickupOtpValidation = () => parcelOtpBody();

export const verifyDeliveryOtpValidation = () => parcelOtpBody();

export const resendDeliveryOtpValidation = () => [
  body("bookingId").notEmpty().isMongoId().withMessage("bookingId must be a valid id"),
];
