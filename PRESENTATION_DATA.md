# CCN Project Presentation — NexGen (Schedule Ease)
## Computer Communication Networks — 6 Slides Data

---

## THEME & COLORS

### Color Palette (Warm Professional Orange-Cream Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| Accent (Primary) | `#FC6C26` | Headings, buttons, highlights, icons |
| Accent Dark | `#E05A1A` | Button hover, active states |
| Background | `#FFF4D6` | Slide backgrounds (warm cream) |
| Card Surface | `#FFFFFF` | Content cards, boxes |
| Border | `#E8DCC0` | Card borders, dividers |
| Text Primary | `#1A1A1A` | Main body text |
| Text Secondary | `#4A4A4A` | Subheadings, descriptions |
| Text Muted | `#8A8A8A` | Labels, secondary info |
| Brown Label | `#92694A` | Category tags, labels |
| Success Green | `#2D7D52` | Status indicators |

### Font
- **Family:** Inter (sans-serif)
- **Headings:** Bold/Extra Bold, Accent color `#FC6C26`
- **Body:** Regular, Dark `#1A1A1A`
- **Subtext:** Medium/Regular, `#4A4A4A`

### Design Style
- Clean, minimal, professional
- Warm tones for approachability
- Orange accent for call-to-action focus
- Cards with subtle borders `#E8DCC0`
- Rounded corners (10px-12px cards)
- Subtle shadows for depth

---

## SLIDE 1 — TITLE SLIDE

### Title
**NexGen — Schedule Ease**

### Subtitle
A Full-Stack Meeting Scheduling & WebRTC Video Conferencing Platform

### Tagline
*Bridging Computer Communication Networks to Real-World Scheduling*

### Bottom Info
**CCN Project** | **Muhammad Abuhurairah** | **2026**

### Visual Notes
- Logo / app mockup centered
- Orange accent title
- Background: gradient from `#FFF4D6` to `#FFE8C8`
- Decorative network nodes graphic or 3D mesh (like the project's AnimatedBg)

---

## SLIDE 2 — PROJECT OVERVIEW & USE CASE

### Title
What is NexGen?

### Use Case (Left Column)
**The Problem:**
- Professionals (consultants, coaches, doctors) need a simple way to offer time slots
- Users struggle to find available slots without back-and-forth emails
- Video meetings require separate platform links

**The Solution — NexGen:**
- Hosts define their weekly availability (days, time ranges, buffer times)
- Users browse hosts, view available slots, and book instantly
- Upon confirmation, a secure WebRTC video room auto-generates
- Participants join for real-time P2P video calls with integrated chat

### Networking Relevance (Right Column / Callout Box)
**Three core CCN domains converge in one platform:**
1. WebRTC P2P → Transport & Application Layer
2. Socket.io WebSockets → Session Layer
3. HTTPS / DNS / Nginx → Network & Security Layers

### Tech Stack Summary Box
| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas) |
| Real-time | Socket.io + WebRTC |
| Auth | JWT + Google OAuth |
| Deployment | AWS EC2 + Nginx + PM2 |

---

## SLIDE 3 — WebRTC & PEER-TO-PEER COMMUNICATION

### Title
WebRTC: Real-Time P2P Video Communication

### OSI Layer Reference
**Application Layer** (L7) + **Transport Layer** (L4)

### How it works in NexGen (Flow Diagram Text)

```
[User A (Browser)]          [User B (Browser)]
       |                            |
       |--- WebRTC Offer  -------->|
       |<-- WebRTC Answer ---------|
       |--- ICE Candidates ------->|
       |<-- ICE Candidates --------|
       |                            |
       |===== P2P Media Stream ====>|  ← Direct peer-to-peer
       |<==== P2P Media Stream =====|     UDP/RTP connection
```

### Key CCN Concepts Demonstrated
| Concept | Implementation |
|---------|---------------|
| **P2P Architecture** | Direct browser-to-browser media via `RTCPeerConnection` |
| **NAT Traversal** | STUN server `stun:stun.l.google.com:19302` for discovering public IP/port |
| **ICE Framework** | Interactive Connectivity Establishment — candidates exchanged via Socket.io signaling |
| **SDP Protocol** | Session Description Protocol for media capabilities negotiation |
| **Media Constraints** | Echo cancellation, noise suppression, auto gain control, resolution/bitrate |
| **Connection Quality** | Monitored via `connectionState` (good/fair/poor) |

### Code Reference
- `frontend/src/components/MeetingRoom.jsx` — Core WebRTC component
- `my-backend/sockets/meetingSocket.js` — Signaling server

---

## SLIDE 4 — WEBSOCKET SIGNALING & REAL-TIME DATA FLOW

### Title
WebSocket Signaling: The Glue of Real-Time Communication

### OSI Layer Reference
**Session Layer** (L5) + **Transport Layer** (L4)

### Architecture Diagram (Text)

```
[Client A]                    [Socket.io Server]                    [Client B]
    |                              |                                   |
    |--- join_meeting_room ------->|                                   |
    |                              |--- participant_joined ----------->|
    |                              |--- participant_joined <-----------|
    |                              |                                   |
    |--- webrtc_offer ----------->|                                   |
    |                              |--- webrtc_offer ----------------->|
    |<-- webrtc_answer -----------|                                   |
    |                              |                                   |
    |--- ice_candidate ---------->|                                   |
    |                              |--- ice_candidate ---------------->|
    |                              |                                   |
    |--- chat_message ----------->|                                   |
    |                              |--- chat_message ----------------->|
```

### CCN Concepts Demonstrated
| Concept | Implementation |
|---------|---------------|
| **WebSocket Protocol** | Full-duplex communication over TCP (Socket.io on `/meeting` namespace) |
| **Signaling** | Out-of-band exchange of WebRTC session control data |
| **Event-Driven Architecture** | Custom events: `webrtc_offer`, `webrtc_answer`, `ice_candidate`, `chat_message` |
| **Room Management** | Socket.io rooms — isolate meeting sessions, participant tracking |
| **Fallback Transport** | HTTP long-polling when WebSocket unavailable (Socket.io built-in) |
| **CORS for WebSockets** | Secure cross-origin upgrade headers in Nginx |

### Code Reference
- `my-backend/config/socket.js` — Socket.io singleton manager
- `my-backend/sockets/meetingSocket.js` — Event handlers, room logic

### Data Flow
1. User books meeting → Server generates meeting room & sends email
2. At meeting time → Both participants join Socket.io room
3. WebRTC signaling occurs over WebSocket → P2P connection established
4. Chat messages & file sharing stream via the same WebSocket channel

---

## SLIDE 5 — DNS, HTTPS & NETWORK SECURITY

### Title
Network Infrastructure: DNS, HTTPS & Security Protocols

### OSI Layer Reference
**Network Layer** (L3) + **Presentation Layer** (L6) + **Application Layer** (L7)

### Three Key Networking Pillars

#### 1. DNS Resolution (Network Layer)
- **Challenge:** ISP DNS blocking prevented MongoDB Atlas SRV record resolution
- **Solution:** DNS-over-HTTPS (DoH) via Cloudflare `cloudflare-dns.com/dns-query`
- **Fallback Chain:** System DNS (Google `8.8.8.8`, Cloudflare `1.1.1.1`) → DoH
- **CCN Relevance:** DNS resolution hierarchy, SRV records, encrypted DNS

#### 2. HTTPS & SSL/TLS (Presentation Layer)
- **Requirement:** WebRTC `getUserMedia` mandates secure context (HTTPS)
- **Implementation:** Self-signed SSL certs for dev, Let's Encrypt for production
- **Nginx config:** SSL termination, HTTP → HTTPS redirect
- **CCN Relevance:** TLS handshake, certificate authorities, secure sessions

#### 3. Network Security (All Layers)
| Security Measure | CCN Layer | Purpose |
|-----------------|-----------|---------|
| JWT (24h expiry) | Application | Stateless auth, role-based access |
| bcrypt (10 rounds) | Application | Password hashing |
| Helmet.js | Application | Secure HTTP headers (HSTS, CSP, X-Frame-Options) |
| CORS whitelist | Application | Restrict cross-origin requests |
| Meeting access windows | Application | Time-bounded room access (buffer before/after) |

### Code Reference
- `my-backend/config/db.js` — DNS-over-HTTPS for MongoDB
- `my-backend/server.js` — HTTPS server setup, CORS, Helmet
- `frontend/vite.config.js` — SSL for local dev
- `E:\My Projects\Nexagen Project\setup-https-ec2.sh` — HTTPS setup script

---

## SLIDE 6 — DEPLOYMENT ARCHITECTURE & NETWORK TOPOLOGY

### Title
Production Network Architecture — AWS EC2 Deployment

### Network Topology Diagram (Text)

```
                         Internet
                            |
                      [DNS Resolver]
                            |
                   [AWS EC2 Instance]
                            |
                    [Nginx Reverse Proxy]
                     /               \
                    /                 \
            [React Frontend]    [Node.js Backend]
            (Static Files)      (Port 5001/5002)
                    |                 |
                    |           [Socket.io Server]
                    |                 |
                    |           [MongoDB Atlas]
                    |           (DNS-over-HTTPS)
                    |
            [WebRTC P2P]
         (Direct browser-browser)
```

### CCN Concepts Demonstrated

| Concept | Implementation |
|---------|---------------|
| **Client-Server Architecture** | Nginx reverse proxy, backend API, frontend SPA |
| **Reverse Proxy** | Nginx forwards `/api/*` to backend, serves static frontend |
| **WebSocket Upgrade** | Nginx config: `Upgrade $http_upgrade`, `Connection "upgrade"` |
| **Load Balancing** | PM2 cluster mode for backend process management |
| **CI/CD Pipeline** | GitHub Actions auto-deploys to EC2 on git push to main |
| **Firewall & Security** | EC2 security groups, Nginx access controls |

### Deployment Stack
```
GitHub → Push to main → GitHub Actions → SSH → EC2 → PM2 restart
                                                    ↓
                                            Nginx on port 443 (HTTPS)
                                                    ↓
                                        Frontend:443 → Backend:5001
```

### Code Reference
- `.github/workflows/deploy.yml` — CI/CD pipeline
- `AWSDeployment.md` — Full deployment guide
- `my-backend/server.js` — Express + Socket.io server entry point

### Key Takeaway
NexGen demonstrates a **complete production-grade network stack** — from DNS resolution to P2P media streaming, passing through HTTPS termination, WebSocket upgrade, and real-time signaling — all deployed on a **real AWS EC2 server** with CI/CD.

---

## APPENDICES (For Speaker Notes)

### Appendix A: Full CCN Layer Mapping

| OSI Layer | CCN Concept | NexGen Implementation |
|-----------|-------------|----------------------|
| L7 Application | HTTP, WebRTC, WebSocket | Express REST API, RTCPeerConnection, Socket.io |
| L6 Presentation | SSL/TLS, Data Encoding | HTTPS, JWT encoding, SDP negotiation |
| L5 Session | Session Management | Socket.io rooms, JWT sessions, meeting access windows |
| L4 Transport | TCP, UDP | HTTP/TCP (API), WebSocket/TCP (signaling), RTP/UDP (media) |
| L3 Network | IP, DNS, NAT | EC2 public IP, DNS-over-HTTPS, STUN NAT traversal |
| L2 Data Link | Ethernet, ARP | Underlying AWS infrastructure |
| L1 Physical | Cables, Radio | AWS data center physical layer |

### Appendix B: Key File Paths for Reference

- WebRTC Component: `frontend/src/components/MeetingRoom.jsx`
- WebSocket Signaling: `my-backend/sockets/meetingSocket.js`
- Socket.io Manager: `my-backend/config/socket.js`
- DNS-over-HTTPS: `my-backend/config/db.js`
- Server Entry: `my-backend/server.js`
- Vite/SSL Config: `frontend/vite.config.js`
- Nginx Deployment: `AWSDeployment.md`
- CI/CD Pipeline: `.github/workflows/deploy.yml`

---

*End of Presentation Data — 6 Slides Complete*
