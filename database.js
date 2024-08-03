const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://sanjay:4c5VLE1huPYRdPPB@cluster0.z2w5znz.mongodb.net/crud?retryWrites=true&w=majority&appName=Cluster0"
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectToMongoDB();
