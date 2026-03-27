# Social Media Node.js Microservices

## Overview
This project is a microservices-based social media backend that supports user authentication, post management, media uploads, and post search. Services communicate through RabbitMQ events and share common infrastructure like MongoDB, Redis, and JWT-based auth via an API gateway.

## Features
- Authentication (Identity Service): user registration/login, JWT access + refresh token flow, refresh-token rotation, logout, and rate limiting for sensitive endpoints.
- Post Management (Post Service): create posts (with optional `mediaIds`), fetch paginated posts, fetch a single post by ID (cached), and delete user-owned posts; includes Redis caching and invalidation.
- Media Upload (Media Service): upload to Cloudinary (multipart upload), list user media, and delete Cloudinary assets when related posts are deleted via events.
- Search (Search Service): full-text search using MongoDB `$text`, with a dedicated search collection updated asynchronously from post events.
- Event-Driven Collaboration (RabbitMQ): the Post Service publishes `post.created` / `post.deleted` events; Search Service and Media Service consume them to stay in sync.

## Tech Stack
- Backend: Node.js + Express (microservices)
- API Gateway: Express proxy + JWT validation
- Database: MongoDB (Mongoose)
- Caching / Rate limiting: Redis
- Messaging: RabbitMQ
- Media storage: Cloudinary
- Auth: JWT access token + refresh tokens

## Architecture
API Gateway
  -> Identity Service (register/login/refresh/logout)
  -> Post Service (CRUD + publish events)
  -> Media Service (Cloudinary upload + delete on post deletion)
  -> Search Service (MongoDB full-text search index)

## Base URL (Local)
`http://localhost:3000`

Protected routes require:
- `Authorization: Bearer <JWT_ACCESS_TOKEN>`

## API Routes
Auth (API Gateway)
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh-token`
- `POST /v1/auth/logout`

Posts (API Gateway)
- `POST /v1/posts/create-post`
- `GET /v1/posts/all-posts?page=1&limit=10`
- `GET /v1/posts/:id`
- `DELETE /v1/posts/:id`

Create post body (`POST /v1/posts/create-post`)
- `content` (string, required)
- `mediaIds` (string array, optional)

Media (API Gateway)
- `POST /v1/media/upload` (multipart/form-data, field name: `file`)
- `GET /v1/media/get`

Search (API Gateway)
- `GET /v1/search/posts?query=<text>`

## Local Setup (Recommended)

### 1. Prerequisites
- Node.js 20+
- MongoDB (Atlas or local)
- Redis (for caching + rate limiting)
- RabbitMQ (for events)
- Cloudinary account (for media uploads)

### 2. Configure environment variables
Create/update the `.env` file inside each service directory:

`api-gateway/.env`
- `PORT`
- `IDENTITY_SERVICE_URL`
- `POST_SERVICE_URL`
- `MEDIA_SERVICE_URL`
- `SEARCH_SERVICE_URL`
- `REDIS_URL`
- `JWT_SECRET`

`identity-service/.env`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV`
- `REDIS_URL`

`post-service/.env`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV`
- `REDIS_URL`
- `RABBITMQ_URL`

`media-service/.env`
- `PORT`
- `MONGODB_URI`
- `NODE_ENV`
- `RABBITMQ_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

`search-service/.env`
- `PORT`
- `MONGODB_URI`
- `NODE_ENV`
- `REDIS_URL`
- `RABBITMQ_URL`

### 3. Run services
Start Redis and RabbitMQ (or use Docker Compose for them).

Then run each service in a separate terminal:
- `cd api-gateway && npm install && npm run dev`
- `cd identity-service && npm install && npm run dev`
- `cd post-service && npm install && npm run dev`
- `cd media-service && npm install && npm run dev`
- `cd search-service && npm install && npm run dev`

### 4. Docker Compose (Optional)
From repo root:
- `docker-compose up --build`

Notes:
- This starts Redis + RabbitMQ containers along with your Node services.
- You must ensure your `.env` files point to a reachable MongoDB and include valid Cloudinary credentials.

## Notes
- The API Gateway validates JWT and forwards the authenticated user id to other services via `x-user-id`.
- Post caching is invalidated when a post is created or deleted, and search indexing is updated via RabbitMQ events.