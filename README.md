# GreenVested | ESG Investing Platform

<div align="center">

![GreenVested Logo](https://img.shields.io/badge/GreenVested-ESG%20Investing-blue?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**AI-Powered ESG Investing Platform for Smart Indian Markets**

[Features](#-features) • [Architecture](#-system-architecture) • [Tech Stack](#-technology-stack) • [Getting Started](#-getting-started)

</div>

---

## Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [System Architecture](#-system-architecture)
4. [Project Structure](#-project-structure)
5. [User Flow](#-user-flow)
6. [Technology Stack](#-technology-stack)
7. [API Documentation](#-api-documentation)
8. [Database Schema](#-database-schema)
9. [ML Models](#-ml-models)
10. [Getting Started](#-getting-started)
11. [Environment Variables](#-environment-variables)

---

## Overview

GreenVested is a full-stack ESG (Environmental, Social, Governance) investing platform designed for the Indian stock market (BSE). It provides:

- **Real-time ESG Scoring** using AI-powered NLP analysis
- **Portfolio Simulation** with Monte Carlo projections
- **ML-based Return Predictions** based on ESG factors
- **Interactive Visualizations** with dark mode support
- **User Authentication** with JWT tokens

### Why GreenVested?

- **For Beginners**: Educational content explaining Monte Carlo simulations and ESG metrics
- **For Investors**: Data-driven insights for sustainable investment decisions
- **For Analysts**: Comprehensive company ESG data with NLP-generated insights

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **ESG Scoring** | AI-powered analysis of Environmental, Social, and Governance factors using Gemini NLP |
| **Portfolio Simulator** | Build portfolios and analyze with Monte Carlo simulations (1,000 runs) |
| **ML Predictions** | Predict 1-year returns based on ESG scores and historical patterns |
| **Leaderboard** | Top 500 BSE companies ranked by ESG scores |
| **Company Analysis** | Detailed ESG breakdowns with radar charts and trend analysis |
| **Dark Mode** | Full dark/light theme support with system preference detection |

### Additional Features

- **Interactive Charts**: Recharts-based visualizations (Area, Bar, Pie, Radar)
- **Loading Animations**: 5.5-second branded loading screen with progress
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript on frontend, Pydantic schemas on backend

---

## System Architecture

### High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend (React + Vite)"]
        UI["React Components"]
        State["Context Providers"]
        Charts["Recharts Visualizations"]
    end

    subgraph Server["Backend (FastAPI)"]
        API["API Routes"]
        Auth["JWT Authentication"]
        Services["Business Logic"]
    end

    subgraph External["External Services"]
        Gemini["Google Gemini NLP"]
        Database["SQLite / PostgreSQL"]
    end

    Client -->|"REST API"| Server
    Server --> Database
    Server --> Gemini
    Services -->|"ESG Analysis"| Gemini
    Services -->|"Portfolio Optimization"| ML["ML Models"]
```

### Frontend Architecture

```mermaid
flowchart LR
    subgraph Frontend["/frontend"]
        App["App.tsx\n(Router + Providers)"]
        
        subgraph Context["Context Providers"]
            AuthC["AuthContext"]
            ThemeC["ThemeContext"]
        end
        
        subgraph Pages["Pages"]
            Landing["Landing.tsx"]
            Dashboard["Dashboard.tsx"]
            Portfolio["Portfolio.tsx"]
            Company["Company.tsx"]
            Auth["AuthPage.tsx"]
        end
        
        subgraph Components["Components"]
            Layout["Layout.tsx"]
            Charts["Charts.tsx"]
            Leaderboard["Leaderboard.tsx"]
            DarkMode["DarkModeToggle.tsx"]
            Loading["LoadingScreen.tsx"]
        end
        
        subgraph Lib["Libraries"]
            API["api.ts\n(Axios)"]
            Types["types/index.ts"]
        end
    end
    
    App --> Pages
    App --> Context
    Pages --> Components
    Components --> Charts
    Pages --> API
    API --> Types
```

### Backend Architecture

```mermaid
flowchart TB
    subgraph Backend["/backend"]
        Main["main.py\n(FastAPI App)"]
        
        subgraph API["API Routes"]
            AuthRoutes["/auth/*"]
            CompanyRoutes["/companies/*"]
            ScoreRoutes["/scores/*"]
            PortfolioRoutes["/portfolio/*"]
            HealthRoutes["/health"]
        end
        
        subgraph Services["Services"]
            NLP["nlp.py\n(Gemini NLP)"]
            ML["ml_scoring.py\n(ML Models)"]
        end
        
        subgraph Core["Core Modules"]
            Auth["auth.py\n(JWT + Bcrypt)"]
            Models["models.py\n(SQLAlchemy)"]
            Schemas["schemas.py\n(Pydantic)"]
            Database["database.py\n(Async DB)"]
            Config["config.py\n(Settings)"]
        end
    end
    
    Main --> AuthRoutes
    Main --> CompanyRoutes
    Main --> ScoreRoutes
    Main --> PortfolioRoutes
    Main --> HealthRoutes
    
    AuthRoutes --> Auth
    PortfolioRoutes --> ML
    CompanyRoutes --> NLP
    ScoreRoutes --> NLP
    NLP --> Services
    
    Core --> AuthRoutes
    Core --> CompanyRoutes
    Core --> ScoreRoutes
    Core --> PortfolioRoutes
```

---

## Project Structure

```
ESG_Scores/
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI application entry point
│   │   ├── config.py                 # Pydantic settings & environment config
│   │   ├── database.py               # Async SQLAlchemy setup
│   │   ├── models.py                 # SQLAlchemy ORM models
│   │   ├── schemas.py                # Pydantic DTOs
│   │   ├── auth.py                   # JWT & bcrypt authentication
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py             # All API endpoints
│   │   │   └── deps.py               # Dependencies (get_db, get_current_user)
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── nlp.py                # Gemini NLP service
│   │       └── ml_scoring.py         # ML models & portfolio optimizer
│   ├── venv/                         # Python virtual environment
│   └── requirements.txt
│
├── frontend/                         # React Frontend (Vite)
│   ├── src/
│   │   ├── main.tsx                  # App entry point
│   │   ├── App.tsx                   # Router & providers setup
│   │   ├── index.css                 # Tailwind + custom styles
│   │   ├── App.css                   # App-level styles
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Main layout with nav & footer
│   │   │   ├── Charts.tsx            # Recharts visualizations
│   │   │   ├── Leaderboard.tsx       # ESG leaderboard table
│   │   │   ├── DarkModeToggle.tsx    # Theme switcher
│   │   │   ├── LoadingScreen.tsx     # 5.5s animated loader
│   │   │   └── ui/                   # Shadcn UI components
│   │   ├── pages/
│   │   │   ├── Landing.tsx           # Marketing homepage
│   │   │   ├── Dashboard.tsx         # Leaderboard page
│   │   │   ├── Portfolio.tsx         # Portfolio simulator
│   │   │   ├── Company.tsx           # Company detail page
│   │   │   └── AuthPage.tsx          # Login/Register page
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Authentication state
│   │   │   └── ThemeContext.tsx      # Dark/Light mode state
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios API client
│   │   │   └── utils.ts              # Utility functions
│   │   └── types/
│   │       └── index.ts              # TypeScript interfaces
│   ├── index.html                    # HTML entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── install.sh                        # Installation script
├── run.sh                           # Startup script
├── stop.sh                          # Shutdown script
└── README.md                        # This file
```

---

## User Flow

### Anonymous User Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as Landing Page
    participant D as Dashboard
    participant C as Company Page
    participant P as Portfolio Page
    participant A as Auth Page

    U->>L: Visits homepage
    L->>U: Sees hero, features, leaderboard preview
    U->>D: Clicks "View Leaderboard"
    D->>U: Shows ESG rankings
    U->>C: Clicks on company
    C->>U: Shows company ESG details
    U->>P: Clicks "Portfolio Simulator"
    P->>U: Shows default portfolio
    U->>A: Clicks "Sign In"
    A->>U: Shows login/register form
```

### Registered User Flow

```mermaid
flowchart TD
    A[User Arrives] --> B[See Landing Page]
    B --> C{Click Sign In?}
    C -->|Yes| D[Login / Register]
    C -->|No| E[Browse as Guest]
    
    D --> F[Access Full Features]
    E --> G[Limited Features]
    
    F --> H[Portfolio Saved?]
    H -->|Yes| I[Load Saved Portfolio]
    H -->|No| J[Create New Portfolio]
    
    I --> K[Run Monte Carlo Simulation]
    J --> K
    
    K --> L[View Results]
    L --> M[Adjust Holdings]
    M --> K
    
    G --> N[View Leaderboard]
    G --> O[View Company Details]
    N --> P[Educational Tooltips]
    O --> P
```

### Portfolio Analysis Flow

```mermaid
flowchart LR
    subgraph Input["User Input"]
        H[Holdings] --> P[Portfolio Builder]
        S[Stocks] --> P
    end
    
    subgraph Processing["Backend Processing"]
        P --> MC[Monte Carlo\n1000 Simulations]
        P --> PM[Portfolio Metrics]
        P --> BC[Benchmark\nComparison]
        
        MC --> R[Results]
        PM --> R
        BC --> R
    end
    
    subgraph Output["Visualization"]
        R --> Chart[Area Chart]
        R --> Stats[4 Stats Cards]
        R --> Allocation[Pie Chart]
    end
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 19 |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **TanStack Query** | Data Fetching | 5.x |
| **React Router** | Routing | 7.x |
| **Recharts** | Charts | 2.x |
| **Axios** | HTTP Client | 1.x |
| **Lucide React** | Icons | 0.x |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **FastAPI** | Web Framework | 0.100+ |
| **Python** | Language | 3.13 |
| **SQLAlchemy** | ORM | 2.x |
| **Pydantic** | Validation | 2.x |
| **JWT** | Authentication | 0.25 |
| **Bcrypt** | Password Hashing | 4.x |
| **Google Gemini** | NLP Analysis | 1.x |
| **NumPy** | Numerical Computing | 1.26+ |

### Database

| Technology | Purpose |
|------------|---------|
| **SQLite** | Development (default) |
| **PostgreSQL** | Production (via async driver) |

### DevOps

| Tool | Purpose |
|------|---------|
| **Git** | Version Control |
| **Shell Scripts** | Automation (run.sh, stop.sh) |
| **Vite** | Development Server |

---

## API Documentation

### Authentication Endpoints

```mermaid
erDiagram
    AUTH ||--o{ USER : manages
    USER {
        int id PK
        string email UK
        string hashed_password
        string full_name
        boolean is_active
        datetime created_at
    }
    
    AUTH ||--o{ TOKEN : issues
    TOKEN {
        string access_token
        string token_type
    }
```

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login & get JWT | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Company & Score Endpoints

```mermaid
erDiagram
    COMPANY ||--o{ ESG_SCORE : has
    COMPANY {
        string bse_code PK
        string nse_code
        string company_name
        string sector
        string industry
        float market_cap
    }
    
    ESG_SCORE {
        int id PK
        int company_id FK
        float environmental_score
        float social_score
        float governance_score
        float esg_score
        float predicted_return
        float benchmark_vs_nifty50
        string sentiment_summary
    }
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/{bse_code}` | Get company details |
| GET | `/api/scores/{bse_code}` | Get ESG scores |
| GET | `/api/leaderboard` | Get ESG rankings |
| POST | `/api/analyze/{bse_code}` | Trigger NLP analysis |

### Portfolio Endpoints

```mermaid
erDiagram
    USER ||--o{ PORTFOLIO : owns
    PORTFOLIO ||--o{ PORTFOLIO_ITEM : contains
    PORTFOLIO_ITEM ||--o{ COMPANY : references
    
    PORTFOLIO {
        int id PK
        int user_id FK
        string name
        float total_value
    }
    
    PORTFOLIO_ITEM {
        int id PK
        int portfolio_id FK
        int company_id FK
        float shares
        float avg_cost
    }
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portfolio/analyze` | Analyze portfolio with Monte Carlo |
| GET | `/api/portfolio` | Get user's portfolios |
| POST | `/api/portfolio` | Create portfolio |
| PUT | `/api/portfolio/{id}` | Update portfolio |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health status |

---

## Database Schema

### Complete Entity Relationship

```mermaid
erDiagram
    USER ||--o{ PORTFOLIO : owns
    COMPANY ||--o{ ESG_SCORE : has
    COMPANY ||--o{ PORTFOLIO_ITEM : in_portfolio
    PORTFOLIO ||--o{ PORTFOLIO_ITEM : contains
    USER {
        int id PK
        string email UK
        string hashed_password
        string full_name
        boolean is_active
        datetime created_at
    }
    
    COMPANY {
        int id PK
        string bse_code UK
        string nse_code
        string company_name
        string sector
        string industry
        float market_cap
        string headquarters
        string website
        text description
    }
    
    ESG_SCORE {
        int id PK
        int company_id FK
        float environmental_score
        float social_score
        float governance_score
        float esg_score
        float predicted_return
        float benchmark_vs_nifty50
        float confidence_score
        text sentiment_summary
        json key_insights
    }
    
    PORTFOLIO {
        int id PK
        int user_id FK
        string name
        string description
        float total_value
    }
    
    PORTFOLIO_ITEM {
        int id PK
        int portfolio_id FK
        int company_id FK
        float shares
        float avg_cost
    }
```

---

## ML Models

### ESG Scoring Model

The platform uses a hybrid approach combining rule-based scoring with NLP:

```mermaid
flowchart TB
    subgraph Input["Company Data"]
        W["Website / Reports"]
        N["News Articles"]
        G["ESG Disclosures"]
    end
    
    subgraph NLP["NLP Analysis"]
        W --> Gemi["Gemini API"]
        N --> Gemi
        G --> Gemi
        Gemi -->|"Raw Analysis"| Extr["Entity Extraction"]
        Gemi -->|"Sentiment"| Sent["ESG Sentiment"]
    end
    
    subgraph Scoring["Scoring Engine"]
        Extr --> E["E Score (0-100)"]
        Extr --> S["S Score (0-100)"]
        Extr --> Gc["G Score (0-100)"]
        Sent --> E
        Sent --> S
        Sent --> Gc
        E --> ESG["ESG Score"]
        S --> ESG
        Gc --> ESG
    end
    
    subgraph Output["Final Score"]
        ESG --> Final["Final ESG (0-100)"]
        Final --> Pred["Predicted Return"]
        Final --> Bench["vs Nifty50"]
    end
```

### Monte Carlo Simulation

```mermaid
flowchart LR
    subgraph Input["Portfolio Data"]
        H[Holdings] --> V[Total Value]
        E[ESG Scores] --> B[ESG Bonus]
    end
    
    subgraph Simulation["1000 Simulations"]
        V --> R[Daily Returns]
        E --> R
        R --> C[Cumulative Returns]
        C --> A[Annual Returns]
    end
    
    subgraph Output["Statistics"]
        A --> Mean["Mean Return"]
        A --> Std["Std Deviation"]
        A --> VaR["VaR 95%"]
        A --> Prob["Prob Positive"]
        A --> Data["Simulation Data\n(252 points)"]
    end
```

---

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 18+
- pnpm (recommended) or npm

### Quick Start

```bash
# 1. Clone and navigate
cd ESG_Scores

# 2. Make scripts executable
chmod +x run.sh stop.sh status.sh

# 3. Start development servers
./run.sh

# 4. Open in browser
# Frontend: http://localhost:5173 (or 5174)
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Development Scripts

The project includes enhanced management scripts:

```bash
./run.sh      # Start both frontend and backend servers
./stop.sh     # Stop all running servers cleanly
./status.sh   # Check server status and health
```

**Features:**
- Automatic dependency installation
- Health checks for both services
- Graceful shutdown handling
- Process monitoring and cleanup
- Cross-platform compatibility

### Manual Installation

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm run dev
```

---

## Environment Variables

### Backend (.env)

```bash
# Required
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=sqlite+aiosqlite:///./esg_scores.db
# Or for PostgreSQL:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost/esg_scores

# NLP Service (Optional - uses keyword fallback if not set)
GEMINI_API_KEY=your-gemini-api-key

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

---

## Key Features Explained

### Monte Carlo Simulation

For beginners, the platform provides educational content explaining:

1. **What is Monte Carlo?**
   - Like predicting weather by running thousands of scenarios
   - Simulates 1,000 possible futures for your portfolio

2. **Understanding Metrics:**
   - **Mean Return**: Average outcome across all simulations
   - **Std Deviation**: How much returns vary (risk measure)
   - **VaR 95%**: Worst case scenario (95% of outcomes were better)
   - **Prob. Positive**: Percentage of profitable simulations

3. **Important Notes:**
   - Monte Carlo is probability, not prediction
   - Past performance ≠ future results
   - Higher ESG = better risk-adjusted returns historically

### ESG Scoring

| Factor | Weight | Description |
|--------|--------|-------------|
| Environmental | 35% | Climate impact, resource usage, pollution |
| Social | 30% | Labor practices, community, diversity |
| Governance | 35% | Board diversity, ethics, transparency |

---

## Future Enhancements

- [ ] Real-time stock data integration
- [ ] Social login (Google, GitHub)
- [ ] Email notifications for portfolio alerts
- [ ] Export reports to PDF
- [ ] Mobile app (React Native)
- [ ] Additional ML models for predictions
- [ ] Multi-language support

---

## License

MIT License - feel free to use for learning and production.

---

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Google Gemini](https://gemini.google.com/) - AI-powered NLP
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful component library
- [Recharts](https://recharts.org/) - React charting library

---

<div align="center">

**Built with love for sustainable investing**

*GreenVested - Invest in a Sustainable Future*

</div>
