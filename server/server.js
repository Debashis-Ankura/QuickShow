import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express"
import { inngest, functions } from "./Inngest/index.js";
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = process.env.PORT || 3000;

await connectDB()

// ⚡ Stripe webhook must come BEFORE express.json()
app.post(
  '/api/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhooks
)

// Normal middlewares AFTER Stripe route
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

app.get('/', (req, res) => res.send('Server is Live!'))
app.use('/api/inngest', serve({ client: inngest, functions }))

app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`))
