# Narratopia — Backend - *IN PROGRESS*

This is the backend API powering **Narratopia**, a modern, sleek, AI-friendly writing platform built for authors, worldbuilders, and storytellers.  
Built with Node.js, Express, and MongoDB, it provides authentication, data models for projects and codex entries, writing statistics, and a foundation for future AI-assisted creativity.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Adelaice7/narratopia-backend.git
cd narratopia-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a .env File

```bash
PORT=5000
MONGODB_URI=mongodb://root:example@localhost:27017/narratopia-db?authSource=admin
JWT_SECRET=yourSuperSecretTokenKey
NODE_ENV=development
```

## Running the Server

```bash
node index.js
```

Or for hot reload during dev:

```bash
npx nodemon index.js
```

API will be running at: http://localhost:5000/api

---

## 📚 API Routes

### 🔐 Auth (`/api/auth`)
- `POST /register` - Register a new user   
- `POST /login` - Authenticate and get token    
- `GET /user` - Get current user info    
- `PUT /user` - Update user profile    
- `PUT /password` - Change password

### 📁 Projects (`/api/projects`)

- CRUD for writing projects (title, description, goals)    

### ✍️ Chapters (`/api/chapters`)

- Scene-based writing structure with content and word count   

### 📖 Codex (`/api/codex`)

- Manage characters, locations, items, events, concepts

### 🔗 Relationships (`/api/relationships`)

- Define connections between Codex entries

### 📊 Stats (`/api/stats`)

- Track writing activity, goals, and sessions

---

## Tech Stack

- 🧠 Node.js + Express
    
- 🗃️ MongoDB + Mongoose
    
- 🔐 JWT Auth
    
- 🛡️ Helmet + CORS + morgan
    
- 🧪 Postman-ready routes

---

## 📦 Folder Structure

```bash

`server/ ├── config/           # DB connection ├── controllers/      # Route logic ├── models/           # Mongoose schemas ├── routes/           # API endpoints ├── middleware/       # Auth middleware ├── utils/            # Helpers └── index.js          # Entry point`
```

---

## 📎 Related Projects

- [Narratopia Frontend](https://github.com/Adelaice7/narratopia-frontend)
