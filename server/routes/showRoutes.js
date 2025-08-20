import express from "express";
import { getNowPlayingMovies, getShow, getShows, addShow } from "../controllers/showController.js";
import { clerkMiddleware } from '@clerk/express'; // Ensure Clerk middleware is available for authentication
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

// Add Clerk middleware to check authentication on /now-playing route
showRouter.use(clerkMiddleware());  // Add Clerk authentication check globally or on specific routes

// Now, simply use the controller function, Clerk middleware will handle unauthorized users
showRouter.get('/now-playing', getNowPlayingMovies);

// Admin protected route for adding shows
showRouter.post('/add', protectAdmin, addShow);

// Route to get all shows
showRouter.get('/all', getShows);

// Route to get specific show details by movieId
showRouter.get("/:movieId", getShow);

export default showRouter;
