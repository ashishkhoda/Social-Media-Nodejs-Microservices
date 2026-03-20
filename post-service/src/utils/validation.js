const Joi = require('joi');

const validateCreatePost = (data) => {
    const schema = Joi.object({
        content: Joi.string().required(),
        mediaIds: Joi.array().items(Joi.string()).optional(),
    });
    return schema.validate(data);
};


module.exports = { validateCreatePost };