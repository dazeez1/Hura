# Hura Production Deployment Instructions

## 🚀 Deployment Summary
- **Frontend URL**: hura-28tbty1lv-damis-projects-8bd6b2ff.vercel.app
- **Backend URL**: hura-28tbty1lv-damis-projects-8bd6b2ff.vercel.app
- **Backup Created**: ../Hura-backup-20250714-100110

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Update `backend/.env.production` with your actual values:
- `MONGODB_URI`: Your production MongoDB connection string
- `JWT_SECRET`: A strong, unique secret key
- `EMAIL_USER`: Your production email address
- `EMAIL_PASS`: Your production email password
- `GEMINI_API_KEY`: Your Google Gemini API key

### 2. Database Setup
- Set up production MongoDB database
- Ensure all indexes are created
- Test database connection

### 3. SSL Certificates
- Obtain SSL certificates for your domains
- Configure HTTPS for both frontend and backend

### 4. Domain Configuration
- Point your domains to your hosting provider
- Configure DNS records
- Set up reverse proxy if needed

## 🏗️ Backend Deployment

### Option 1: Traditional Hosting
```bash
cd backend
npm install --production
cp .env.production .env
npm start
```

### Option 2: Docker
```bash
docker build -t hura-backend .
docker run -p 4000:4000 --env-file .env.production hura-backend
```

### Option 3: Cloud Platforms
- **Heroku**: Push to Heroku with environment variables
- **Vercel**: Deploy as Node.js function
- **Railway**: Connect GitHub repository
- **DigitalOcean**: Use App Platform

## 🌐 Frontend Deployment

### Option 1: Static Hosting
Upload the `frontend/` directory to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

### Option 2: Traditional Hosting
Upload to your web server's public directory

## 🔧 Post-Deployment

1. **Test all functionality**:
   - User registration/login
   - Chatbot functionality
   - Admin dashboard
   - Profile picture upload
   - Password reset

2. **Monitor logs** for any errors

3. **Set up monitoring** (optional):
   - Uptime monitoring
   - Error tracking
   - Performance monitoring

## 🔄 Rollback
If you need to rollback:
```bash
# Restore from backup
cp -r ../Hura-backup-20250714-100110/* .
```

## 📞 Support
If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test database connectivity
4. Check CORS configuration

