import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username : String, 
    email : String,
    password : String
});

const userModel = mongoose.model('user', userSchema);



const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    location: { type: String },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
const Event = mongoose.model('Event', eventSchema);

export {userModel,Event};