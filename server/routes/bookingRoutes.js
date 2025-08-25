import express from "express";
import { createBooking, getOccupiedSeats, verifyPayment } from "../controllers/bookingController.js";
import { stripeWebhooks } from "../controllers/stripeWebhooks.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", createBooking);
bookingRouter.get("/seats/:showId", getOccupiedSeats);

// Webhook endpoint
bookingRouter.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// Verify payment endpoint
bookingRouter.get("/verify-payment/:bookingId", verifyPayment);

export default bookingRouter;
