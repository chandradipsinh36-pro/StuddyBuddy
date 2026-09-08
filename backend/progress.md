# StudyBuddy Backend — Progress Document

> **Purpose**: Quick reference for any model reading this codebase. Avoids re-reading all source files.
> **Last updated**: 2026-09-08

---

## ✅ Implementation Status: COMPLETE

---

## Stack

| Component | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4.x |
| Language | TypeScript 5.6 |
| ORM | Prisma 5.22 |
| Database | Neon PostgreSQL (25 tables) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Real-time | Socket.IO 4.x |
| Validation | Zod 3.x |
| Security | helmet + cors + express-rate-limit |
| Logging | Winston |
| Testing | Jest + Supertest |

---

## Project Layout

```
backend/
├── src/
│   ├── app.ts                  ← Express factory (all routes assembled)
│   ├── server.ts               ← HTTP + Socket.IO startup
│   ├── config/
│   │   ├── env.ts              ← Zod-validated env
│   │   └── database.ts         ← Prisma singleton
│   ├── middleware/
│   │   ├── authenticate.ts     ← JWT Bearer verify
│   │   ├── authorize.ts        ← Role guard
│   │   ├── validate.ts         ← Zod body/query/params validator
│   │   ├── errorHandler.ts     ← Centralized errors (no stack traces in prod)
│   │   └── rateLimiter.ts      ← Per-endpoint rate limits
│   ├── utils/
│   │   ├── AppError.ts         ← Custom error hierarchy
│   │   ├── response.ts         ← sendSuccess / sendPaginated / sendError
│   │   ├── jwt.ts              ← signToken / verifyToken
│   │   ├── hash.ts             ← hashPassword / comparePassword
│   │   ├── pagination.ts       ← getPagination (max 100)
│   │   └── logger.ts           ← Winston logger
│   ├── types/
│   │   └── express.d.ts        ← req.user type augmentation
│   ├── sockets/
│   │   ├── index.ts            ← createSocketServer()
│   │   └── groupChat.ts        ← All Socket.IO events
│   └── modules/
│       ├── auth/               ← register, login, logout, me
│       ├── users/              ← profile, password change
│       ├── tutors/             ← profiles + skills
│       ├── tutor-applications/ ← applications + documents
│       ├── categories/         ← read-only
│       ├── courses/            ← public + tutor CRUD + publish
│       ├── resources/          ← public + tutor CRUD + moderation storage
│       ├── bundles/            ← public + tutor CRUD + items
│       ├── enrollments/        ← student enroll + list
│       ├── payments/           ← course/resource/bundle + refunds
│       ├── reviews/            ← course reviews + tutor reviews
│       └── groups/             ← groups + members + messages + reports + payments
├── prisma/
│   ├── schema.prisma           ← 25-table schema
│   ├── migrations/             ← migration SQL (applied to Neon)
│   └── seed.ts                 ← Dev seed data
└── tests/
    ├── auth.test.ts
    ├── courses.test.ts
    └── groups.test.ts
```

---

## Database Tables (25)

| # | Table | Notes |
|---|---|---|
| 1 | `users` | student/tutor/admin enum; admin is DB-only |
| 2 | `tutor_profiles` | 1:1 with users |
| 3 | `tutor_skills` | 1:N with users |
| 4 | `tutor_applications` | Tutors cannot modify admin fields |
| 5 | `tutor_application_documents` | N per application |
| 6 | `categories` | Unique name |
| 7 | `courses` | Published guard; enrollment guard on delete |
| 8 | `resources` | 6-type enum; status lifecycle |
| 9 | `resource_categories` | Composite PK |
| 10 | `resource_moderation_logs` | Storage only, no AI |
| 11 | `resource_extracted_content` | Storage only, no AI |
| 12 | `video_metadata` | 1:1 with resources |
| 13 | `video_moderation_scenes` | Storage only, no AI |
| 14 | `enrollments` | Unique (student, course); transaction with payment |
| 15 | `bundles` | Tutor-owned |
| 16 | `bundle_items` | Composite PK |
| 17 | `payments` | Only 1 target per transaction |
| 18 | `refunds` | Students cannot modify admin fields |
| 19 | `course_reviews` | Unique (student, course); requires enrollment |
| 20 | `tutor_reviews` | Unique (student, tutor) |
| 21 | `groups` | Creator auto-joins as admin |
| 22 | `group_members` | Unique (group, user) |
| 23 | `group_messages` | Soft delete via is_deleted |
| 24 | `group_message_reports` | Users cannot modify admin fields |
| 25 | `group_payments` | Transaction: create + increment quota |

**Excluded** (per spec):
- ❌ `ai_chat_sessions` / `ai_chat_messages` / `ai_chat_usage` — AI phase
- ❌ `resource_access_logs` — explicitly dropped per documentation

---

## API Routes

### Auth (`/api/auth`)
- `POST /register` — public, rate limited
- `POST /login` — public, rate limited
- `POST /logout` — authenticated
- `GET /me` — authenticated

### Users (`/api/users`)
- `GET /me`
- `PATCH /me`
- `PATCH /me/password`

### Tutors (`/api/tutors`)
- `GET /` — public, paginated
- `GET /:id` — public
- `GET|POST|PATCH /me/profile` — tutor-only
- `GET|POST /me/skills` — tutor-only
- `PATCH|DELETE /me/skills/:skillId` — tutor-only (ownership checked)

### Tutor Applications (`/api/tutor-applications`)
- `POST /` — tutor-only
- `GET|PATCH /me`
- `GET|POST /me/documents`
- `DELETE /me/documents/:docId`

### Categories (`/api/categories`)
- `GET /` — public
- `GET /:id` — public

### Courses (`/api/courses`, `/api/tutor/courses`)
- Public: `GET /`, `GET /:id`
- Tutor: `GET|POST|PATCH|DELETE /:id`, `PATCH /:id/publish`

### Resources (`/api/resources`, `/api/tutor/resources`)
- Public: `GET /`, `GET /:id`
- Tutor: `GET|POST|PATCH|DELETE /:id`
- Category: `POST|DELETE /:id/categories/:categoryId`
- Moderation storage: `POST|GET /:id/moderation-logs`
- Video: `PUT /:id/video-metadata`
- Content: `POST /:id/extracted-content`

### Bundles (`/api/bundles`, `/api/tutor/bundles`)
- Public: `GET /`, `GET /:id`
- Tutor: `GET|POST|PATCH|DELETE /:id`
- Items: `POST|DELETE /:id/resources/:resourceId`

### Enrollments
- `POST /api/courses/:courseId/enroll` — student
- `GET /api/students/me/enrollments`
- `GET /api/students/me/enrollments/:id`

### Payments (`/api/payments`)
- `POST /course|/resource|/bundle` — student
- `GET /me`, `GET /me/:id`

### Refunds (`/api/refunds`)
- `POST /`, `GET /me`, `GET /me/:id`

### Reviews
- Course: `GET|POST /api/courses/:courseId/reviews`
- Course: `PATCH|DELETE /api/course-reviews/:reviewId`
- Tutor: `GET|POST /api/tutors/:tutorId/reviews`
- Tutor: `PATCH|DELETE /api/tutor-reviews/:reviewId`

### Groups (`/api/groups`)
- `GET|POST /`
- `GET|PATCH|DELETE /:groupId`
- `POST /:groupId/join|leave`
- `GET /:groupId/members`
- `DELETE /:groupId/members/:userId`
- `GET|POST /:groupId/messages`
- `DELETE /:groupId/messages/:messageId`
- `POST /:groupId/messages/:messageId/reports`
- `GET|POST /:groupId/payments`
- `GET /:groupId/payments/me`

### Health
- `GET /api/health` — checks DB connectivity

---

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `group:join` | C→S | Join group room (validates membership) |
| `group:leave` | C→S | Leave room |
| `message:send` | C→S | Send message (quota enforced, persisted) |
| `message:new` | S→C | Broadcast new message to group |
| `message:delete` | C→S | Soft-delete message |
| `message:deleted` | S→C | Notify deletion |
| `typing:start` | C→S | Typing indicator |
| `typing:stop` | C→S | Stop typing |
| `group:online-members` | S→C | Live online count |

**Socket auth**: JWT in `handshake.auth.token` or `Authorization` header.

---

## Security

- **Authentication**: JWT Bearer — middleware `authenticate`
- **Authorization**: Role-based — middleware `authorize('tutor')`
- **Ownership**: All write operations verify `resource.ownerId === req.user.userId`
- **Password**: bcryptjs, 12 rounds, never returned in API responses
- **Helmet**: Secure HTTP headers
- **CORS**: Restricted to `CLIENT_URL` with credentials
- **Rate limits**: Auth (20/15min), General (500/15min), Messages (60/min), Reviews/Reports (custom)
- **Input validation**: Zod — all request body, query, params validated
- **Error handler**: No stack traces in production, no credential leaks
- **Socket.IO**: JWT verified on connect; senderId always from server, never client

---

## ❌ NOT Implemented (by design)

- **AI**: No OpenAI, no Google Vision, no OCR, no AI chat, no recommendations
- **Admin APIs**: No `/api/admin/*` — admin FK fields exist in DB only
- **resource_access_logs**: Table does not exist (explicitly dropped)
- **Real payment gateway**: Abstraction layer ready for future integration

---

## Dev Credentials

All passwords: `Password123!`
- `student1@dev.studybuddy.test` — Student
- `student2@dev.studybuddy.test` — Student
- `tutor1@dev.studybuddy.test` — Tutor (approved application)
- `tutor2@dev.studybuddy.test` — Tutor (approved application)

---

## Environment Variables Required

```env
DATABASE_URL=          # Neon pooled connection
DIRECT_URL=            # Neon direct connection (migrations)
JWT_SECRET=            # Min 16 chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## Commands

```bash
npm run dev          # Development server (nodemon)
npm run build        # TypeScript compilation
npm test             # Jest test suite
npm run db:generate  # Regenerate Prisma client
npm run db:migrate:dev   # Create + apply new migration
npm run db:migrate:deploy # Apply migrations (production)
npm run db:seed      # Seed dev database
```

---

## Next Phase Recommendations

1. **File storage** — Integrate Cloudinary/S3 for `resources.file_url` and `document_url`
2. **Email verification** — Add email verify flow (token + SMTP)
3. **Password reset** — Forgot/reset password with email tokens
4. **AI moderation** — Tables ready: `resource_moderation_logs`, `resource_extracted_content`, `video_moderation_scenes`
5. **AI chat** — Add `ai_chat_sessions`, `ai_chat_messages`, `ai_chat_usage` tables
6. **Admin APIs** — Build `POST /api/admin/applications/:id/approve` etc.
7. **Payment gateway** — Stripe/Razorpay integration in `paymentsService`
8. **Notifications** — Add `notifications` table and push/email delivery
9. **Analytics** — Add view tracking and tutor analytics endpoints
10. **API docs** — Generate from Zod schemas using zod-to-openapi
