# PlusUltra — AI Waste Management Backend

A scalable Django REST API for AI-powered waste collection, featuring PostGIS spatial support, Google OR-Tools route optimization, JWT authentication, and Celery background tasks.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Auth | JWT (SimpleJWT) |
| Route Optimization | Google OR-Tools VRP |
| Background Tasks | Celery + Redis |
| Containerization | Docker + docker-compose |

---

## Quick Start (Docker)

```bash
# 1. Clone and enter the project
git clone <repo> && cd PlusUltra

# 2. Set up environment
cp .env.example .env
# Edit .env — set SECRET_KEY and verify DB credentials

# 3. Start all services
docker-compose up --build

# 4. Run migrations
docker-compose exec web python manage.py migrate

# 5. Create a superuser
docker-compose exec web python manage.py createsuperuser

# 6. API is live at http://localhost:8000
```

---

## PostGIS Setup (Manual, without Docker)

> **Requirement**: PostgreSQL ≥ 14 with PostGIS 3.x extension.

```sql
-- Run inside psql as a superuser:
CREATE DATABASE plusultra;
\c plusultra
CREATE EXTENSION postgis;
```

**OS-level GDAL** is also required:
- **Ubuntu/Debian**: `sudo apt-get install gdal-bin libgdal-dev libgeos-dev`
- **macOS (Homebrew)**: `brew install gdal geos`
- **Windows**: Install via [OSGeo4W](https://trac.osgeo.org/osgeo4w/)

---

## Project Structure

```
backend/
├── config/           # Django settings, URLs, Celery, WSGI
├── users/            # Custom User model, JWT auth, RBAC
├── containers/       # Container model, GeoJSON, hotspot detection
│   ├── views.py      # GET /containers/, PATCH /containers/{id}/
│   ├── map_views.py  # GET /map/containers/geojson/, GET /map/hotspots/
│   └── tasks.py      # Fill level prediction (Celery)
├── routes/
│   ├── models.py     # Route + RouteStop (ordered M2M)
│   ├── optimizer.py  # OR-Tools VRP + CO₂ cost matrix
│   ├── views.py      # Driver routes, recalculate
│   └── tasks.py      # Periodic route recalculation
└── tests/            # Model + API + optimizer unit tests
```

---

## API Reference

### Authentication

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/auth/login/` | Public | Obtain JWT tokens |
| `POST` | `/auth/logout/` | Any | Blacklist refresh token |
| `POST` | `/auth/refresh/` | Any | Refresh access token |
| `GET` | `/auth/me/` | Any | Current user profile |
| `GET` | `/auth/users/` | Admin | List all users |
| `POST` | `/auth/users/` | Admin | Create a user |

### Containers

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/containers/` | Any | List active containers |
| `GET` | `/containers/{id}/` | Any | Get container detail |
| `PATCH` | `/containers/{id}/` | Any | Update fill level |

**Query params for `GET /containers/`:**
- `waste_type` — filter by type (`general`, `recyclable`, `organic`, `hazardous`, `electronic`)
- `min_fill` — minimum fill level (e.g. `min_fill=50`)
- `needs_collection=true` — only containers above threshold

### Routes

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/routes/` | Admin | All routes |
| `GET` | `/routes/{id}/` | Owner/Admin | Route with ordered stops |
| `GET` | `/routes/driver/{id}/` | Owner/Admin | Driver's routes |
| `PATCH` | `/routes/{id}/status/` | Owner | Update route status |
| `POST` | `/routes/recalculate/` | Admin | Trigger VRP optimisation |

**`POST /routes/recalculate/` body:**
```json
{
  "driver_id": 5,
  "depot_longitude": 71.4460,
  "depot_latitude": 51.1801,
  "threshold": 65
}
```

Add `?async=true` to queue via Celery instead of running synchronously.

### Map / GeoJSON

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/map/containers/geojson/` | Any | GeoJSON FeatureCollection |
| `GET` | `/map/hotspots/` | Any | Containers above fill threshold |

**`GET /map/hotspots/` query params:**
- `threshold` — override fill threshold (default from settings)
- `radius_m` — clustering radius in metres (default 500)
- `waste_type` — filter by type

---

## Route Optimization

The `WasteRouteOptimizer` in `routes/optimizer.py` solves the VRP using Google OR-Tools with a **CO₂ cost matrix** instead of raw distance.

### CO₂ Cost Function

```python
def co2_cost(dist_km, fill_pct, emission_factor=0.27):
    load_factor = 1.0 + (fill_pct / 100.0) * 0.3
    return dist_km * emission_factor * load_factor  # kg CO₂
```

- **`emission_factor`**: 0.27 kg CO₂/km/tonne (IPCC default, configurable via `CO2_EMISSION_FACTOR` env var)
- **`load_factor`**: 1.0–1.3× based on destination container fill level
- A fully loaded vehicle (100% fill) emits 30% more CO₂ per km than empty

### Solver Configuration

- **Algorithm**: PATH_CHEAPEST_ARC (first solution) + GUIDED_LOCAL_SEARCH (improvement)
- **Time limit**: 30 seconds (configurable)
- **Fallback**: Greedy nearest-neighbour when OR-Tools is unavailable
- **Output**: Ordered container list + encoded Google polyline

---

## Background Tasks (Celery Beat)

| Task | Schedule | Description |
|---|---|---|
| `routes.tasks.recalculate_all_routes` | Every hour (`:00`) | Re-runs VRP for all active drivers |
| `containers.tasks.predict_fill_levels` | Every 30 minutes | Linear regression fill prediction |

The fill prediction uses least-squares regression on each container's `fill_history` to project the fill level 2 hours ahead and pre-flag containers for upcoming routes.

---

## Running Tests

```bash
cd backend
python manage.py test tests --verbosity=2
```

Tests cover:
- **Model tests**: User creation, role properties, Container needs_collection
- **API tests**: Login, JWT flow, logout, RBAC enforcement
- **Optimizer tests**: Haversine distance, CO₂ formula, polyline encoding, greedy fallback

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | (required) | Django secret key |
| `DEBUG` | `False` | Debug mode |
| `DATABASE_URL` | `postgis://...` | PostGIS connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL |
| `FILL_LEVEL_THRESHOLD` | `70` | % above which containers are collected |
| `CO2_EMISSION_FACTOR` | `0.27` | kg CO₂/km |
| `ACCESS_TOKEN_LIFETIME_MINUTES` | `60` | JWT access token TTL |
| `REFRESH_TOKEN_LIFETIME_DAYS` | `7` | JWT refresh token TTL |
