import requests
from datetime import datetime
from typing import List, Dict, Any

# Disable SSL warnings for intentionally checking bad certs
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SECURITY_HEADERS = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "Referrer-Policy",
    "Permissions-Policy"
]

SENSITIVE_PATHS = [
    "/.env",
    "/.git/config",
    "/admin",
    "/admin/",
    "/wp-admin/",
    "/phpinfo.php",
    "/.htaccess",
    "/config.php",
    "/backup.sql",
    "/robots.txt"
]

def run_web_scan(target: str) -> List[Dict[str, Any]]:
    """
    Checks for missing security headers and
    exposed sensitive paths on the target web server.
    """
    findings = []

    # Try HTTPS first, fall back to HTTP
    for scheme in ["https", "http"]:
        base_url = f"{scheme}://{target}"
        try:
            response = requests.get(
                base_url,
                timeout=10,
                verify=False,
                allow_redirects=True
            )
            break
        except requests.exceptions.ConnectionError:
            continue
        except Exception:
            continue
    else:
        # Neither HTTP nor HTTPS reachable
        return findings

    # --- Check 1: Missing security headers ---
    for header in SECURITY_HEADERS:
        if header.lower() not in [h.lower() for h in response.headers]:
            severity = "medium"
            if header == "Strict-Transport-Security":
                severity = "high"
            elif header == "Content-Security-Policy":
                severity = "medium"
            else:
                severity = "low"

            findings.append({
                "target": target,
                "source_plugin": "web",
                "category": "misconfig",
                "port": 443 if scheme == "https" else 80,
                "service": scheme,
                "service_version": None,
                "raw_severity": severity,
                "description": f"Missing security header: {header}",
                "evidence": f"Header '{header}' not present in response. "
                           f"Present headers: {list(response.headers.keys())}",
                "discovered_at": datetime.utcnow()
            })

    # --- Check 2: Exposed sensitive paths ---
    for path in SENSITIVE_PATHS:
        try:
            url = f"{base_url}{path}"
            resp = requests.get(
                url,
                timeout=5,
                verify=False,
                allow_redirects=False
            )

            if resp.status_code == 200:
                severity = "high"
                if path == "/robots.txt":
                    severity = "info"

                findings.append({
                    "target": target,
                    "source_plugin": "web",
                    "category": "misconfig",
                    "port": 443 if scheme == "https" else 80,
                    "service": scheme,
                    "service_version": None,
                    "raw_severity": severity,
                    "description": f"Sensitive path exposed: {path}",
                    "evidence": f"GET {url} returned HTTP {resp.status_code}. "
                               f"Response length: {len(resp.content)} bytes",
                    "discovered_at": datetime.utcnow()
                })

        except Exception:
            continue

    return findings
