# ============================================================
# SETUP HTTPS ON AWS EC2 (NO DOMAIN - SELF-SIGNED CERT)
# Run each block one by one on your EC2 terminal
# Server IP: 51.20.10.115
# ============================================================

# === STEP 1: Generate self-signed SSL certificate ===

sudo mkdir -p /etc/ssl/private /etc/ssl/certs

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj "/CN=51.20.10.115"

# === STEP 2: Back up current Nginx config ===

sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# === STEP 3: Write new Nginx config with HTTPS ===

sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINXCONFIG'
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    # Redirect page requests to HTTPS (camera/mic need secure context)
    location / {
        return 301 https://$host$request_uri;
    }

    # IMPORTANT: Proxy API on HTTP directly (no redirect).
    # If we redirect HTTP->HTTPS, the browser sees different origins
    # and blocks the request with CORS error.
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
NGINXCONFIG

# === STEP 4: Test Nginx config ===

sudo nginx -t

# If you see "test is successful", proceed.

# === STEP 5: Restart Nginx ===

sudo systemctl restart nginx

# === STEP 6: Update FRONTEND_URL in backend .env ===

# SSH into EC2, then:
cd ~/Schedule_Ease/my-backend
sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://51.20.10.115|' .env

# === STEP 7: Restart backend ===

pm2 restart server

# === STEP 8: Rebuild and redeploy frontend (so Vite uses HTTPS URLs) ===

cd ~/Schedule_Ease/frontend
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx

# === STEP 9: Verify ===

echo ""
echo "===================================="
echo "HTTPS setup complete!"
echo "Open https://51.20.10.115 in your browser"
echo "(You'll see a warning about self-signed cert - click Advanced > Proceed)"
echo "===================================="
echo ""
echo "To check PM2 logs:"
echo "  pm2 logs server"
echo ""
echo "To check Nginx status:"
echo "  sudo systemctl status nginx"
echo ""
