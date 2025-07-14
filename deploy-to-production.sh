#!/bin/bash

# Hura Production Deployment Script
# This script replaces all localhost URLs with production URLs

echo "🚀 Hura Production Deployment Script"
echo "====================================="

# Get production URLs from user
echo ""
echo "Please enter your production URLs:"
echo ""

# Get frontend URL
read -p "Frontend URL (e.g., https://yourdomain.com): " FRONTEND_URL
if [ -z "$FRONTEND_URL" ]; then
    echo "❌ Frontend URL is required!"
    exit 1
fi

# Get backend URL
read -p "Backend URL (e.g., https://api.yourdomain.com or https://yourdomain.com): " BACKEND_URL
if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend URL is required!"
    exit 1
fi

# Remove trailing slash if present
FRONTEND_URL=${FRONTEND_URL%/}
BACKEND_URL=${BACKEND_URL%/}

echo ""
echo "📋 Summary:"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo ""

# Confirm before proceeding
read -p "Proceed with deployment? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo ""
echo "🔄 Starting deployment..."

# Create backup
echo "📦 Creating backup..."
cp -r . ../Hura-backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created"

# Function to replace URLs in a file
replace_urls() {
    local file=$1
    local old_url=$2
    local new_url=$3
    
    if [ -f "$file" ]; then
        # Create backup of the file
        cp "$file" "$file.backup"
        
        # Replace URLs
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|$old_url|$new_url|g" "$file"
        else
            # Linux
            sed -i "s|$old_url|$new_url|g" "$file"
        fi
        
        echo "✅ Updated: $file"
    else
        echo "⚠️  File not found: $file"
    fi
}

# Replace URLs in frontend JavaScript files
echo ""
echo "🔧 Updating frontend files..."

# API.js
replace_urls "frontend/src/js/api.js" "http://localhost:4000" "$BACKEND_URL"

# Dashboard
replace_urls "frontend/src/js/dash.js" "http://localhost:4000" "$BACKEND_URL"

# Settings
replace_urls "frontend/src/js/set.js" "http://localhost:4000" "$BACKEND_URL"

# Auth - Reset Password
replace_urls "frontend/src/js/auth/reset-password.js" "http://localhost:4000" "$BACKEND_URL"

# Feed
replace_urls "frontend/src/js/feed.js" "http://localhost:4000" "$BACKEND_URL"

# Chatbot
replace_urls "frontend/src/js/chatbot.js" "http://localhost:4000" "$BACKEND_URL"

# Auth - Signup
replace_urls "frontend/src/js/auth/signup.js" "http://localhost:4000" "$BACKEND_URL"

# Test files (optional - comment out if you want to keep them for development)
echo ""
echo "🧪 Updating test files..."
replace_urls "test-total-users.html" "http://localhost:4000" "$BACKEND_URL"
replace_urls "test-mongodb-profile.html" "http://localhost:4000" "$BACKEND_URL"
replace_urls "test-activity-feed.html" "http://localhost:4000" "$BACKEND_URL"

# Create production environment file
echo ""
echo "⚙️  Creating production environment file..."
cat > backend/.env.production << EOF
# Production Environment Variables
NODE_ENV=production
PORT=4000
MONGODB_URI=your_production_mongodb_uri_here
JWT_SECRET=your_production_jwt_secret_here
CLIENT_URL=$FRONTEND_URL
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASS=your_production_email_password
GEMINI_API_KEY=your_gemini_api_key_here
EOF

echo "✅ Created backend/.env.production"

# Create deployment instructions
echo ""
echo "📝 Creating deployment instructions..."
cat > DEPLOYMENT_INSTRUCTIONS.md << EOF
# Hura Production Deployment Instructions

## 🚀 Deployment Summary
- **Frontend URL**: $FRONTEND_URL
- **Backend URL**: $BACKEND_URL
- **Backup Created**: ../Hura-backup-$(date +%Y%m%d-%H%M%S)

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Update \`backend/.env.production\` with your actual values:
- \`MONGODB_URI\`: Your production MongoDB connection string
- \`JWT_SECRET\`: A strong, unique secret key
- \`EMAIL_USER\`: Your production email address
- \`EMAIL_PASS\`: Your production email password
- \`GEMINI_API_KEY\`: Your Google Gemini API key

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
\`\`\`bash
cd backend
npm install --production
cp .env.production .env
npm start
\`\`\`

### Option 2: Docker
\`\`\`bash
docker build -t hura-backend .
docker run -p 4000:4000 --env-file .env.production hura-backend
\`\`\`

### Option 3: Cloud Platforms
- **Heroku**: Push to Heroku with environment variables
- **Vercel**: Deploy as Node.js function
- **Railway**: Connect GitHub repository
- **DigitalOcean**: Use App Platform

## 🌐 Frontend Deployment

### Option 1: Static Hosting
Upload the \`frontend/\` directory to:
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
\`\`\`bash
# Restore from backup
cp -r ../Hura-backup-$(date +%Y%m%d-%H%M%S)/* .
\`\`\`

## 📞 Support
If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test database connectivity
4. Check CORS configuration

EOF

echo "✅ Created DEPLOYMENT_INSTRUCTIONS.md"

# Create a quick verification script
echo ""
echo "🔍 Creating verification script..."
cat > verify-deployment.sh << 'EOF'
#!/bin/bash

echo "🔍 Verifying deployment..."

# Check if URLs were replaced
echo "Checking for remaining localhost URLs..."

# Find any remaining localhost URLs
remaining_urls=$(grep -r "localhost:4000" frontend/src/js/ 2>/dev/null || true)
remaining_urls+=$(grep -r "localhost:3000" frontend/src/js/ 2>/dev/null || true)
remaining_urls+=$(grep -r "localhost:5500" frontend/src/js/ 2>/dev/null || true)

if [ -z "$remaining_urls" ]; then
    echo "✅ No localhost URLs found in frontend files"
else
    echo "⚠️  Found remaining localhost URLs:"
    echo "$remaining_urls"
fi

# Check if backup was created
if [ -d "../Hura-backup-"* ]; then
    echo "✅ Backup directory exists"
else
    echo "⚠️  No backup directory found"
fi

# Check if production env file exists
if [ -f "backend/.env.production" ]; then
    echo "✅ Production environment file created"
else
    echo "⚠️  Production environment file not found"
fi

echo ""
echo "🎉 Verification complete!"
EOF

chmod +x verify-deployment.sh
echo "✅ Created verify-deployment.sh"

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review and update backend/.env.production"
echo "2. Follow DEPLOYMENT_INSTRUCTIONS.md"
echo "3. Run ./verify-deployment.sh to check for issues"
echo "4. Deploy to your hosting provider"
echo ""
echo "📁 Backup location: ../Hura-backup-$(date +%Y%m%d-%H%M%S)"
echo "📄 Instructions: DEPLOYMENT_INSTRUCTIONS.md"
echo "🔍 Verification: ./verify-deployment.sh" 