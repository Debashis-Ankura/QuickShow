import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Stripe needs raw body for verification — ensure app.post("/api/stripe", express.raw()) is set!
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
  } catch (err) {
    console.error("❌ Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;

      console.log("✅ Payment completed for booking:", bookingId);

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        console.error("⚠️ Booking not found:", bookingId);
        return res.status(404).send("Booking not found");
      }

      booking.isPaid = true;
      booking.paymentLink = "";
      await booking.save();

      // Trigger downstream actions
      await inngest.send({
        name: "app/show.booked",
        data: { bookingId },
      });
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Error handling Stripe webhook:", error.message);
    res.status(500).send("Internal Server Error");
  }
};
