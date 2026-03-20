const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    mediaIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
        required: false,
        default: [],
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);