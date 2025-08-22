import Booking from "../models/Booking.js";

export const checkPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.isPaid) {
      return res.json({ success: true, isPaid: true });
    } else {
      return res.json({ success: true, isPaid: false });
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
