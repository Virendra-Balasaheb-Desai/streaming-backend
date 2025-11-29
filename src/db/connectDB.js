import mongoose from "mongoose";
import { DBNAME } from "../constants.js";

const connectDB = async () => {
    try {
                
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DBNAME}`);
        console.log("DB connected...");
        console.log("DB HOST : ",connectionInstance.connection.host);
        
    } catch (error) {
        console.log("Database connection error : ",error);
        process.exit(1)
    }
}

export default connectDB;