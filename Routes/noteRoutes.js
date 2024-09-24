import express from 'express';
import authentication from '../Middlewares/authentication.js';
import { userModel,noteModel,deletedModel,archiveModel } from '../Models/Schemas.js';
import mongoose from 'mongoose';

const router = express.Router();

// Add notes
router.post('/', authentication, async (request, response) => {
    const { title, description } = request.body;
    try {
        const user = await userModel.findById(request.userId);
        if (!user) {
            return response.status(404).json({ error: 'User not found' });
        }

        const newNote = new noteModel({
            title,
            description,
            date: new Date(),
            userId: request.userId
        });

        await newNote.save();
        response.status(201).json({ message: 'Note added successfully' });
    } catch (error) {
        console.error('Error adding note:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});

// Get notes
router.get('/', authentication, async (request, response) => {
    try {
        const notes = await noteModel.find({ userId: request.userId });
        if (!notes || notes.length === 0) {
            return response.status(404).json({ error: 'No notes found for this user' });
        }
        response.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/delnotes', authentication, async (request, response) => {
    try {
        const notes = await deletedModel.find({ userId: request.userId });
        if (!notes || notes.length === 0) {
            return response.status(404).json({ error: 'No notes found for this user' });
        }
        response.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/archnotes', authentication, async (request, response) => {
    try {
        const notes = await archiveModel.find({ userId: request.userId });
        if (!notes || notes.length === 0) {
            return response.status(404).json({ error: 'No notes found for this user' });
        }
        response.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});


// Update note
router.put('/:noteId', authentication, async (request, response) => {
    const { noteId } = request.params;
    const userId = request.userId;
    const { title, description } = request.body;

    try {
        const updateNote = await noteModel.findOneAndUpdate(
            { _id: noteId, userId: userId },
            { $set: { title, description, updatedAt: Date.now() } },
            { new: true }
        );

        if (!updateNote) {
            return response.status(404).json({ error: 'Note not found or user not authorized' });
        }
        response.status(200).json(updateNote);
    } catch (error) {
        console.error('Error updating note:', error);
        response.status(500).json({ error: 'Internal server error' });
    }
});

// Delete note
router.delete('/:noteId', authentication, async (request, response) => {
    const { noteId } = request.params;
    const userId = request.userId;

    if (!mongoose.isValidObjectId(noteId)) {
        return response.status(400).json({ error: 'Invalid note ID' });
    }

    try {
        const note = await noteModel.findOne({ _id: noteId, userId: userId });
        if (!note) {
            return response.status(404).json({ error: "Note not found" });
        }

        const deldata = await deletedModel.create(note.toObject());
        if (deldata) {
            await noteModel.deleteOne({ _id: noteId });
            response.status(200).json({ message: 'Document moved to delete collection' });
        } else {
            response.status(500).json({ message: 'Failed to insert into delete collection' });
        }
    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({ error: 'Internal server error' });
    }
});

// Recover from delete
router.post('/:noteId/recover', authentication, async (request, response) => {
    const { noteId } = request.params;
    const userId = request.userId;

    if (!mongoose.isValidObjectId(noteId)) {
        return response.status(400).json({ error: 'Invalid note ID' });
    }

    try {
        const deletedNote = await deletedModel.findOne({ _id: noteId, userId: userId });
        if (!deletedNote) {
            return response.status(404).json({ error: "Deleted note not found" });
        }

        const recoveredNote = new noteModel({
            title: deletedNote.title,
            description: deletedNote.description,
            date: deletedNote.date,
            userId: userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await recoveredNote.save();
        await deletedModel.deleteOne({ _id: noteId });
        response.status(200).json({ message: 'Note recovered successfully' });
    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({ error: 'Internal server error' });
    }
});


// ARchive note
router.delete('/archive/:noteId', authentication, async (request, response) => {
    const { noteId } = request.params;
    const userId = request.userId;

    if (!mongoose.isValidObjectId(noteId)) {
        return response.status(400).json({ error: 'Invalid note ID' });
    }

    try {
        const note = await archiveModel.findOne({ _id: noteId, userId: userId });
        if (!note) {
            return response.status(404).json({ error: "Note not found" });
        }

        const deldata = await deletedModel.create(note.toObject());
        if (deldata) {
            await archiveModel.deleteOne({ _id: noteId });
            response.status(200).json({ message: 'Document moved to delete collection' });
        } else {
            response.status(500).json({ message: 'Failed to insert into delete collection' });
        }
    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({ error: 'Internal server error' });
    }
});



// Archive note
router.put('/archive/:noteId', authentication, async (request, response) => {
    const { noteId } = request.params;
    const userId = request.userId;

    if (!mongoose.isValidObjectId(noteId)) {
        return response.status(400).json({ error: 'Invalid note ID' });
    }

    try {
        // Find the note by ID and user ID
        const note = await noteModel.findOne({ _id: noteId, userId: userId });
        if (!note) {
            return response.status(404).json({ error: "Note not found" });
        }

        // Move note data to archiveModel
        const archiveData = await archiveModel.create(note.toObject());
        if (archiveData) {
            // If successfully archived, delete from the noteModel
            await noteModel.deleteOne({ _id: noteId });
            response.status(200).json({ message: 'Note moved to archive' });
        } else {
            response.status(500).json({ message: 'Failed to archive note' });
        }
    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({ error: 'Internal server error' });
    }
});


// Recover archived note
router.put('/archive-recover/:noteId', authentication, async (request, response) => {
    const { noteId } = request.params;
    const userId = request.userId;

    if (!mongoose.isValidObjectId(noteId)) {
        return response.status(400).json({ error: 'Invalid note ID' });
    }

    try {
        const archivedNote = await archiveModel.findOne({ _id: noteId, userId: userId });
        if (!archivedNote) {
            return response.status(404).json({ error: "Archived note not found" });
        }

        const recoveredNote = await noteModel.create(archivedNote.toObject());
        if (recoveredNote) {
            await archiveModel.deleteOne({ _id: noteId });
            response.status(200).json({ message: 'Note recovered successfully' });
        } else {
            response.status(500).json({ message: 'Failed to recover note' });
        }
    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({ error: 'Internal server error' });
    }
});




export default router;
