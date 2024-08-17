import {userModel,noteModel} from './user.js';
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
      response.status(401);
      response.json("Invalid JWT Token");
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
        response.status(400).json({ error_msg: 'Invalid password' });
      }
    } else {
      response.status(400).json({ error_msg: 'Invalid user' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    response.status(500).json({ error_msg: 'Internal server error' });
  }
});

  //Add notes
app.post('/addnotes', authentication, async (request, response) => {
    const { title, description } = request.body;
    try {
        const user = await userModel.findById(request.userId);
        
        if (!user) {
            return response.status(404).send('User not found');
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
        response.status(500).send('Internal server error');
    }
});

//get notes
app.get('/notes', authentication,async (request, response) => {
 
  try{
    const userId = request.userId
    // const user = await userModel.findById(userId);

    const notes = await noteModel.find({userId:userId});

    if (!notes || notes.length === 0) {
      return response.status(404).send('No notes found for this user');
  }

  response.send(notes);

  }
 catch (error) {
  console.error('Error fetching notes:', error);
  response.status(500).send('Internal server error');
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
          return response.status(404).send('Note not found or user not authorized');
          }
    response.send(updateNote);  
  }
  catch (error) {
    console.error('Error updating note:', error);
    response.status(500).send('Internal server error');
}
})

//delete 
app.delete('/notes/:noteId', authentication, async (request,response) => {

  const {noteId} = request.params;
  const userId = request.userId;

  try{
    const deletedNote = await noteModel.findOneAndDelete({
      _id: noteId, userId: userId
    });

    if (!deletedNote){
      return response.status(404).send("Note not Found")
    }
    response.send({message:"Noted Deleted"})
  }
  catch(ero) {
    console.log("error",ero)
    response.status(500).send("Server Error")

  }
})

app.listen(port, () => console.log(`Server running on port ${port}`));