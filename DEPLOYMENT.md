# Deployment Guide

## 🚀 Production Deployment

### **📋 Prerequisites**
- Node.js 18+ installed on server
- MySQL/PostgreSQL database server
- Domain name configured
- SSL certificate (for HTTPS)
- PM2 process manager (recommended)

### **🌐 Server Setup**

#### **1. Server Configuration**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MySQL (if not installed)
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### **2. Database Setup**
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE automation_assessment;

# Create user
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'strong_password';

# Grant privileges
GRANT ALL PRIVILEGES ON automation_assessment.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;
```

#### **3. Application Deployment**
```bash
# Clone repository
git clone <repository-url> /var/www/automation-assessment
cd /var/www/automation-assessment

# Install dependencies
npm install --production

# Setup environment variables
cp .env.example .env
# Edit .env with production values
```

### **⚙️ Environment Configuration**

#### **Production .env File**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=automation_assessment
DB_USER=appuser
DB_PASSWORD=strong_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=4000
NODE_ENV=production

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### **Security Configuration**
```bash
# Set proper file permissions
sudo chown -R www-data:www-data /var/www/automation-assessment
sudo chmod -R 755 /var/www/automation-assessment

# Create SSL directory
sudo mkdir -p /etc/ssl/certs
# Copy SSL certificates to this directory
```

### **🔧 Nginx Configuration**

#### **Create Nginx Site Config**
```bash
sudo nano /etc/nginx/sites-available/automation-assessment
```

#### **Nginx Configuration File**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/certs/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS for API
        add_header Access-Control-Allow-Origin https://your-domain.com;
        add_header Access-Control-Allow-Methods GET,POST,PUT,DELETE,OPTIONS;
        add_header Access-Control-Allow-Headers Content-Type,Authorization;
        add_header Access-Control-Allow-Credentials true;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/automation-assessment /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **🚀 PM2 Process Management**

#### **Create PM2 Ecosystem File**
```bash
nano ecosystem.config.js
```

#### **ecosystem.config.js**
```javascript
module.exports = {
  apps: [
    {
      name: 'automation-assessment-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/automation-assessment',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'automation-assessment-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/automation-assessment/frontend',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
```

#### **Start Applications with PM2**
```bash
# Create logs directory
mkdir -p logs

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### **🗄️ Database Migration**

#### **Run Production Migrations**
```bash
cd /var/www/automation-assessment

# Run database migrations
node backend/run-migration.js

# Verify migration success
mysql -u appuser -p automation_assessment -e "SHOW TABLES;"
```

#### **Update Existing Users**
```bash
# Update existing users with default values
node backend/update-existing-users.js
```

### **🔒 SSL Certificate Setup**

#### **Let's Encrypt (Free SSL)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### **Custom SSL Certificate**
```bash
# Copy certificates to Nginx directory
sudo cp your-domain.crt /etc/ssl/certs/
sudo cp your-domain.key /etc/ssl/certs/

# Set proper permissions
sudo chmod 600 /etc/ssl/certs/your-domain.key
```

### **📊 Monitoring & Logging**

#### **Setup Log Rotation**
```bash
sudo nano /etc/logrotate.d/automation-assessment
```

#### **Log Rotation Config**
```
/var/www/automation-assessment/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload automation-assessment-backend
        pm2 reload automation-assessment-frontend
    endscript
}
```

#### **Monitor PM2 Processes**
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

### **🔄 CI/CD Pipeline**

#### **GitHub Actions Example**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build frontend
        run: npm run build
        
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/automation-assessment
            git pull origin main
            npm ci --production
            pm2 reload all
```

### **🧪 Deployment Testing**

#### **Pre-Deployment Checklist**
- [ ] Database backup created
- [ ] SSL certificates valid
- [ ] Environment variables configured
- [ ] Nginx configuration tested
- [ ] PM2 processes running
- [ ] All tests passing

#### **Post-Deployment Verification**
```bash
# Check service status
sudo systemctl status nginx
pm2 status

# Test API endpoints
curl -k https://your-domain.com/api/admin/overview

# Check frontend
curl -I https://your-domain.com

# Monitor logs
pm2 logs --lines 50
```

### **🚨 Troubleshooting**

#### **Common Issues**

**Application Won't Start**
```bash
# Check PM2 logs
pm2 logs automation-assessment-backend

# Check port availability
sudo netstat -tlnp | grep :4000

# Check environment variables
pm2 env 0
```

**Database Connection Issues**
```bash
# Test database connection
mysql -u appuser -p -h localhost automation_assessment

# Check MySQL status
sudo systemctl status mysql

# View MySQL logs
sudo tail -f /var/log/mysql/error.log
```

**Nginx Configuration Issues**
```bash
# Test Nginx configuration
sudo nginx -t

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

**SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/your-domain.crt -text -noout

# Test SSL configuration
sudo nginx -t

# Check certificate expiration
sudo certbot certificates
```

### **📈 Performance Optimization**

#### **Database Optimization**
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_feedback_assessment ON feedbacks(assessment_id);
```

#### **Application Caching**
```bash
# Install Redis for caching
sudo apt install redis-server

# Configure Redis in backend
# Add to ecosystem.config.js:
env: {
  REDIS_URL: 'redis://localhost:6379'
}
```

#### **CDN Configuration**
```nginx
# Add CDN for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

### **🔄 Backup Strategy**

#### **Automated Backups**
```bash
# Create backup script
sudo nano /usr/local/bin/backup-app.sh
```

#### **Backup Script**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/automation-assessment"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u appuser -p automation_assessment > $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/automation-assessment

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

#### **Schedule Backups**
```bash
# Add to crontab
sudo crontab -e

# Add: 0 2 * * * /usr/local/bin/backup-app.sh
```

### **📞 Maintenance Procedures**

#### **Regular Maintenance**
- **Daily**: Monitor logs, check disk space, verify backups
- **Weekly**: Update dependencies, review performance metrics
- **Monthly**: Security updates, database optimization, SSL renewal check
- **Quarterly**: Full system audit, performance review

#### **Emergency Procedures**
1. **Service Down**: Check PM2 status, restart if needed
2. **Database Issues**: Switch to backup database, investigate primary
3. **SSL Issues**: Use temporary self-signed certificate, renew proper certificate
4. **High Load**: Scale up instances, enable caching, investigate cause

This deployment guide ensures a robust, secure, and maintainable production environment for the Automation Assessment System.
