import httpx
from typing import List, Dict, Any
import time

# Simple in-memory cache so we don't hit NVD repeatedly
# for the same service version
_cve_cache: Dict[str, List[Dict]] = {}

def lookup_cves(service: str, version: str) -> List[Dict[str, Any]]:
    """
    Looks up known CVEs for a given service and version
    using the public NVD (National Vulnerability Database) API.
    Returns a list of CVE summaries.
    """
    if not service or not version:
        return []

    # Build cache key
    cache_key = f"{service}:{version}".lower()

    # Return cached result if available
    if cache_key in _cve_cache:
        return _cve_cache[cache_key]

    try:
        # NVD API endpoint
        url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        params = {
            "keywordSearch": f"{service} {version}",
            "resultsPerPage": 5  # top 5 most relevant CVEs
        }

        # NVD has rate limiting — be respectful
        time.sleep(1)

        response = httpx.get(url, params=params, timeout=15)

        if response.status_code != 200:
            return []

        data = response.json()
        vulnerabilities = data.get("vulnerabilities", [])

        cves = []
        for vuln in vulnerabilities:
            cve_data = vuln.get("cve", {})
            cve_id = cve_data.get("id", "")

            # Get description
            descriptions = cve_data.get("descriptions", [])
            description = ""
            for desc in descriptions:
                if desc.get("lang") == "en":
                    description = desc.get("value", "")
                    break

            # Get CVSS score if available
            metrics = cve_data.get("metrics", {})
            score = None
            severity = None

            # Try CVSS v3.1 first, then v3.0, then v2
            for cvss_version in ["cvssMetricV31", "cvssMetricV30", "cvssMetricV2"]:
                if cvss_version in metrics and metrics[cvss_version]:
                    cvss_data = metrics[cvss_version][0]
                    cvss_score = cvss_data.get("cvssData", {})
                    score = cvss_score.get("baseScore")
                    severity = cvss_score.get("baseSeverity")
                    break

            if cve_id:
                cves.append({
                    "id": cve_id,
                    "description": description[:300],  # truncate long descriptions
                    "score": score,
                    "severity": severity
                })

        # Cache the result
        _cve_cache[cache_key] = cves
        return cves

    except Exception as e:
        print(f"CVE lookup failed for {service} {version}: {e}")
        return []
    