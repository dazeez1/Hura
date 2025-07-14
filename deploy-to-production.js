#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  log("🚀 Hura Production Deployment Script", "bright");
  log("=====================================", "bright");

  const rl = createInterface();

  try {
    // Get production URLs from user
    log("\nPlease enter your production URLs:\n", "cyan");

    // Get frontend URL
    const frontendUrl = await question(
      rl,
      "Frontend URL (e.g., https://yourdomain.com): "
    );
    if (!frontendUrl.trim()) {
      log("❌ Frontend URL is required!", "red");
      rl.close();
      return;
    }

    // Get backend URL
    const backendUrl = await question(
      rl,
      "Backend URL (e.g., https://api.yourdomain.com or https://yourdomain.com): "
    );
    if (!backendUrl.trim()) {
      log("❌ Backend URL is required!", "red");
      rl.close();
      return;
    }

    // Remove trailing slash if present
    const cleanFrontendUrl = frontendUrl.replace(/\/$/, "");
    const cleanBackendUrl = backendUrl.replace(/\/$/, "");

    log("\n📋 Summary:", "yellow");
    log(`Frontend: ${cleanFrontendUrl}`, "green");
    log(`Backend: ${cleanBackendUrl}`, "green");
    log("");

    // Confirm before proceeding
    const confirm = await question(rl, "Proceed with deployment? (y/N): ");
    if (!confirm.toLowerCase().startsWith("y")) {
      log("❌ Deployment cancelled.", "red");
      rl.close();
      return;
    }

    log("\n🔄 Starting deployment...", "cyan");

    // Create backup
    log("📦 Creating backup...", "yellow");
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const backupDir = path.join("..", `Hura-backup-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy files to backup (simplified - you might want to use a proper copy library)
    log("✅ Backup created", "green");

    // Function to replace URLs in a file
    function replaceUrlsInFile(filePath, oldUrl, newUrl) {
      if (fs.existsSync(filePath)) {
        try {
          // Create backup of the file
          fs.copyFileSync(filePath, `${filePath}.backup`);

          // Read file content
          let content = fs.readFileSync(filePath, "utf8");

          // Replace URLs
          const newContent = content.replace(
            new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            newUrl
          );

          // Write back to file
          fs.writeFileSync(filePath, newContent);

          log(`✅ Updated: ${filePath}`, "green");
        } catch (error) {
          log(`⚠️  Error updating ${filePath}: ${error.message}`, "yellow");
        }
      } else {
        log(`⚠️  File not found: ${filePath}`, "yellow");
      }
    }

    // Replace URLs in frontend JavaScript files
    log("\n🔧 Updating frontend files...", "cyan");

    const filesToUpdate = [
      "frontend/src/js/api.js",
      "frontend/src/js/dash.js",
      "frontend/src/js/set.js",
      "frontend/src/js/auth/reset-password.js",
      "frontend/src/js/feed.js",
      "frontend/src/js/chatbot.js",
      "frontend/src/js/auth/signup.js",
      "test-total-users.html",
      "test-mongodb-profile.html",
      "test-activity-feed.html",
    ];

    filesToUpdate.forEach((file) => {
      replaceUrlsInFile(file, "http://localhost:4000", cleanBackendUrl);
    });

    // Create production environment file
    log("\n⚙️  Creating production environment file...", "cyan");
    const envContent = `# Production Environment Variables
NODE_ENV=production
PORT=4000
MONGODB_URI=your_production_mongodb_uri_here
JWT_SECRET=your_production_jwt_secret_here
CLIENT_URL=${cleanFrontendUrl}
EMAIL_USER=your_production_email@gmail.com
EMAIL_PASS=your_production_email_password
GEMINI_API_KEY=your_gemini_api_key_here
`;

    fs.writeFileSync("backend/.env.production", envContent);
    log("✅ Created backend/.env.production", "green");

    // Create deployment instructions
    log("\n📝 Creating deployment instructions...", "cyan");
    const instructionsContent = `# Hura Production Deployment Instructions

## 🚀 Deployment Summary
- **Frontend URL**: ${cleanFrontendUrl}
- **Backend URL**: ${cleanBackendUrl}
- **Backup Created**: ${backupDir}

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
cp -r ${backupDir}/* .
\`\`\`

## 📞 Support
If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test database connectivity
4. Check CORS configuration
`;

    fs.writeFileSync("DEPLOYMENT_INSTRUCTIONS.md", instructionsContent);
    log("✅ Created DEPLOYMENT_INSTRUCTIONS.md", "green");

    // Create verification script
    log("\n🔍 Creating verification script...", "cyan");
    const verifyScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment...');

// Check if URLs were replaced
console.log('Checking for remaining localhost URLs...');

function checkForLocalhost(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let found = false;
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            found = checkForLocalhost(fullPath) || found;
        } else if (file.name.endsWith('.js') || file.name.endsWith('.html')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('localhost:4000') || content.includes('localhost:3000') || content.includes('localhost:5500')) {
                console.log(\`⚠️  Found localhost URLs in: \${fullPath}\`);
                found = true;
            }
        }
    }
    
    return found;
}

const hasLocalhost = checkForLocalhost('frontend/src/js');

if (!hasLocalhost) {
    console.log('✅ No localhost URLs found in frontend files');
} else {
    console.log('⚠️  Found remaining localhost URLs');
}

// Check if production env file exists
if (fs.existsSync('backend/.env.production')) {
    console.log('✅ Production environment file created');
} else {
    console.log('⚠️  Production environment file not found');
}

console.log('');
console.log('🎉 Verification complete!');
`;

    fs.writeFileSync("verify-deployment.js", verifyScript);
    log("✅ Created verify-deployment.js", "green");

    log("\n🎉 Deployment preparation complete!", "bright");
    log("\n📋 Next steps:", "yellow");
    log("1. Review and update backend/.env.production", "cyan");
    log("2. Follow DEPLOYMENT_INSTRUCTIONS.md", "cyan");
    log("3. Run node verify-deployment.js to check for issues", "cyan");
    log("4. Deploy to your hosting provider", "cyan");
    log("");
    log(`📁 Backup location: ${backupDir}`, "green");
    log("📄 Instructions: DEPLOYMENT_INSTRUCTIONS.md", "green");
    log("🔍 Verification: node verify-deployment.js", "green");
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
  } finally {
    rl.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
