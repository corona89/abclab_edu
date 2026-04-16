# abclab_edu

A full-stack monorepo with Next.js frontend and FastAPI backend.

## Project Structure

```
abclab_edu/
├── web/           # Next.js 16 frontend
├── api/           # FastAPI backend
├── .gitignore     # Root git ignore
└── README.txt     # This file
```

## Tech Stack

### Frontend (web/)
- **Framework**: Next.js 16.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **Routing**: App Router
- **Package Manager**: Yarn 4.13.0 (PnP)
- **AI Integration**: AI SDK UI Utilities

### Backend (api/)
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Package Manager**: uv
- **Server**: Uvicorn
- **Validation**: Pydantic

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Yarn 4.x (for frontend)
- uv (for backend)

### Installation

#### Frontend
```bash
cd web
yarn install
yarn dev
```

#### Backend
```bash
cd api
uv sync
uv run uvicorn main:app --reload
```

## Development

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Backend Docs: http://localhost:8000/docs

## Scripts

### Frontend (web/)
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

### Backend (api/)
- `uv run uvicorn main:app --reload` - Start development server
- `uv run pytest` - Run tests (when configured)

## Environment Variables

Create `.env.local` in `web/` for frontend environment variables.
Create `.env` in `api/` for backend environment variables.

## License

MIT
