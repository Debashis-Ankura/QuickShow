import express from "express";
import Booking from "../models/Booking.js";
import { createBooking, getOccupiedSeats } from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", createBooking);
bookingRouter.get("/seats/:showId", getOccupiedSeats);

bookingRouter.get("/pay/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).send("Booking not found");

    if (!booking.paymentLink) return res.status(400).send("Payment link not available");

    // Redirect to Stripe checkout
    return res.redirect(booking.paymentLink);
  } catch (error) {
    console.error("Error in /pay/:bookingId:", error);
    return res.status(500).send("Server error");
  }
});

export default bookingRouter;
