import {userModel,Event} from './user.js';
import express from 'express';
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
          response.send("Invalid JWT Token");
        } else {
          request.username = payload.username;
          request.userId = payload.userId;
          next();
        }
      });
    } else {
      response.status(401);
      response.send("Invalid JWT Token");
    }
  };

  //add events
  app.post('/events', async (req, res) => {
    try {
      const { title, description, date, location, organizerId } = req.body;
  
      const newEvent = new Event({
        title,
        description,
        date,
        location,
        organizerId
      });
  
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

//show events
  app.get('/getevents', (req, res) => {
    Event.find()
      .then(events => res.json(events))
      .catch(err => {
        console.error("Error fetching users", err);
        res.status(500).json({ error: "Failed to fetch users" });
      });
  });


//
app.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an event
app.put('/events/:id', async (req, res) => {
  try {
    const { id } = req.params; 
    const updates = req.body; 

    const updatedEvent = await Event.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message }); 
  }
});

app.post('/register/', async (request, response) => {
const { email,username, password } = request.body;

try {

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
    return response.status(400).send('User already exists');
    }
    if (password.length < 6) {
    return response.status(400).send('Password is too short');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
    email,
    username,
    password: hashedPassword,
   
    });
    await newUser.save();
    response.send('User created successfully');

} catch (error) {
    console.error('Error during registration:', error);
    response.status(500).send('Internal server error');
}
});

//login

app.post('/login/', async (request, response) => {
    const { email,username, password } = request.body;
    
    try {
      const userDbDetails = await userModel.findOne({ email });
  
      if (userDbDetails) {
        const isPasswordCorrect = await bcrypt.compare(password, userDbDetails.password);
  
        if (isPasswordCorrect) {
          const payload = { username, userId: userDbDetails._id };
          const jwtToken = jwt.sign(payload, SECRET_KEY, { expiresIn: '10d' });
          response.send({ jwtToken });
        } else {
          response.status(400).send('Invalid password');
        }
      } else {
        response.status(400).send('Invalid user');
      }
    } catch (error) {
      console.error('Error during login:', error);
      response.status(500).send('Internal server error');
    }
  });

app.listen(port, () => console.log(`Server running on port ${port}`));