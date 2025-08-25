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
 */
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

/**
 * ✅ Stripe webhook must come BEFORE express.json()
 */
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

/**
 * ✅ CORS and JSON parser
 */
const allowedOrigins = [
  "https://quickshow-client-ecru.vercel.app", // deployed frontend
  "https://quickshow-frontend-five.vercel.app", // old frontend
  "http://localhost:5173" // local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow server-to-server, curl, mobile, etc.
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

/**
 * ✅ Clerk middleware (skip for Stripe webhook)
 */
app.use((req, res, next) => {
  if (req.path === "/api/stripe") return next();
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
