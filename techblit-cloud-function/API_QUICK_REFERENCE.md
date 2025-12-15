# API Quick Reference

## Base URL
```
https://us-central1-techblit.cloudfunctions.net/api/v1
```

## Authentication
All admin endpoints require:
```
Authorization: Bearer <firebase-id-token>
```

---

## Posts API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/posts` | Public | Get published posts |
| GET | `/posts/:slug` | Public | Get post by slug |
| PATCH | `/posts/:slug/view` | Public | Increment view count |
| POST | `/posts` | Admin | Create new post |
| PUT | `/posts/:id` | Admin | Update post |

---

## Users API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | Get all users |
| GET | `/users/profile` | User | Get current user profile |
| PUT | `/users/profile` | User | Update current user profile |
| PUT | `/users/:id/role` | Admin | Update user role |

---

## Invitations API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/invitations` | Admin | Invite new user |
| POST | `/invitations/:uid/resend` | Admin | Resend invitation |
| GET | `/invitations/stats` | Admin | Get invitation statistics |

---

## Audit Logs API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/audit-logs` | Admin | Get audit logs |
| GET | `/audit-logs/stats` | Admin | Get audit log statistics |
| GET | `/audit-logs/filters` | Admin | Get available filters |
| GET | `/audit-logs/:id` | Admin | Get audit log by ID |

---

## Grok Trends API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/grok-trends/stories` | Admin | Get Grok stories |
| PATCH | `/grok-trends/stories/:id/status` | Admin | Update story status |
| GET | `/grok-trends/stats` | Admin | Get Grok statistics |
| POST | `/grok-trends/fetch` | Admin | Manually fetch stories |

---

## Notifications API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | User | Get user notifications |
| PATCH | `/notifications/:id/read` | User | Mark notification as read |

---

## Preview Tokens API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/preview-tokens/validate` | Public | Validate preview token |
| POST | `/preview-tokens` | Admin | Generate preview token |
| GET | `/preview-tokens/stats` | Admin | Get preview token statistics |

---

## Utility API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Health check |
| GET | `/sitemap` | Public | Generate sitemap XML |

---

## Example Usage

### Get Posts (Public)
```bash
curl https://us-central1-techblit.cloudfunctions.net/api/v1/posts
```

### Create Post (Admin)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","content":"Post content","excerpt":"Summary"}' \
  https://us-central1-techblit.cloudfunctions.net/api/v1/posts
```

### Get User Profile (Authenticated)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://us-central1-techblit.cloudfunctions.net/api/v1/users/profile
```

### Invite User (Admin)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John Doe","role":"author"}' \
  https://us-central1-techblit.cloudfunctions.net/api/v1/invitations
```

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error
```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```

