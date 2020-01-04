const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        trim: true,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    /**
     * Create a relationship between a user and tasks. This will
     * make it possible to know which tasks a user created. To set
     * up the relationship, both the user and task model will be changed.
     * First up, a new field needs to be added onto the task.
     * This will store the ID of the user who created it. See user model for 
     * userSchema.virtual('tasks' ...
     */
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
},  {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task