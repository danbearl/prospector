# HTTPS/TLS Setup Guide

## Overview

This guide provides multiple options for implementing HTTPS/TLS encryption for the Prospector application, with a focus on automated solutions using Let's Encrypt.

## Table of Contents

1. [Option 1: Traefik with Let's Encrypt (Recommended)](#option-1-traefik-with-lets-encrypt-recommended)
2. [Option 2: Nginx with Certbot](#option-2-nginx-with-certbot)
3. [Option 3: Caddy Server](#option-3-caddy-server)
4. [Option 4: Self-Signed Certificates (Development)](#option-4-self-signed-certificates-development)
5. [Option 5: Cloud Provider Load Balancer](#option-5-cloud-provider-load-balancer)

---

## Option 1: Traefik with Let's Encrypt (Recommended)

**Best for**: Production deployments with automatic certificate management

### Features

✅ **Automatic Certificate Issuance**: Traefik automatically requests certificates from Let's Encrypt  
✅ **Automatic Renewal**: Certificates are renewed automatically before expiration  
✅ **Zero Downtime**: Certificate renewal happens without service interruption  
✅ **HTTP to HTTPS Redirect**: Automatic redirection from HTTP to HTTPS  
✅ **Dashboard**: Built-in monitoring dashboard  
✅ **Docker Integration**: Native Docker label-based configuration  

### Prerequisites

1. **Domain Name**: A registered domain pointing to your server's IP address
2. **Open Ports**: Ports 80 and 443 must be accessible from the internet
3. **Valid Email**: For Let's Encrypt certificate notifications

### Setup Steps

#### 1. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.https.example .env.https
```

Edit `.env.https`:
```bash
# Your domain name
DOMAIN=prospector.yourdomain.com

# Your email for Let's Encrypt notifications
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Strong JWT secret
JWT_SECRET=your-very-long-random-secret-key-here-at-least-32-characters
```

#### 2. Configure DNS

Point your domain to your server's IP address:

**A Record**:
```
prospector.yourdomain.com  →  123.456.789.0
```

Verify DNS propagation:
```bash
nslookup prospector.yourdomain.com
# or
dig prospector.yourdomain.com
```

#### 3. Configure Firewall

Ensure ports 80 and 443 are open:

**Linux (ufw)**:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

**Linux (iptables)**:
```bash
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save
```

**Cloud Providers**: Configure security groups to allow inbound traffic on ports 80 and 443

#### 4. Start the Application

**Linux/Mac**:
```bash
chmod +x start-https.sh
./start-https.sh
```

**Windows**:
```bash
start-https.bat
```

#### 5. Verify HTTPS

1. Wait 1-2 minutes for certificate issuance
2. Visit `https://prospector.yourdomain.com`
3. Check for the padlock icon in your browser
4. Verify certificate details (should show Let's Encrypt)

### Traefik Dashboard

Access the Traefik dashboard at: `http://localhost:8080`

**Features**:
- View active routers and services
- Monitor certificate status
- Check middleware configuration
- View real-time metrics

**Security Note**: The dashboard is exposed on port 8080 without authentication. For production, either:
- Disable the dashboard
- Add authentication
- Restrict access via firewall

### Certificate Management

#### Automatic Renewal

Traefik automatically renews certificates 30 days before expiration. No manual intervention required.

#### Certificate Storage

Certificates are stored in a Docker volume:
```bash
docker volume inspect prospector_letsencrypt-data
```

#### Backup Certificates

```bash
docker run --rm -v prospector_letsencrypt-data:/data -v $(pwd):/backup alpine tar czf /backup/letsencrypt-backup.tar.gz -C /data .
```

#### Restore Certificates

```bash
docker run --rm -v prospector_letsencrypt-data:/data -v $(pwd):/backup alpine tar xzf /backup/letsencrypt-backup.tar.gz -C /data
```

### Testing with Let's Encrypt Staging

To test without hitting rate limits, use the staging environment:

Edit `docker-compose.https.yml` and uncomment:
```yaml
- "--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
```

**Note**: Staging certificates will show as untrusted in browsers but verify the setup works.

### Troubleshooting

#### Certificate Not Issued

**Check Traefik logs**:
```bash
docker-compose -f docker-compose.https.yml logs traefik
```

**Common issues**:
- Domain not pointing to server
- Ports 80/443 blocked by firewall
- Invalid email address
- Rate limit exceeded (use staging)

#### HTTP Still Accessible

This is normal during certificate issuance. HTTP is needed for the ACME challenge. After certificate issuance, HTTP requests are redirected to HTTPS.

#### Certificate Expired

Traefik should auto-renew. If not:
1. Check Traefik logs for errors
2. Verify domain still points to server
3. Restart Traefik: `docker-compose -f docker-compose.https.yml restart traefik`

---

## Option 2: Nginx with Certbot

**Best for**: Traditional Nginx users, more control over configuration

### Features

✅ Automatic certificate issuance with Certbot  
✅ Automatic renewal via cron job  
✅ Full control over Nginx configuration  
✅ Well-documented and widely used  

### Setup

#### 1. Install Certbot

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**CentOS/RHEL**:
```bash
sudo yum install certbot python3-certbot-nginx
```

#### 2. Obtain Certificate

```bash
sudo certbot --nginx -d prospector.yourdomain.com
```

Follow the prompts to:
- Enter email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

#### 3. Update Nginx Configuration

Certbot automatically updates your Nginx configuration. Verify:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. Test Automatic Renewal

```bash
sudo certbot renew --dry-run
```

#### 5. Setup Auto-Renewal

Certbot installs a systemd timer or cron job automatically. Verify:

```bash
sudo systemctl status certbot.timer
# or
sudo crontab -l
```

### Nginx Configuration Example

```nginx
server {
    listen 443 ssl http2;
    server_name prospector.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/prospector.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prospector.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name prospector.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Option 3: Caddy Server

**Best for**: Simplest setup, automatic HTTPS by default

### Features

✅ Automatic HTTPS with zero configuration  
✅ Automatic certificate renewal  
✅ Simple configuration syntax  
✅ Built-in reverse proxy  

### Setup

#### 1. Create Caddyfile

```caddy
prospector.yourdomain.com {
    reverse_proxy /api/* localhost:3001
    reverse_proxy localhost:3000
}
```

#### 2. Run Caddy

```bash
caddy run --config Caddyfile
```

That's it! Caddy automatically:
- Obtains Let's Encrypt certificates
- Configures HTTPS
- Redirects HTTP to HTTPS
- Renews certificates

### Docker Compose with Caddy

```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: prospector-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config
    networks:
      - prospector-network
    restart: unless-stopped

  # ... backend and frontend services ...

volumes:
  caddy-data:
  caddy-config:
```

---

## Option 4: Self-Signed Certificates (Development)

**Best for**: Local development, testing HTTPS without a domain

### Generate Self-Signed Certificate

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout selfsigned.key \
  -out selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Use with Nginx

```nginx
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /path/to/selfsigned.crt;
    ssl_certificate_key /path/to/selfsigned.key;

    # ... rest of configuration ...
}
```

### Browser Warning

Self-signed certificates will show a security warning in browsers. This is expected and safe for development.

**To bypass**:
- Chrome: Type `thisisunsafe` on the warning page
- Firefox: Click "Advanced" → "Accept the Risk and Continue"

---

## Option 5: Cloud Provider Load Balancer

**Best for**: Cloud deployments (AWS, GCP, Azure)

### AWS Application Load Balancer

1. **Create ALB** in AWS Console
2. **Request Certificate** in AWS Certificate Manager (ACM)
3. **Add HTTPS Listener** to ALB with ACM certificate
4. **Configure Target Group** pointing to your EC2 instances
5. **Update Security Groups** to allow traffic from ALB

### Google Cloud Load Balancer

1. **Create Load Balancer** in GCP Console
2. **Create SSL Certificate** (managed or upload)
3. **Configure Backend Service** pointing to your instances
4. **Add Frontend Configuration** with HTTPS

### Azure Application Gateway

1. **Create Application Gateway** in Azure Portal
2. **Add SSL Certificate** (managed or upload)
3. **Configure Backend Pool** with your VMs
4. **Add HTTPS Listener** with certificate

### Benefits

✅ Managed certificate renewal  
✅ DDoS protection  
✅ Load balancing  
✅ Health checks  
✅ Auto-scaling integration  

---

## Security Best Practices

### 1. Use Strong TLS Configuration

**Recommended TLS versions**: TLSv1.2 and TLSv1.3 only

**Nginx**:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;
```

### 2. Enable HSTS

**HTTP Strict Transport Security** forces browsers to use HTTPS:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 3. Add Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### 4. Use OCSP Stapling

Improves SSL/TLS performance:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/prospector.yourdomain.com/chain.pem;
```

### 5. Regular Security Audits

Test your SSL configuration:
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [Security Headers](https://securityheaders.com/)

---

## Monitoring and Maintenance

### Certificate Expiration Monitoring

**Check certificate expiration**:
```bash
echo | openssl s_client -servername prospector.yourdomain.com -connect prospector.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Set up monitoring**:
- Use monitoring tools (Prometheus, Grafana)
- Set up alerts for certificates expiring in < 30 days
- Monitor Traefik/Certbot logs for renewal failures

### Log Monitoring

**Traefik logs**:
```bash
docker-compose -f docker-compose.https.yml logs -f traefik
```

**Check for**:
- Certificate renewal attempts
- ACME challenge failures
- TLS handshake errors

---

## Troubleshooting Common Issues

### Issue: "Too Many Certificates Already Issued"

**Cause**: Let's Encrypt rate limit (5 certificates per domain per week)

**Solution**:
1. Use Let's Encrypt staging for testing
2. Wait for rate limit to reset
3. Use wildcard certificates if possible

### Issue: "Connection Refused" on Port 443

**Cause**: Firewall blocking HTTPS traffic

**Solution**:
```bash
# Check if port is open
sudo netstat -tlnp | grep :443

# Open port in firewall
sudo ufw allow 443/tcp
```

### Issue: "Certificate Verification Failed"

**Cause**: DNS not propagated or pointing to wrong IP

**Solution**:
1. Verify DNS: `nslookup prospector.yourdomain.com`
2. Wait for DNS propagation (up to 48 hours)
3. Clear DNS cache: `sudo systemd-resolve --flush-caches`

### Issue: Mixed Content Warnings

**Cause**: Loading HTTP resources on HTTPS page

**Solution**:
1. Update all resource URLs to use HTTPS
2. Use protocol-relative URLs: `//example.com/resource.js`
3. Add Content Security Policy header

---

## Performance Optimization

### 1. Enable HTTP/2

Already enabled in Traefik and modern Nginx versions.

### 2. Enable Compression

**Nginx**:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. Enable Caching

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. Use CDN

Consider using a CDN (Cloudflare, CloudFront) for:
- DDoS protection
- Global content delivery
- Additional caching layer
- Free SSL certificates

---

## Cost Comparison

| Solution | Cost | Complexity | Auto-Renewal |
|----------|------|------------|--------------|
| Traefik + Let's Encrypt | Free | Medium | Yes |
| Nginx + Certbot | Free | Medium | Yes |
| Caddy | Free | Low | Yes |
| Self-Signed | Free | Low | Manual |
| Cloud Load Balancer | $15-50/mo | Low | Yes |

---

## Recommended Setup

For most users, we recommend **Option 1: Traefik with Let's Encrypt** because:

✅ Fully automated certificate management  
✅ Zero-downtime renewals  
✅ Docker-native integration  
✅ Built-in monitoring dashboard  
✅ No additional software to install  
✅ Production-ready out of the box  

---

## Support

For HTTPS setup issues:
1. Check this documentation
2. Review Traefik/Certbot logs
3. Verify DNS configuration
4. Test with Let's Encrypt staging
5. Check firewall rules
6. Verify domain ownership

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)