# Hura Backend

This backend is built with Node.js, Express, and MongoDB, following best practices for security, scalability, and maintainability.

## Folder Structure

```
backend/
  ├── controllers/        # Route handler logic (auth, users, etc.)
  ├── middleware/         # Auth, role, and error handling middleware
  ├── models/             # Mongoose models (User, PasswordReset, etc.)
  ├── routes/             # Express route definitions (auth, users, etc.)
  ├── utils/              # Utility functions (email, token, etc.)
  ├── config/             # Configuration (db connection, env)
  ├── .env                # Environment variables (not committed)
  ├── app.js              # Express app setup
  ├── server.js           # Entry point
  ├── package.json        # Dependencies and scripts
  └── README.md           # Project documentation
```

## Dependencies

| Package           | Purpose/Usage                       | Docs Link                                                    |
| ----------------- | ----------------------------------- | ------------------------------------------------------------ |
| express           | Web framework for Node.js           | [express](https://expressjs.com/)                            |
| mongoose          | MongoDB object modeling             | [mongoose](https://mongoosejs.com/)                          |
| bcryptjs          | Password hashing                    | [bcryptjs](https://www.npmjs.com/package/bcryptjs)           |
| jsonwebtoken      | JWT authentication                  | [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)   |
| dotenv            | Environment variable management     | [dotenv](https://www.npmjs.com/package/dotenv)               |
| cors              | Cross-Origin Resource Sharing       | [cors](https://www.npmjs.com/package/cors)                   |
| express-validator | Input validation                    | [express-validator](https://express-validator.github.io/)    |
| nodemailer        | Sending password reset emails       | [nodemailer](https://nodemailer.com/about/)                  |
| cookie-parser     | Parse cookies (for sessions/tokens) | [cookie-parser](https://www.npmjs.com/package/cookie-parser) |
| morgan            | HTTP request logging (dev)          | [morgan](https://www.npmjs.com/package/morgan)               |
| helmet            | Security headers                    | [helmet](https://www.npmjs.com/package/helmet)               |

### Dev Dependencies

| Package | Purpose/Usage           | Docs Link                      |
| ------- | ----------------------- | ------------------------------ |
| nodemon | Auto-restart dev server | [nodemon](https://nodemon.io/) |
| eslint  | Linting and code style  | [eslint](https://eslint.org/)  |

## Setup Instructions

1. Clone the repository and navigate to the `backend` directory.
2. Run `npm install` to install dependencies (after package.json is created).
3. Create a `.env` file based on `.env.example` (to be provided).
4. Start the development server with `npm run dev`.
5. Ensure MongoDB is running and accessible via the connection string in `.env`.

---

This README will be updated as new features and dependencies are added.
