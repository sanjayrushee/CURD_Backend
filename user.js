import mongoose from 'mongoose';

const notesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  title: { type: String },
  description: { type: String },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username : { type:String , required: true}, 
    email : { type:String , required: true},
    password : String,
   // notes: { type: [notesSchema], default: [] } if the use of  nested document only

});

const userModel = mongoose.model('users', userSchema);
const noteModel = mongoose.model('notes', notesSchema);

export {userModel,noteModel};