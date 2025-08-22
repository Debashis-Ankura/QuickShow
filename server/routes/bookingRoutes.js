import express from "express";
import Booking from "../models/Booking.js";
import { createBooking, getOccupiedSeats } from "../controllers/bookingController.js";

const bookingRouter = express.Router();

// Create a new booking
bookingRouter.post("/create", createBooking);

// Get occupied seats for a show
bookingRouter.get("/seats/:showId", getOccupiedSeats);

// Redirect to Stripe payment link for a booking
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

// New route: Get booking details by ID (used for polling payment status)
bookingRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" },
      })
      .populate("user");

    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default bookingRouter;
