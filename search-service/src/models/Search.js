const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

searchSchema.index({ content: "text" });
searchSchema.index({ createdAt: -1 });

const Search = mongoose.model("search", searchSchema);

module.exports = Search;