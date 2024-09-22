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
    email : { type:String , required: true},
    username:{type:String ,required:true , maxLength:15},
    password : { type:String , required: true},
   // notes: { type: [notesSchema], default: [] } if the use of  nested document only

});


const deletedNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users' }, 
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now } ,
  deletedAt: { type: Date, default: Date.now, expires: '30d' } 
});


const ArchiveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  title: { type: String },
  description: { type: String },
  date: { type: Date, required: true },
 
});

const archiveModel = mongoose.model('archives',ArchiveSchema)
const deletedModel = mongoose.model('delmodels',deletedNoteSchema);
const userModel = mongoose.model('users', userSchema);
const noteModel = mongoose.model('notes', notesSchema);

export {userModel,noteModel,archiveModel,deletedModel};