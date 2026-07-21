# SkillSphere — Intelligent Hyperlocal Freelance Ecosystem

A full-stack MERN platform connecting clients with freelancers in a hyperlocal environment. Features AI-powered job matching, milestone payments, reputation scoring, real-time collaboration tools, and admin analytics dashboards.

## 🚀 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Real-time:** Socket.IO
- **Authentication:** JWT + bcrypt + Google OAuth
- **Payments:** Razorpay / Stripe
- **File Uploads:** Cloudinary
- **Emails:** Nodemailer

### Frontend (Coming Soon)
- React.js
- Redux Toolkit
- Tailwind CSS
- Socket.IO Client

## 📦 Database Collections (11)

| Collection | Description |
|-----------|-------------|
| Users | Base user accounts (client/freelancer/admin) |
| FreelancerProfiles | Skills, portfolio, resume, availability |
| ClientProfiles | Company info, spending stats |
| Gigs | Job listings with milestones |
| Proposals | Bids with negotiation history |
| Reviews | Multi-dimensional ratings |
| Conversations | Chat threads |
| Messages | Chat messages with read receipts |
| Payments | Escrow, milestone, refund tracking |
| Notifications | In-app + email notifications |
| Disputes | Resolution workflow with evidence |
| AdminLogs | Audit trail for admin actions |

## 🔑 Key Features

1. **Multi-Role Authentication** — JWT, Google OAuth, 2FA, RBAC
2. **AI Job Matching** — Skill similarity scoring, personalized recommendations
3. **Freelancer Profiles** — Portfolio, resume, certifications, availability calendar
4. **Gig Marketplace** — Create, search, filter, and manage projects
5. **Proposal & Bidding** — Submit, negotiate, accept/reject proposals
6. **Real-Time Chat** — Socket.IO messaging, typing indicators, read receipts
7. **Escrow Payments** — Razorpay integration, milestone payments, refunds
8. **Reputation System** — Weighted review scores, fraud detection
9. **Admin Dashboard** — Analytics, user management, dispute resolution
10. **Advanced Search** — Text, skill, location, price, rating filters
11. **Notifications** — Real-time + email notifications

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Razorpay account (for payments)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd skillsphere

# Install server dependencies
cd server
npm install

# Set up environment variables
# Edit the .env file in the root directory with your credentials

# Start the development server
npm run dev
```

### Environment Variables

Copy and edit the `.env` file in the root directory with your credentials.

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `POST /api/auth/forgot-password` — Request password reset
- `PUT /api/auth/reset-password/:token` — Reset password
- `POST /api/auth/google` — Google OAuth

### Gigs
- `GET /api/gigs` — List all gigs (paginated, filtered)
- `POST /api/gigs` — Create gig (Client)
- `GET /api/gigs/:id` — Get gig details
- `PUT /api/gigs/:id` — Update gig (Client)

### Proposals
- `POST /api/proposals` — Submit proposal (Freelancer)
- `GET /api/proposals/gig/:gigId` — View proposals (Client)
- `PUT /api/proposals/:id/accept` — Accept proposal (Client)
- `PUT /api/proposals/:id/negotiate` — Counter-offer (Client)

### Payments
- `POST /api/payments/create-order` — Create Razorpay order
- `POST /api/payments/verify` — Verify payment
- `PUT /api/payments/milestone/:id/release` — Release payment

### Search
- `GET /api/search/gigs` — Search gigs
- `GET /api/search/freelancers` — Search freelancers

### Admin
- `GET /api/admin/dashboard` — Dashboard analytics
- `PUT /api/admin/users/:id/suspend` — Suspend user
- `PUT /api/admin/freelancers/:id/verify` — Verify freelancer

## 📁 Project Structure

```
server/
├── config/          # Database, Cloudinary, Razorpay configs
├── controllers/     # Route handlers (12 controllers)
├── middlewares/      # Auth, RBAC, file upload middleware
├── models/          # Mongoose schemas (12 models)
├── routes/          # Express routes (12 route files)
├── socket/          # Socket.IO event handlers
├── utils/           # Matching engine, reputation calc, mail sender
└── index.js         # Server entry point
```

## 👤 Author

Built during internship at Nayoda.

## 📄 License

ISC
