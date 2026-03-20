const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (this.isModified('password')){
        try{
            this.password = await argon2.hash(this.password);
        } catch (error) {
            return next(error);
        }
    }
});

userSchema.methods.comparePassword = async function (password) {
    return await argon2.verify(this.password, password);
};

userSchema.index({ username: 'text'});

module.exports = mongoose.model('User', userSchema);