# Scannie — AI-Powered Network Security Scanner

Scannie is a full-stack security scanning platform that combines classic network reconnaissance tools with an AI triage layer. It scans a target for open ports, TLS/SSL misconfigurations, and web security header issues, then uses an LLM to prioritize findings against real CVE data and explain compound attack risks in plain English.

> ⚠️ **Scan only targets you have explicit permission to scan.** Scanning systems without authorization may be illegal.

---

## Features

- **Port & Service Discovery** — wraps `nmap` for TCP port scanning and service/version detection
- **TLS/SSL Analysis** — checks certificate expiry, self-signed certs, and weak protocol versions (TLS 1.0/1.1) using Python's `ssl` module
- **Web Misconfiguration Scanning** — detects missing security headers (CSP, HSTS, X-Frame-Options, etc.) and exposed sensitive paths
- **AI-Powered Triage (RAG)** — queries the NVD CVE database for service-specific vulnerabilities and injects CVSS scores + exploit descriptions into LLM prompts to generate context-aware priority scores and remediation steps
- **Hybrid Correlation Engine** — deterministic, rule-based detection of compound attack surfaces (e.g., exposed database port + missing HSTS + outdated SSH) paired with LLM-generated plain-English risk explanations
- **Automated Reporting** — generates executive summaries and detailed technical reports with prioritized, ranked action items; exportable as PDF
- **Scan History** — searchable, filterable dashboard of past scans with status, findings count, and duration
- **Async Scan Execution** — non-blocking background scans with real-time status polling from the frontend

---

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy (ORM), Alembic (migrations), PostgreSQL, JWT Authentication
**Frontend:** React, TypeScript, React Router
**Scanning:** nmap, Python `ssl` module, custom web misconfiguration scanner
**AI/LLM:** Groq (LLaMA models) for RAG-based triage and correlation reasoning
**Other:** REST API design, async background task execution

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   React     │◄────►│   FastAPI    │◄────►│   PostgreSQL     │
│  Frontend   │ REST │   Backend    │      │   (scans, users, │
└─────────────┘      └──────┬───────┘      │    findings)     │
                             │              └─────────────────┘
                 ┌───────────┼───────────┐
                 ▼           ▼           ▼
             ┌───────┐  ┌────────┐  ┌─────────┐
             │ nmap  │  │  TLS   │  │   Web   │
             │Scanner│  │Scanner │  │Misconfig│
             └───┬───┘  └───┬────┘  └────┬────┘
                 └──────────┼────────────┘
                            ▼
                 ┌────────────────────┐
                 │  Correlation Engine │
                 │ (rules + LLM layer) │
                 └──────────┬──────────┘
                            ▼
                 ┌────────────────────┐
                 │   AI Triage (RAG)   │
                 │  CVE lookup + Groq  │
                 └──────────┬──────────┘
                            ▼
                 ┌────────────────────┐
                 │  Report Generator   │
                 └────────────────────┘
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL
- nmap installed and available on PATH
- A Groq API key

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/scannie
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install

# Create a .env file with:
# VITE_API_URL=http://localhost:8000

npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Usage

1. Sign up / log in
2. Click **New Scan**, enter a target you have permission to scan
3. Select scanners (Port Scanner, TLS/SSL Checker, Web Misconfig Scanner)
4. Confirm the consent checkbox and launch the scan
5. View findings, correlated compound risks, and the AI-generated report once the scan completes
6. Browse past scans in **History**, with search and status filters

---

## Known Limitations

- The AI triage layer's severity descriptions occasionally overstate CVE impact (e.g., describing a crash/SSRF bug as remote code execution) — always cross-check cited CVEs against the actual NVD entry before acting on a finding
- CVE matching is based on service + version only; it does not account for target-specific configuration (e.g., whether a proxy setting that gates a vulnerability is actually enabled)
- AI-generated correlation explanations are non-deterministic between runs — the underlying rule-based detection is consistent, but wording will vary slightly each time

---

## Roadmap

- [ ] Deploy backend (Render) and frontend (Vercel)
- [ ] Expand correlation rule set
- [ ] Add authenticated scanning support
- [ ] CI/CD pipeline for automated testing

---
