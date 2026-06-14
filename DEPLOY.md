# Deploying Mass Laundry POS to Google Cloud

This guide deploys the three pieces of the app:

| Piece | Service | Notes |
|-------|---------|-------|
| Backend (NestJS) | **Cloud Run** | Containerised from the root `Dockerfile`. |
| Database | **Cloud SQL for PostgreSQL** | Managed + persistent. SQLite is local-dev only. |
| Frontend (Vite SPA) | **Firebase Hosting** | Global CDN, SPA rewrites. |
| Report files (`.xlsx`) | **Cloud Storage** | `GCS_BUCKET` env makes the API write reports there. |
| Secrets | **Secret Manager** | `JWT_SECRET`, `ANTHROPIC_API_KEY`, `ADMIN_REGISTRATION_CODE`. |

Region used throughout: **`asia-southeast2`** (Jakarta). Change if you prefer.

---

## 0. One-time setup

```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com
```

Replace `YOUR_GCP_PROJECT_ID` here and in `.firebaserc`.

---

## 1. Database — Cloud SQL for PostgreSQL

```bash
# Create the instance (smallest tier; resize later as needed)
gcloud sql instances create laundry-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-southeast2

# Create the database + app user
gcloud sql databases create laundry --instance=laundry-db
gcloud sql users create laundry_app \
  --instance=laundry-db \
  --password='CHOOSE_A_STRONG_PASSWORD'
```

Note the **connection name** (`PROJECT:asia-southeast2:laundry-db`):

```bash
gcloud sql instances describe laundry-db --format='value(connectionName)'
```

The Cloud Run `DATABASE_URL` connects over a Unix socket:

```
postgresql://laundry_app:STRONG_PASSWORD@localhost/laundry?host=/cloudsql/PROJECT:asia-southeast2:laundry-db&schema=public
```

> On first start, the container runs `prisma db push` to create the tables.
> (The repo's existing migrations are SQLite-flavoured; `db push` builds the
> schema directly. Switch to Postgres `migrate deploy` later if you want
> migration history.)

---

## 2. Report storage — Cloud Storage bucket

Cloud Run's disk is ephemeral, so scheduled `.xlsx` reports must live in a bucket.

```bash
gcloud storage buckets create gs://YOUR_GCP_PROJECT_ID-laundry-reports \
  --location=asia-southeast2 \
  --uniform-bucket-level-access
```

Set `GCS_BUCKET` on the service (step 4) and the API stores/serves reports there
automatically. Leave it unset locally to keep using `backend/storage/reports/`.

---

## 3. Secrets — Secret Manager

```bash
printf '%s' 'a-long-random-jwt-secret'   | gcloud secrets create jwt-secret --data-file=-
printf '%s' 'your-admin-reg-code'         | gcloud secrets create admin-reg-code --data-file=-
printf '%s' 'sk-ant-...'                  | gcloud secrets create anthropic-key --data-file=-
printf '%s' 'STRONG_PASSWORD'             | gcloud secrets create db-password --data-file=-
```

---

## 4. Backend — Cloud Run

Deploy straight from the repo root (the `Dockerfile` is there, and the build
needs the whole npm workspace for `@mass-laundry/shared-types`):

```bash
gcloud run deploy laundry-api \
  --source . \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT:asia-southeast2:laundry-db \
  --min-instances 1 \
  --set-env-vars "GCS_BUCKET=YOUR_GCP_PROJECT_ID-laundry-reports,ALLOWED_ORIGINS=https://YOUR_GCP_PROJECT_ID.web.app,https://YOUR_GCP_PROJECT_ID.firebaseapp.com" \
  --set-env-vars "DATABASE_URL=postgresql://laundry_app:STRONG_PASSWORD@localhost/laundry?host=/cloudsql/PROJECT:asia-southeast2:laundry-db&schema=public" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,ADMIN_REGISTRATION_CODE=admin-reg-code:latest,ANTHROPIC_API_KEY=anthropic-key:latest"
```

Key flags explained:

- **`--min-instances 1`** — the app uses in-process cron (`@nestjs/schedule`)
  for scheduled reports. If the service scales to zero, cron stops firing.
  Keeping one warm instance is the simplest fix. (Alternative: drop to
  `--min-instances 0` and trigger reports via Cloud Scheduler hitting an
  endpoint.)
- **`--add-cloudsql-instances`** — mounts the Cloud SQL socket at `/cloudsql/...`.
- **`ALLOWED_ORIGINS`** — must include your Firebase Hosting domain (CORS).

Grab the service URL for the frontend build:

```bash
gcloud run services describe laundry-api --region asia-southeast2 --format='value(status.url)'
```

Grant the runtime service account access to the bucket + secrets if needed:

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_GCP_PROJECT_ID --format='value(projectNumber)')
SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud storage buckets add-iam-policy-binding gs://YOUR_GCP_PROJECT_ID-laundry-reports \
  --member="serviceAccount:$SA" --role=roles/storage.objectAdmin
gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor
```

---

## 5. Frontend — Firebase Hosting

The frontend reads the API base URL from `VITE_BACKEND_URL` (it appends `/api`).

```bash
# Build pointing at the Cloud Run URL
VITE_BACKEND_URL="https://laundry-api-xxxx.asia-southeast2.run.app" npm run build:frontend

# First time only
npm install -g firebase-tools
firebase login

# Deploy (firebase.json + .firebaserc are already in the repo root)
firebase deploy --only hosting
```

Your site lands at `https://YOUR_GCP_PROJECT_ID.web.app`. Make sure that domain
is in the backend's `ALLOWED_ORIGINS`.

---

## 6. First login

`prisma db push` creates empty tables — there is no seeded admin. Register the
first admin through the app's registration flow using the
`ADMIN_REGISTRATION_CODE` you stored in Secret Manager.

---

## Redeploys

```bash
# Backend
gcloud run deploy laundry-api --source . --region asia-southeast2

# Frontend
VITE_BACKEND_URL="https://laundry-api-xxxx.asia-southeast2.run.app" npm run build:frontend
firebase deploy --only hosting
```

## Cost note

`--min-instances 1` keeps one Cloud Run instance always on (a few USD/month) so
scheduled reports run. `db-f1-micro` Cloud SQL is the cheapest tier. Firebase
Hosting has a generous free tier.
