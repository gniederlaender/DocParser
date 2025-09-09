# Document Parser Deployment Without Docker

## Overview
Yes, the document parser application will work perfectly without Docker! This guide provides step-by-step instructions for deploying the application directly on your server.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+, CentOS 7+, or similar)
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Disk Space**: 5GB+ free space
- **Network**: Internet access for npm packages and LLM API calls

### Software Dependencies
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For cloning the repository
- **Build tools**: gcc, g++, make (usually pre-installed on Linux)

## Installation Steps

### 1. Install Node.js and npm

#### Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### CentOS/RHEL:
```bash
# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

#### Manual Installation (if needed):
```bash
# Download and install Node.js binary
wget https://nodejs.org/dist/v18.17.1/node-v18.17.1-linux-x64.tar.xz
tar -xf node-v18.17.1-linux-x64.tar.xz
sudo mv node-v18.17.1-linux-x64 /usr/local/node
echo 'export PATH=$PATH:/usr/local/node/bin' >> ~/.bashrc
source ~/.bashrc
```

### 2. Create Application Directory

```bash
# Create application directory
sudo mkdir -p /opt/docparser
sudo chown $USER:$USER /opt/docparser
cd /opt/docparser

# Clone or copy your application code
# If you have the code locally, copy it here
# Or if it's in a git repository:
# git clone <your-repo-url> .
```

### 3. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies
cd ../frontend
npm install

# Build frontend for production
npm run build
```

### 4. Configure Environment

Create the environment configuration file:

```bash
# Backend environment file
cd /opt/docparser/backend
nano .env
```

Add the following configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# File Upload Configuration
UPLOAD_DIR=/opt/docparser/uploads
MAX_FILE_SIZE=10485760

# LLM Configuration
OPENAI_API_KEY=your_openai_api_key_here
LLM_MODEL=gpt-4
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.1

# Security Configuration
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/opt/docparser/logs/app.log
```

### 5. Set Up File System

```bash
# Create necessary directories
sudo mkdir -p /opt/docparser/uploads
sudo mkdir -p /opt/docparser/logs
sudo mkdir -p /opt/docparser/backend/config/prompts

# Set proper permissions
sudo chown -R $USER:$USER /opt/docparser
chmod 755 /opt/docparser/uploads
chmod 755 /opt/docparser/logs

# Create upload cleanup cron job
echo "0 * * * * find /opt/docparser/uploads -name '*' -type f -mmin +60 -delete" | crontab -
```

### 6. Configure Document Types

Create the document types configuration:

```bash
# Create document types config
nano /opt/docparser/backend/src/config/documentTypes.json
```

Add your document types:

```json
{
  "documentTypes": [
    {
      "id": "invoice",
      "name": "Invoice",
      "description": "Extract data from invoices",
      "supportedFormats": ["pdf", "png", "jpg", "jpeg"],
      "maxFileSize": 10485760,
      "promptTemplate": "invoice_prompt.txt"
    },
    {
      "id": "receipt",
      "name": "Receipt",
      "description": "Extract data from receipts",
      "supportedFormats": ["pdf", "png", "jpg", "jpeg"],
      "maxFileSize": 5242880,
      "promptTemplate": "receipt_prompt.txt"
    }
  ]
}
```

### 7. Set Up Process Management

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
nano /opt/docparser/ecosystem.config.js
```

Add PM2 configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'docparser-backend',
      script: '/opt/docparser/backend/dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/opt/docparser/logs/backend-error.log',
      out_file: '/opt/docparser/logs/backend-out.log',
      log_file: '/opt/docparser/logs/backend.log',
      time: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
```

Start the application with PM2:

```bash
cd /opt/docparser
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Option B: Using systemd

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/docparser.service
```

Add the service configuration:

```ini
[Unit]
Description=Document Parser Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/docparser/backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001
StandardOutput=journal
StandardError=journal
SyslogIdentifier=docparser

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable docparser
sudo systemctl start docparser
sudo systemctl status docparser
```

### 8. Configure Web Server (Optional but Recommended)

#### Using Nginx as Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx  # Ubuntu/Debian
# or
sudo yum install nginx  # CentOS/RHEL

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/docparser
```

Add Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /opt/docparser/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads {
        alias /opt/docparser/uploads;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/docparser /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. SSL Configuration (Recommended for Production)

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically update Nginx configuration
```

## Security Considerations

### 1. Firewall Configuration

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### 2. File Upload Security

- Upload directory is outside web root
- File type validation in application code
- Size limits enforced
- Automatic cleanup of old files

### 3. API Security

- Rate limiting configured
- Input validation
- CORS configuration
- Secure headers

## Monitoring and Maintenance

### 1. Log Management

```bash
# View application logs
pm2 logs docparser-backend

# Or with systemd
sudo journalctl -u docparser -f

# Log rotation
sudo nano /etc/logrotate.d/docparser
```

Add log rotation configuration:

```
/opt/docparser/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 your-user your-user
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Health Checks

Add a health check endpoint to your backend:

```javascript
// In your Express app
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 3. Backup Strategy

```bash
# Create backup script
nano /opt/docparser/backup.sh
```

Add backup commands:

```bash
#!/bin/bash
BACKUP_DIR="/opt/docparser/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application code and config
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /opt/docparser .
```

Make it executable and add to cron:

```bash
chmod +x /opt/docparser/backup.sh
echo "0 2 * * * /opt/docparser/backup.sh" | crontab -
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo netstat -tulpn | grep :3001
   sudo kill -9 <PID>
   ```

2. **Permission issues**
   ```bash
   sudo chown -R $USER:$USER /opt/docparser
   ```

3. **Node modules issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Memory issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=1024"
   ```

### Performance Tuning

```bash
# Optimize Node.js for production
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=1024 --optimize-for-size"

# Use PM2 cluster mode for multi-core systems
pm2 start ecosystem.config.js --instances max
```

## Update Procedure

```bash
# Stop the application
pm2 stop docparser-backend

# Backup current version
cp -r /opt/docparser /opt/docparser_backup_$(date +%Y%m%d)

# Update code
cd /opt/docparser
# Copy new code or git pull

# Install dependencies
cd backend && npm install --production
cd ../frontend && npm install && npm run build

# Restart application
pm2 restart docparser-backend
```

This deployment method provides the same functionality as Docker but gives you more control over the server environment and resource management. The application will run efficiently on standard Linux servers without requiring Docker engine. 
