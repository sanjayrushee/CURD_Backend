import {userModel,ArchivedNote,noteModel,DeletedNote} from './user.js';
import express, { request, response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const port = process.env.PORT || 8000;
const mongoUri = process.env.MONGO_URI 
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

mongoose.connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Failed to connect to MongoDB", err));

// Authentication
const authentication = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader) {
      jwtToken = authHeader.split(" ")[1];
    }
  
    if (jwtToken) {
      jwt.verify(jwtToken, SECRET_KEY, (error, payload) => {
        if (error) {
          response.status(401);
          response.json("Invalid JWT Token");
        } else {
          request.username = payload.username;
          request.userId = payload.userId;
          next();
        }
      });
    } else {
      response.status(401).json({error: "Invalid JWT Token"});
    }
  };


  app.post('/register/', async (request, response) => {
    const { email, username, password } = request.body;

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return response.status(400).json({ error: 'User already exists' });
        }

        if (password.length < 6) {
            return response.status(400).json({ error: 'Password is too short' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userModel({
            email,
            username,
            password: hashedPassword,
        });
        await newUser.save();

        response.status(201).json({ message: 'User created successfully' });

    } catch (error) {
        console.error('Error during registration:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});


//login
app.post('/login/', async (request, response) => {
  const { email, password } = request.body;

  try {
    const userDbDetails = await userModel.findOne({ email });

    if (userDbDetails) {
      const isPasswordCorrect = await bcrypt.compare(password, userDbDetails.password);

      if (isPasswordCorrect) {
        const payload = { email, userId: userDbDetails._id };
        const jwtToken = jwt.sign(payload, SECRET_KEY, { expiresIn: '10d' });
        response.json({ jwtToken });
      } else {
        response.status(400).json({ error: 'Invalid password' });
      }
    } else {
      response.status(400).json({ error: 'Invalid user' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

  //Add notes
app.post('/addnotes', authentication, async (request, response) => {
    const { title, description } = request.body;
    try {
        const user = await userModel.findById(request.userId);
        
        if (!user) {
            return response.status(404).json({error: 'User not found'});
        }

        // Create a new note
        const newNote = new noteModel({
            title,
            description,
            date: new Date(),
            userId: request.userId
        });

        //user.notes.push(newNote); need if we use nested document 
        await newNote.save();
        response.send('Note added successfully');
    } catch (error) {
        console.error('Error adding note:', error);
        response.status(500).json({error:'Internal server error'});
    }
});

//get notes
app.get('/notes', authentication,async (request, response) => {
 
  try{
    const userId = request.userId
    // const user = await userModel.findById(userId);

    const notes = await noteModel.find({userId:userId});

    if (!notes || notes.length === 0) {
      return response.status(404).json({error:'No notes found for this user'});
  }

  response.send(notes);

  }
 catch (error) {
  console.error('Error fetching notes:', error);
  response.status(500).json({error:'Internal server error'});
}

});

//update
app.put('/notes/:noteId',authentication,async (request, response) =>{
  const {noteId} = request.params;
  const userId = request.userId;
  const {title,description} = request.body;

  try{
    const updateNote = await noteModel.findOneAndUpdate(
      { _id: noteId, userId: userId }, 
      { 
          $set: { 
              "title": title,        
              "description": description ,
              updatedAt: Date.now()
          } 
        },
          { new: true }
      );

      if (!updateNote) {
          return response.status(404).json({erorr:'Note not found or user not authorized'});
          }
    response.send(updateNote);  
  }
  catch (error) {
    console.error('Error updating note:', error);
    response.status(500).json({error:'Internal server error'});
}
})

//delete 
app.delete('/notes/:noteId', authentication, async (request,response) => {

  const {noteId} = request.params;
  const userId = request.userId;

  try {
    const noteToDelete = await noteModel.findOne({ _id: noteId, userId: userId });

    if (!noteToDelete) {
        return response.status(404).json({ error: "Note not Found" });
    }

    await DeletedNote.create(noteToDelete.toObject()); 

    await noteModel.deleteOne({ _id: noteId });

    response.send({ message: "Note Deleted" });
} catch (ero) {
    console.log("error", ero);
    response.status(500).json({ error: 'Internal server error' });
}
})


//archive
app.post('/notes/:noteId/archive', authentication, async (request, response) => {
    const { noteId } = request.params;
    const userId = request.userId;

    try {
        // Step 1: Find the note to be archived
        const noteToArchive = await noteModel.findOne({ _id: noteId, userId: userId });

        if (!noteToArchive) {
            return response.status(404).json({ error: "Note not Found" });
        }

        // Step 2: Move the note to the archivedNotes collection
        const archivedNoteData = noteToArchive.toObject();
        archivedNoteData.archivedAt = new Date(); // Add archivedAt field

        await ArchivedNote.create(archivedNoteData);

        // Step 3: Delete the note from the original collection (optional)
        await noteModel.deleteOne({ _id: noteId });

        response.send({ message: "Note Archived" });
    } catch (ero) {
        console.log("error", ero);
        response.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(port, () => console.log(`Server running on port ${port}`));