# 🎫 Tickets App

Full-stack ticket management system built with **Laravel 13 + SQL Server + Vanilla JS + React + Node.js**, orchestrated with Docker Compose.

---

## 📁 Project Structure

```
tickets-app/
├── backend/              # Laravel 13 REST API (PHP)
│   ├── app/
│   │   ├── Console/Commands/   # Artisan commands (stale-ticket reset)
│   │   ├── Http/
│   │   │   ├── Controllers/    # API controllers
│   │   │   └── Requests/       # Form request validation
│   │   ├── Models/             # Eloquent models (Ticket, User)
│   │   └── Services/           # Business logic (TicketService)
│   ├── database/
│   │   ├── migrations/         # SQL Server schema migrations
│   │   └── seeders/            # Sample data (3 users, 5 tickets)
│   └── routes/
│       ├── api.php             # API route definitions
│       └── console.php         # Scheduled commands
├── frontend/             # Vanilla JS SPA (served on port 3000)
├── frontend-react/       # React + Vite SPA (served on port 3002)
├── stats-service/        # Node.js / Express stats microservice (port 3001)
└── docker-compose.yml    # Orchestrates all services + SQL Server
```

---

## 🚀 Setup & Running

### Prerequisites
- Docker & Docker Compose

### Run everything

```bash
git clone <repo-url>
cd tickets-app
docker-compose up --build
```

The backend entrypoint will automatically:
1. Wait for SQL Server to be ready
2. Create the `tickets_db` database
3. Generate the application key
4. Run all migrations
5. Seed sample data (3 users, 5 tickets)
6. Start the daily scheduler
7. Start Laravel on port 8000

### Access the app

| Service | URL |
|---|---|
| 🌐 Frontend (Vanilla JS) | http://localhost:3000 |
| ⚛️ Frontend (React) | http://localhost:3002 |
| 📊 Stats Service | http://localhost:3001 |
| ⚙️ Backend API | http://localhost:8000/api |
| 🗄️ SQL Server | localhost:1433 |

### Environment variables

```bash
cp backend/.env.example backend/.env
```

---

## 📡 API Reference

### Tickets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tickets` | List tickets (filterable, sortable, paginated) |
| `POST` | `/api/tickets` | Create a ticket |
| `GET` | `/api/tickets/{id}` | Get a single ticket |
| `PUT/PATCH` | `/api/tickets/{id}` | Update a ticket |
| `DELETE` | `/api/tickets/{id}` | Delete a ticket |
| `PATCH` | `/api/tickets/{id}/status` | Change status only |
| `PATCH` | `/api/tickets/{id}/assign` | Assign to a user |

### Query parameters for `GET /api/tickets`

| Param | Values | Default |
|---|---|---|
| `status` | `open`, `in_progress`, `closed` | — |
| `priority` | `low`, `medium`, `high` | — |
| `assigned_user_id` | integer | — |
| `sort_by` | `created_at`, `priority`, `updated_at` | `created_at` |
| `sort_dir` | `asc`, `desc` | `desc` |
| `page` | integer | `1` |
| `per_page` | 1–100 | `15` |

### Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/{id}` | Get user with their tickets |

### Stats Service

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | DB connectivity check |
| `GET` | `/stats/overview` | Totals by status, priority, unassigned, stale |
| `GET` | `/stats/by-user` | Ticket breakdown per user |
| `GET` | `/stats/stale` | Full details of stale high-priority tickets |
| `GET` | `/stats/trends` | Tickets created/closed per day (last 30 days) |
| `GET` | `/stats/resolution` | Avg/min/max resolution time for closed tickets |

---

## ⚙️ Business Rules

### 1 · Cannot close a ticket without an assigned user
`PATCH /api/tickets/{id}/status` with `status=closed` returns `422` if `assigned_user_id` is null.
Also enforced on `PUT /api/tickets/{id}` when updating status to closed.

### 2 · High-priority 48-hour auto-reset
The command `tickets:reset-stale-high-priority` is scheduled to run **daily**.
Any ticket with `priority = high` and status `in_progress` that hasn't been updated in more than **48 hours** is automatically reset to `open`. Tickets with status `closed` are considered handled and are not affected.

To run it manually:
```bash
docker exec tickets_backend php artisan tickets:reset-stale-high-priority
```

---

## 🗄️ Complex SQL Query

The `GET /api/tickets` endpoint (`TicketService::listTickets`) uses a hand-written SQL query to combine dynamic filtering, priority-aware sorting, stale-ticket detection, and pagination in a single pass. Eloquent would be preferable for readability and maintainability; raw SQL was used here to satisfy the assignment requirement for a complex manual query.

```sql
SELECT
    t.id, t.title, t.description, t.status, t.priority,
    t.assigned_user_id, t.created_at, t.updated_at,
    u.name  AS assigned_user_name,
    u.email AS assigned_user_email,
    CASE
        WHEN t.priority = 'high'
         AND t.status  != 'open'
         AND t.updated_at < DATEADD(HOUR, -48, GETUTCDATE())
        THEN 1 ELSE 0
    END AS is_stale_high_priority
FROM tickets t
LEFT JOIN users u ON u.id = t.assigned_user_id
WHERE t.status = ?           -- optional filter
  AND t.priority = ?         -- optional filter
  AND t.assigned_user_id = ? -- optional filter
ORDER BY
    CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END DESC
    -- or ORDER BY t.created_at DESC
OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
```

Additional complex queries live in the stats service (`stats-service/src/routes/stats.js`), including per-user `CASE WHEN` aggregations, `DATEDIFF` resolution-time calculations, and daily trend grouping with `CAST(created_at AS DATE)`.

---

## ☁️ Deployment Suggestion on AWS

  ## Overall Architecture

  Internet
      │
      ├── CloudFront (CDN)
      │       ├── S3 → Vanilla JS frontend
      │       └── S3 → React frontend
      │
      ├── Application Load Balancer (ALB)
      │       ├── /api/*     → ECS: Laravel backend
      │       └── /stats/*   → ECS: Node.js stats service
      │
      └── [Everything above sits in a VPC]
              ├── Public subnets  → ALB, NAT Gateway
              └── Private subnets → ECS tasks, RDS

  ---
  ## Component by Component

  ### 1. VPC (Virtual Private Cloud)

  Your isolated network in AWS. You'd create:
  - Public subnets (2 across availability zones) — for the ALB and NAT Gateway
  - Private subnets (2 across availability zones) — for ECS tasks and RDS

  Nothing in private subnets is directly reachable from the internet. Outbound internet access from private subnets goes through the NAT Gateway.

  ---
  ### 2. RDS for SQL Server

  Replaces your tickets_sqlserver Docker container.

  - Managed SQL Server instance inside the private subnet
  - AWS handles backups, patching, failover
  - Multi-AZ deployment for high availability
  - Your backend and stats service connect to it via the private DNS hostname RDS provides
  - Credentials stored in AWS Secrets Manager (not hardcoded in environment variables)

  ---
  ### 3. ECR (Elastic Container Registry)

  Replaces Docker Hub as your image registry.

  - You push your built Docker images here: backend and stats-service
  - ECS pulls from ECR when deploying
  - Images are tagged by git commit or version

  ---
  ### 4. ECS Fargate (Laravel Backend + Node.js Stats)

  Replaces running containers on docker-compose.

  - Fargate means serverless containers — no EC2 instances to manage
  - Each service (backend, stats-service) becomes an ECS Service with a Task Definition
  - Task definitions define the container image (from ECR), CPU/memory, environment variables, and port
  - ECS handles starting, stopping, and replacing unhealthy containers
  - You can configure auto-scaling based on CPU or request count

  ---
  ### 5. Application Load Balancer (ALB)

  The single entry point for all API traffic.

  - Listens on port 443 (HTTPS)
  - Routes by path:
    - /api/* → backend ECS service (port 8000)
    - /stats/* → stats-service ECS service (port 3001)
    - /health → stats or backend health check
  - Works with ACM (AWS Certificate Manager) for free SSL certificates

  ---
  ### 6. S3 + CloudFront (Frontends)

  Replaces the nginx containers for both frontends.

  - Vanilla JS frontend — upload the static files directly to an S3 bucket
  - React frontend — run npm run build in CI, upload the dist/ folder to a separate S3 bucket
  - CloudFront sits in front of each S3 bucket as a CDN — global edge caching, HTTPS, custom domain
  - Both frontends would need their API base URL updated from /api (relative, proxied by nginx) to https://api.yourdomain.com/api (absolute, pointing to the ALB)

  ---
  ### 7. Route 53

  DNS management.

  - api.yourdomain.com → ALB
  - app.yourdomain.com → CloudFront (vanilla JS)
  - react.yourdomain.com → CloudFront (React)
  - stats.yourdomain.com → ALB (or separate CloudFront distribution)

  ---
  ### 8. Secrets Manager

  Replaces plaintext environment variables in docker-compose.yml.

  - Stores DB_PASSWORD, APP_KEY, DB credentials
  - ECS tasks fetch secrets at runtime via IAM roles — no secrets in code or config files

  ---
  ### 9. CloudWatch

  Logs and monitoring.

  - ECS containers stream logs to CloudWatch Logs automatically
  - Set up alarms for high CPU, memory, or error rates
  - Replaces reading docker logs manually

  ---
  ### 10. CI/CD (CodePipeline or GitHub Actions)

  ## Automates the deployment pipeline:

  1. Push to main branch
  2. Build Docker images for backend and stats-service
  3. Push images to ECR
  4. Update ECS services with the new image (rolling deployment — zero downtime)
  5. Build React app and sync dist/ to S3
  6. Invalidate CloudFront cache



## Part B — Code Improvement

### Original code

```php
public function getOpenTickets()
{
    $tickets = DB::select("SELECT * FROM tickets WHERE status = 'open'");
    return $tickets;
}
```


### Problems

1. Raw `DB::select()` instead of Eloquent ORM
2. `SELECT *` fetches unnecessary columns
3. Magic string `'open'` hardcoded — not centralized
4. No return type hint
5. No pagination — risk of memory exhaustion on large datasets

### Improved code

```php
// Ticket.php (Model)
class Ticket extends Model
{
    const STATUS_OPEN = 'open';

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_OPEN);
    }
}

// TicketService.php
public function getOpenTickets(): LengthAwarePaginator
{
    return Ticket::open()
        ->select(['id', 'title', 'status', 'created_at', 'assigned_user_id'])
        ->latest()
        ->paginate(25);
}
```

### Summary of changes

| Issue | Before | After |
|---|---|---|
| Query method | Raw `DB::select()` | Eloquent with a named scope |
| Column selection | `SELECT *` | Explicit column list |
| Magic string | `'open'` hardcoded | `Ticket::STATUS_OPEN` constant |
| Return type | None | `LengthAwarePaginator` |
| Pagination | None | `paginate(25)` |
| Ordering | None | `latest()` (newest first) |
