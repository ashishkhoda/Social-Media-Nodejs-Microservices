const logger = require('../utils/logger');
const Post = require('../models/Post');
const { validateCreatePost } = require('../utils/validation');
const Redis = require('ioredis');
const { publishEvent } = require('../utils/rabbitmq');

const redisClient = new Redis(process.env.REDIS_URL);

const invalidatePostCache = async (input) => {
    const postId = input.toString();
    await redisClient.del(`post:${postId}`);
    const keys = await redisClient.keys("posts:*");
    if(keys?.length > 0){
        await redisClient.del(keys);
    }
}

const createPost = async (req, res) => {
    logger.info('Creating post for userId: ', req.user.userId);
    try {
        const { error } = validateCreatePost(req.body);
        if(error){
            logger.warn('Validation error: ', error.details[0].message);
            return res.status(400).json({
                status: false,
                message: error.details[0].message
            });
        }
        const { content, mediaIds } = req.body;
        const newPost = new Post({ userId: req.user.userId, content, mediaIds });
        await newPost.save();

        // publishing post created event to rabbitmq
        await publishEvent("post.created", {
            postId: newPost._id.toString(),
            userId: req.user.userId,
            content: newPost.content,
            createdAt: newPost.createdAt,
        });

        logger.info('Post created successfully with userId: ', req.user.userId);
        await invalidatePostCache(newPost._id.toString());
        return res.status(201).json({
            status: true,
            message: 'Post created successfully',
            post: newPost,
        });
    } catch (error) {
        logger.error('Error creating post for userId: ', req.user.userId, error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await redisClient.get(cacheKey);
        if(cachedPosts){
            return res.status(200).json({
                status: true,
                message: 'Posts fetched successfully',
                posts: JSON.parse(cachedPosts),
            });
        }

        const posts = await Post.find({ userId: req.user.userId }).sort({ createdAt: -1 }).skip(startIndex).limit(limit);
        const totalNumberOfPosts = await Post.countDocuments({ userId: req.user.userId });

        const result = {
            status: true,
            message: 'Posts fetched successfully',
            posts: posts,
            currentPage: page,
            totalPages: Math.ceil(totalNumberOfPosts/limit),
            totalPosts: totalNumberOfPosts
        }
        
        await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 60 * 60);

        return res.status(200).json(result);
    } catch (error) {
        logger.error('Error getting all posts for userId: ', req.user.userId, error);
        return res.status(500).json({ status: false, message: 'Internal Server Error', error: error.message });
    }
}

const getPost = async(req, res) => {
    try{
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachedPost = await redisClient.get(cacheKey);

    if (cachedPost !== null && cachedPost !== "null") {
        return res.status(200).json({
          status: true,
          message: "Post fetched successfully",
          post: JSON.parse(cachedPost),
        });
      }

    const post = await Post.findById(postId);
    if(!post){
        return res.status(404).json({ status: false, message: 'Post not found' });
    }

    await redisClient.set(cacheKey, JSON.stringify(post), 'EX', 60 * 60);
    return res.status(200).json({
        status: true,
        message: 'Post fetched successfully',
        post: post,   
    });
    } catch (error) {
        logger.error('Error getting post for postId: ', postId, error);
        return res.status(500).json({ status: false, message: 'Internal Server Error', error: error.message });
    }
}

const deletePost = async(req, res) => {
    try{
        const postId = req.params.id;
        console.log("postId", postId)
        console.log("req.user.userId", req.user.userId)
        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId,
        });
        console.log("post", post)

        // publishing post deleted event to rabbitmq
        await publishEvent("post.deleted", {
            postId: post._id.toString(),
            userId: req.user.userId,
            mediaIds: post.mediaIds,
        });

        // invalidating post cache
        await invalidatePostCache(postId);
        return res.status(200).json({ status: true, message: "Post deleted successfully" });
    } catch (error) {
        logger.error("Error deleting post for postId: ", req.params.id, error);
        return res
        .status(500)
        .json({ status: false, message: "Internal Server Error", error: error.message });
    }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };