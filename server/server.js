import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

const app = express();
const port = process.env.PORT || 3000;

/**
 * ✅ Connect to MongoDB
 * - Avoid top-level await
 */
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

/**
 * ✅ Stripe webhook must come BEFORE express.json()
 * - Stripe needs the raw body for signature verification
 */
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }), // raw body for Stripe
  stripeWebhooks
);

/**
 * ✅ Middleware and JSON parsing (after Stripe)
 */
app.use(cors());
app.use(express.json()); // Must come after the Stripe raw parser
// Skip Clerk for Stripe webhook requests
app.use((req, res, next) => {
  if (req.path === "/api/stripe") return next(); // skip Clerk for webhook
  return clerkMiddleware()(req, res, next);
});


/**
 * ✅ Routes
 */
app.get("/", (req, res) => res.send("Server is Live! 🚀"));
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/show", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

/**
 * ✅ Deployment-aware export
 */
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () =>
    console.log(`🚀 Server listening at http://localhost:${port}`)
  );
}

export default app;
