# Prospector - Sales Prospecting Management App

A full-stack web application for managing sales prospecting activities, tracking contacts, companies, relationships, and outreach history.

## Quick Reference

### Starting the Application
- **Production**: `docker-compose up -d` or use `start.sh` (Linux/Mac) / `start-prod.bat` (Windows)
- **Development**: `docker-compose -f docker-compose.dev.yml up -d` or use `start-dev.sh` (Linux/Mac) / `start-dev.bat` (Windows)
- **HTTPS**: `docker-compose -f docker-compose.https.yml up -d` or use `start-https.sh` (Linux/Mac) / `start-https.bat` (Windows)

### Shutting Down the Application
- **Docker**: `docker-compose down`
- **Using Scripts**: Use `stop.sh` (Linux/Mac) / `stop.bat` (Windows)

### Accessing the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

For detailed instructions, see the [Installation](#installation) and [Docker Commands](#docker-commands) sections below.

## Features

- **Company Management**: Track customer companies with industry, website, and notes
- **Contact Management**: Manage points of contact with detailed information including:
  - Position and influence level assessment
  - Contact information (email, phone, LinkedIn)
  - Custom notes
- **Relationship Tracking**: Map relationships between contacts
- **Outreach History**: Log and track all outreach activities including:
  - Email, phone calls, meetings, LinkedIn messages
  - Outcomes and follow-up dates
  - Detailed notes for each interaction
- **Dashboard**: Overview of statistics and recent activities
- **Follow-up Reminders**: Track upcoming follow-ups

## Tech Stack

### Backend
- Node.js with Express
- SQLite database
- RESTful API

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- Vite for build tooling

## Project Structure

```
prospector/
├── backend/
│   ├── database.js       # Database schema and initialization
│   ├── server.js         # Express server and API routes
│   ├── Dockerfile        # Backend Docker configuration
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main app component
│   │   ├── api.js        # API service layer
│   │   ├── index.css     # Global styles
│   │   └── main.jsx      # Entry point
│   ├── Dockerfile        # Frontend Docker configuration
│   ├── nginx.conf        # Nginx configuration for production
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .gitignore
├── docker-compose.yml    # Docker Compose configuration
├── start.sh              # Linux/Mac startup script
├── start-dev.sh          # Development mode startup script
├── start-prod.sh         # Production mode startup script
├── start-https.sh        # HTTPS mode startup script
├── stop.sh               # Stop containers script
└── README.md
```

## Installation

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (included with Docker Desktop)

## Running with Docker

Prospector runs exclusively via Docker containers, which handles all dependencies and configuration automatically.

### Quick Start with Docker

1. **Clone the repository** (if you haven't already):
```bash
git clone <repository-url>
cd prospector
```

2. **Start the application**:
```bash
docker-compose up -d
```

This command will:
- Build Docker images for both frontend and backend
- Create a persistent volume for the database
- Start both services in detached mode
- Set up networking between containers

3. **Access the application**:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

4. **Shut down the application** (when finished):
```bash
docker-compose down
```
See the [Shutting Down the Application](#shutting-down-the-application) section for more details.

### Docker Commands

**View running containers**:
```bash
docker-compose ps
```

**View logs**:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Stop the application**:
```bash
docker-compose down
```

**Stop and remove volumes** (⚠️ This will delete all data):
```bash
docker-compose down -v
```

**Rebuild containers** (after code changes):
```bash
docker-compose up -d --build
```

**Restart a specific service**:
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Docker Data Persistence

The database is stored in a Docker volume named `backend-data`, which persists even when containers are stopped or removed. Your data will remain intact unless you explicitly remove the volume with `docker-compose down -v`.

### Docker Troubleshooting

**Port conflicts**: If ports 3000 or 3001 are already in use, you can modify them in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 3000 to 8080 for frontend
  - "8001:3001"  # Change 3001 to 8001 for backend
```

**View container health**:
```bash
docker-compose ps
```

**Access container shell**:
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

## Development Mode

For development with hot-reloading:

**Windows**:
```bash
start-dev.bat
```

**Linux/Mac**:
```bash
./start-dev.sh
```

Or directly:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

This provides:
- Hot-reloading for backend and frontend
- Source code mounted as volumes
- Development dependencies included

## Usage

### Getting Started

1. Start the application using Docker
2. Open your browser to `http://localhost:3000`
3. Begin by adding companies
4. Add contacts associated with those companies
5. Track relationships between contacts
6. Log outreach activities and set follow-up reminders

### Shutting Down the Application

To stop the Docker containers:

**Using Scripts**:
- Windows: `stop.bat`
- Linux/Mac: `./stop.sh`

**Or directly**:
```bash
# Stop containers (keeps data)
docker-compose down

# Stop containers and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

The `docker-compose down` command will:
- Gracefully stop all containers
- Close database connections properly
- Remove containers and networks
- Preserve data in volumes (unless `-v` flag is used)

### API Endpoints

#### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/:id` - Get single company
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

#### Contacts
- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/:id` - Get single contact
- `GET /api/companies/:id/contacts` - Get contacts by company
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

#### Relationships
- `GET /api/contacts/:id/relationships` - Get contact relationships
- `POST /api/contacts/:id/relationships` - Create relationship
- `DELETE /api/relationships/:id` - Delete relationship

#### Outreach History
- `GET /api/outreach` - Get all outreach
- `GET /api/contacts/:id/outreach` - Get contact outreach
- `POST /api/contacts/:id/outreach` - Create outreach record
- `PUT /api/outreach/:id` - Update outreach record
- `DELETE /api/outreach/:id` - Delete outreach record

## Database Schema

### Companies Table
- id (Primary Key)
- name
- industry
- website
- notes
- created_at
- updated_at

### Contacts Table
- id (Primary Key)
- company_id (Foreign Key)
- first_name
- last_name
- position
- influence_level (Low, Medium, High, Executive)
- email
- phone
- linkedin
- notes
- created_at
- updated_at

### Contact Relationships Table
- id (Primary Key)
- contact_id (Foreign Key)
- related_contact_id (Foreign Key)
- relationship_type
- notes
- created_at

### Outreach History Table
- id (Primary Key)
- contact_id (Foreign Key)
- outreach_type (Email, Phone, Meeting, LinkedIn, Other)
- outreach_date
- subject
- notes
- outcome
- follow_up_date
- created_at
- updated_at

## Development

### Database

The SQLite database file (`prospector.db`) is stored in a Docker volume and persists across container restarts. It's automatically created when you first start the application.

### Running Tests

Tests are designed to run on the host machine (not in containers). See [TESTING.md](TESTING.md) for detailed instructions.

```bash
cd backend
npm install
npm test
```

## Features in Detail

### Dashboard
- View total counts of companies, contacts, and outreach activities
- See recent outreach activities
- Quick navigation to main sections

### Company Management
- Add, edit, and delete companies
- Track industry and website information
- Add custom notes

### Contact Management
- Comprehensive contact information
- Influence level assessment (Low, Medium, High, Executive)
- Link contacts to companies
- View all contacts or filter by company

### Contact Detail View
- Complete contact information
- Relationship mapping with other contacts
- Full outreach history
- Quick actions for logging new outreach

### Relationship Tracking
- Map relationships between contacts
- Add relationship types and notes
- Visualize professional networks

### Outreach History
- Log all types of outreach (Email, Phone, Meeting, LinkedIn, Other)
- Track outcomes and results
- Set follow-up dates
- View upcoming follow-ups
- Filter by outreach type

## License

ISC

## Author

Built for sales prospecting management