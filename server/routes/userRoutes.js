import express from "express";
import { getFavorites, getUserBookings, updteFavorite } from "../controllers/userController.js";

const userRouter = express.Router()

userRouter.get('/bookings', getUserBookings)
userRouter.post('/update-favorite', updteFavorite)
userRouter.get('/favorite', getFavorites)

export default userRouter