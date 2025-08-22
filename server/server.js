import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./Inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

const app = express();
const port = process.env.PORT || 3000;

/**
 * ✅ Connect to MongoDB
 * - No top-level await (Vercel will crash if you block module init).
 * - Errors bubble up and stop the app if DB is missing/broken.
 */
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

/**
 * ✅ Stripe webhook must come BEFORE express.json()
 *  - Stripe needs the raw body
 */
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// Normal middlewares AFTER Stripe route
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

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
 * ✅ Local dev vs Vercel deployment
 * - On Vercel, export app (no app.listen)
 * - On localhost, start normal Express server
 */
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () =>
    console.log(`🚀 Server listening at http://localhost:${port}`)
  );
}

export default app;