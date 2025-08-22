import stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("❌ Stripe signature verification failed:", error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { bookingId } = session.metadata;

        console.log("✅ Payment completed for booking:", bookingId);

        await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentLink: "",
        });

        await inngest.send({
          name: "app/show.booked",
          data: { bookingId },
        });

        break;
      }

      case "payment_intent.succeeded": {
        // Optional: fallback handler (in case you ever want to use it)
        console.log("ℹ️ Received payment_intent.succeeded — not processing.");
        break;
      }

      default:
        console.log("Unhandled Stripe event type:", event.type);
    }

    response.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    response.status(500).send("Internal server error");
  }
};
