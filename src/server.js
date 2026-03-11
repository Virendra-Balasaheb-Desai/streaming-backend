import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import { app } from "./app.js";
import { PORT } from "./constants.js";

dotenv.config({
    path: "./.env",
});

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("App Error :", error);
            throw error;
        });

        app.listen(PORT, () =>
            console.log(`Server running at http://localhost:${PORT}`)
        );
    })
    .catch((error) => {
        console.log("Database connection failed... ", error);
    });
