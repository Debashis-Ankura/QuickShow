import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;

        console.log("✅ Payment completed for booking:", bookingId);

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).send("Booking not found");

        booking.isPaid = true;
        booking.paymentLink = "";
        await booking.save();

        // Trigger downstream events
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId },
        });

        break;
      }
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Error handling Stripe webhook:", error.message);
    res.status(500).send("Internal Server Error");
  }
};
