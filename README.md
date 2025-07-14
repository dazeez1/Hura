# Hura - AI Travel Companion for Rwanda

Hura is an AI-powered travel companion chatbot that helps tourists explore Rwanda with multilingual support (English, Kinyarwanda, French). The application provides cultural guidance, travel planning, and local information through an intelligent chatbot interface.

## Features

### 🗣️ AI Chatbot

- **Multilingual Support**: English, Kinyarwanda, and French
- **Google Gemini AI Integration**: Powered by Google's latest AI model
- **File Upload Support**: Image analysis and processing
- **Real-time Conversations**: Seamless chat experience
- **Cultural Guidance**: Etiquette tips and local customs
- **Travel Planning**: Itineraries and attraction recommendations

### 🔐 Authentication System

- **User Registration & Login**: Secure account creation
- **Role-based Access**: User and Admin roles
- **JWT Authentication**: Secure token-based authentication
- **Password Reset**: Email-based password recovery
- **Session Management**: Automatic session tracking

### 📊 Admin Dashboard

- **Real-time Metrics**: Live chatbot usage statistics
- **Session Tracking**: Monitor active chat sessions
- **User Analytics**: Intent analysis and language detection
- **Performance Metrics**: Response times and accuracy tracking
- **Activity Feed**: Recent user interactions
- **Interactive Charts**: Visual data representation

### 🎨 User Interface

- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean and intuitive interface
- **Real-time Updates**: Live data refresh
- **Accessibility**: Keyboard navigation and screen reader support

## Technology Stack

### Backend

- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Nodemailer** for email notifications
- **Helmet** for security headers

### Frontend

- **Vanilla JavaScript** (no framework dependencies)
- **HTML5** with semantic markup
- **CSS3** with responsive design
- **Chart.js** for data visualization
- **Emoji Mart** for emoji picker
- **Font Awesome** for icons

### AI Integration

- **Google Gemini 1.5 Flash** API
- **Intent Recognition** for user queries
- **Language Detection** for multilingual support
- **Image Analysis** for file uploads

## Project Structure

```
Hura/
├── index.html                 # Landing page
├── backend/                   # Node.js/Express API
│   ├── app.js                # Express app configuration
│   ├── server.js             # Server entry point
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js # Authentication logic
│   │   └── chatController.js # Chatbot metrics & sessions
│   ├── middleware/
│   │   └── auth.js          # JWT & role middleware
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── ChatSession.js   # Chat session tracking
│   │   └── Metrics.js       # Aggregated metrics
│   └── routes/
│       ├── auth.js          # Authentication routes
│       └── chat.js          # Chatbot routes
└── frontend/                # Static frontend
    ├── public/              # Static assets
    └── src/
        ├── html/            # HTML pages
        ├── css/             # Stylesheets
        └── js/              # JavaScript files
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/password-reset` - Initiate password reset
- `POST /api/auth/password-reset/:token` - Complete password reset

### Chatbot

- `POST /api/chat/session/start` - Start chat session
- `POST /api/chat/session/:sessionId/message` - Record message
- `POST /api/chat/session/:sessionId/end` - End chat session

### Admin Dashboard (Protected)

- `GET /api/chat/metrics/realtime` - Real-time metrics
- `GET /api/chat/metrics/historical` - Historical data
- `GET /api/chat/activity` - Recent activity feed

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google Gemini API key

### Backend Setup

1. Navigate to `backend/` directory
2. Install dependencies: `npm install`
3. Create `.env` file with required variables
4. Start development server: `npm run dev`

### Frontend Setup

1. Use Live Server or any static file server
2. Configure backend URL in JavaScript files
3. Ensure CORS is properly configured

### Environment Variables

```env
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5500
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=4000
```

## Usage

### For Users

1. Visit the landing page
2. Click "Start Chatting" to open the chatbot
3. Ask questions about Rwanda travel, culture, or attractions
4. Upload images for analysis (optional)

### For Admins

1. Register/login with admin role
2. Access the dashboard to view real-time metrics
3. Monitor chatbot performance and user interactions
4. View analytics and activity feeds

## Security Features

- **JWT Authentication**: Secure token-based sessions
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access**: Admin-only dashboard access
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Server-side data validation
- **Helmet Security**: HTTP security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
