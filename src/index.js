import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Application is listening on ${process.env.PORT}`);
    });

    app.on("error", (error) => {
      console.log("Error: ", error);
      throw error;
    });
  })

  .catch((err) => {
    console.log("DB connection failed: ", err);
  });
