# Complete AWS EC2 Deployment Guide (React + Node.js + Express + MongoDB + Nginx + PM2 + GitHub Actions)

This guide explains the complete deployment process for a MERN-style application where the frontend is built with React (Vite) and the backend is built with Node.js/Express. The project is deployed on an AWS EC2 Ubuntu server with Nginx acting as a reverse proxy, PM2 managing the backend process, and GitHub Actions automatically deploying new code whenever changes are pushed to the main branch.

---

## 1. Create an AWS EC2 Server

Log in to AWS and open the EC2 Dashboard.

Create a new Ubuntu Server (latest LTS version).

Choose an instance type such as t2.micro or t3.micro.

Create a new Key Pair (.pem) and download it. Keep it safe because it is required to connect to the server.

Create a Security Group and allow the following inbound rules.

SSH (22) → Your IP or Anywhere (for testing)

HTTP (80) → Anywhere

HTTPS (443) → Anywhere

After launching the instance, copy the Public IPv4 Address.

Example:

51.20.10.115

Connect from Windows Git Bash.

```bash
cd ~/Downloads

ssh -i NexagenProject.pem ubuntu@51.20.10.115
```

---

## 2. Prepare the Server

Update Ubuntu.

```bash
sudo apt update
sudo apt upgrade -y
```

Install Git.

```bash
sudo apt install git -y
```

Install Node.js.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

sudo apt install nodejs -y
```

Check versions.

```bash
node -v

npm -v
```

Install PM2.

```bash
sudo npm install -g pm2
```

Install Nginx.

```bash
sudo apt install nginx -y
```

Enable Nginx.

```bash
sudo systemctl enable nginx

sudo systemctl start nginx
```

Check Nginx.

```bash
sudo systemctl status nginx
```

---

## 3. Clone the GitHub Repository

Clone the project.

```bash
git clone https://github.com/USERNAME/Schedule_Ease.git
```

Move inside the project.

```bash
cd Schedule_Ease
```

---

## 4. Configure Environment Variables

Frontend (.env)

```text
VITE_API_URL=/api
```

Backend (.env)

```text
PORT=5001
HOST=0.0.0.0

MONGO_URI=YOUR_MONGODB_URI

JWT_SECRET=YOUR_SECRET

FRONTEND_URL=http://51.20.10.115

EMAIL=example@gmail.com

EMAIL_PASSWORD=APP_PASSWORD
```

Never commit .env files to GitHub.

---

## 5. Install Dependencies

Frontend

```bash
cd frontend

npm install
```

Backend

```bash
cd ../my-backend

npm install
```

---

## 6. Build React

```bash
cd frontend

npm run build
```

The build folder will be:

```text
frontend/dist
```

---

## 7. Deploy React Using Nginx

Remove old files.

```bash
sudo rm -rf /var/www/html/*
```

Copy build.

```bash
sudo cp -r dist/* /var/www/html/
```

Restart Nginx.

```bash
sudo systemctl restart nginx
```

Visit

```text
http://YOUR_PUBLIC_IP
```

You should now see the React application.

---

## 8. Start Backend Using PM2

Move to backend.

```bash
cd ~/Schedule_Ease/my-backend
```

Start server.

```bash
pm2 start server.js --name server
```

Save PM2.

```bash
pm2 save
```

Enable startup.

```bash
pm2 startup
```

Run the command printed by PM2.

Restart.

```bash
pm2 restart server
```

Useful PM2 commands.

```bash
pm2 list

pm2 logs server

pm2 restart server

pm2 stop server

pm2 delete server
```

---

## 9. Configure Nginx Reverse Proxy

Edit configuration.

```bash
sudo nano /etc/nginx/sites-available/default
```

Example.

```nginx
server {

    listen 80;

    server_name _;

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
```

Save.

Check syntax.

```bash
sudo nginx -t
```

Restart.

```bash
sudo systemctl restart nginx
```

---

## 10. Configure CORS

Your backend must allow the frontend origin.

Example.

```javascript
const allowedOrigins = [

"http://localhost:5173",

"http://51.20.10.115",

"https://yourdomain.com"

];
```

If using Vercel.

```text
FRONTEND_URL=https://your-project.vercel.app
```

Restart backend.

```bash
pm2 restart server
```

---

## 11. GitHub Secrets

Open GitHub.

Settings

Secrets and Variables

Actions

Create.

```text
EC2_HOST

EC2_USER

EC2_SSH_KEY
```

Example.

```text
EC2_HOST=51.20.10.115

EC2_USER=ubuntu

EC2_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

---

## 12. GitHub Actions Workflow

Place deploy.yml inside

```text
.github/workflows/deploy.yml
```

Workflow steps.

• Checkout repository

• Install Node

• Install frontend dependencies

• Build frontend

• Install backend dependencies

• Connect to EC2

• Pull latest code

• Install packages

• Build frontend

• Copy React build to Nginx

• Restart PM2

• Restart Nginx

Whenever code is pushed to the main branch, GitHub automatically deploys the latest version.

---

## 13. Verify Deployment

On EC2.

Latest commit.

```bash
git log --oneline -1
```

Repository status.

```bash
git status
```

PM2.

```bash
pm2 list
```

Nginx.

```bash
sudo systemctl status nginx
```

Backend logs.

```bash
pm2 logs server
```

Application.

```text
http://YOUR_PUBLIC_IP
```

---

## 14. Common Errors

SSH Timeout

Check Security Group.

Ensure port 22 is open.

Verify EC2 public IP.

Verify EC2_HOST secret.

---

Permission Denied

Wrong private key.

Wrong username.

Ubuntu username should normally be

```text
ubuntu
```

---

CORS Not Allowed

Frontend URL not added.

Restart backend.

```bash
pm2 restart server
```

---

500 Internal Server Error

Check logs.

```bash
pm2 logs server
```

Verify MongoDB.

Verify JWT Secret.

Verify environment variables.

---

Git Pull Fails

Check repository status.

```bash
git status
```

Reset changes if necessary.

```bash
git reset --hard HEAD

git clean -fd

git pull origin main
```

---

Nginx Not Loading React

Build again.

```bash
npm run build
```

Copy build again.

```bash
sudo cp -r dist/* /var/www/html/
```

Restart.

```bash
sudo systemctl restart nginx
```

---

PM2 Not Running

```bash
pm2 restart server

pm2 logs server
```

---

## 15. Deployment Checklist

✓ EC2 running

✓ Security Groups configured

✓ SSH working

✓ Git installed

✓ Node.js installed

✓ PM2 installed

✓ Nginx installed

✓ MongoDB connected

✓ Backend .env configured

✓ Frontend .env configured

✓ React build successful

✓ Build copied to /var/www/html

✓ PM2 server online

✓ Nginx running

✓ GitHub Secrets configured

✓ GitHub Actions successful

✓ Latest commit available on EC2

✓ Website accessible from browser

Following this process ensures that every push to the main branch updates the latest code on your EC2 server automatically, restarts the backend with PM2, rebuilds the React frontend, and serves the updated application through Nginx.
