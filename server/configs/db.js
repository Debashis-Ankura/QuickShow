import mongoose from "mongoose";



const connectDB = async () => {

  try {

    if (!process.env.MONGODB_URI) {

      throw new Error("MONGODB_URI is not defined in environment variables");

    }

    mongoose.connection.on("connected", () =>

      console.log("✅ Database Connected")

    );



    await mongoose.connect(process.env.MONGODB_URI);



  } catch (error) {

    console.error("❌ DB Connection Error:", error.message);

    throw error; // important: bubble up the error

  }

};



export default connectDB;