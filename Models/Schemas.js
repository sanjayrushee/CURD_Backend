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
    email : { type:String , required: true, unique: true,},
    username:{type:String ,required:true , maxLength:15},
    password : { type:String , required: true},
    resetCode: {
      code: { type: String }, 
      expires: { type: Date }, 
  },
   // notes: { type: [notesSchema], default: [] } if the use of  nested document only

});


const deletedNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users' }, 
  title: { type: String},
  description: { type: String },
  date: { type: Date, default: Date.now } ,
  deletedAt: { type: Date, default: Date.now, expires: '30d' } 
});


const ArchiveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  title: { type: String },
  description: { type: String },
  date: { type: Date, required: true },
 
});

const archiveModel = mongoose.model('ArchivesNotes',ArchiveSchema)
const deletedModel = mongoose.model('DeletedNotes',deletedNoteSchema);
const userModel = mongoose.model('Users', userSchema);
const noteModel = mongoose.model('Notes', notesSchema);

export {userModel,noteModel,archiveModel,deletedModel};