import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import configs from './Config/dotenvconfig.js';
import userRoutes from './Routes/userRoutes.js'
import noteRoutes from './Routes/noteRoutes.js'

const app = express();
app.use(cors());
app.use(express.json());

const connectToDatabase = async () => {
  try {
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
};

connectToDatabase();

app.use('/authe', userRoutes);
app.use('/notes',noteRoutes)


app.listen(configs.PORT, () => console.log(`Server running on port ${configs.PORT}`));