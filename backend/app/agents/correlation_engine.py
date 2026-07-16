from typing import List, Dict, Any
from groq import Groq
from app.core.config import settings
import uuid

client = Groq(api_key=settings.GROQ_API_KEY)

# Define dangerous combinations as rules
# Each rule has: a name, conditions that must ALL be true, and a description
CORRELATION_RULES = [
    {
        "name": "exposed_database_no_tls",
        "description": "Database port exposed with no TLS encryption",
        "conditions": [
            lambda f: f["category"] == "database",
            lambda f: f["category"] == "tls_issue" or
                      f["description"] and "Strict-Transport-Security" in f.get("description", "")
        ]
    },
    {
        "name": "old_ssh_no_security_headers",
        "description": "Outdated SSH with missing web security headers",
        "conditions": [
            lambda f: f["service"] == "ssh" if f.get("service") else False,
            lambda f: f["category"] == "misconfig"
        ]
    },
    {
        "name": "telnet_open",
        "description": "Telnet service exposed — completely unencrypted remote access",
        "conditions": [
            lambda f: f.get("port") == 23
        ]
    },
    {
        "name": "http_no_hsts",
        "description": "HTTP running without Strict Transport Security",
        "conditions": [
            lambda f: f.get("service") == "http",
            lambda f: "Strict-Transport-Security" in f.get("description", "")
        ]
    },
    {
        "name": "multiple_high_severity",
        "description": "Multiple high severity findings on same target",
        "conditions": [
            lambda f: f.get("ai_priority") == "high",
            lambda f: f.get("ai_priority") == "high"
        ]
    }
]

def run_correlation_engine(
    findings: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Takes a list of finding dictionaries.
    Returns the same list with correlation_group_id
    and correlation_reason filled in where applicable.
    """
    if not findings:
        return findings

    # Convert SQLAlchemy objects to dicts if needed
    finding_dicts = []
    for f in findings:
        if hasattr(f, "__dict__"):
            finding_dicts.append({
                "id": f.id,
                "target": f.target,
                "category": f.category,
                "port": f.port,
                "service": f.service,
                "service_version": f.service_version,
                "raw_severity": f.raw_severity,
                "ai_priority": f.ai_priority,
                "description": f.description,
                "source_plugin": f.source_plugin
            })
        else:
            finding_dicts.append(f)

    correlated = []

    # Check rule: multiple high severity findings
    high_severity = [
        f for f in finding_dicts
        if f.get("ai_priority") == "high" or f.get("raw_severity") == "high"
    ]

    if len(high_severity) >= 2:
        group_id = str(uuid.uuid4())
        reason = generate_correlation_reason(
            high_severity,
            "Multiple high severity findings detected on the same target"
        )
        for f in high_severity:
            correlated.append({
                "finding_id": f["id"],
                "correlation_group_id": group_id,
                "correlation_reason": reason
            })

    # Check rule: database exposed
    db_findings = [
        f for f in finding_dicts
        if f.get("category") == "database"
    ]
    misconfig_findings = [
        f for f in finding_dicts
        if f.get("category") == "misconfig"
    ]

    if db_findings and misconfig_findings:
        group_id = str(uuid.uuid4())
        combined = db_findings + misconfig_findings
        reason = generate_correlation_reason(
            combined,
            "Database exposed alongside web misconfigurations"
        )
        for f in combined:
            correlated.append({
                "finding_id": f["id"],
                "correlation_group_id": group_id,
                "correlation_reason": reason
            })

    # Check rule: old remote access + missing security headers
    remote_access = [
        f for f in finding_dicts
        if f.get("category") == "remote_access"
    ]

    if remote_access and misconfig_findings:
        group_id = str(uuid.uuid4())
        combined = remote_access + misconfig_findings
        reason = generate_correlation_reason(
            combined,
            "Outdated remote access service combined with missing security headers"
        )
        for f in combined:
            correlated.append({
                "finding_id": f["id"],
                "correlation_group_id": group_id,
                "correlation_reason": reason
            })

    # Check rule: telnet open
    telnet = [f for f in finding_dicts if f.get("port") == 23]
    if telnet:
        group_id = str(uuid.uuid4())
        reason = generate_correlation_reason(
            telnet,
            "Telnet is completely unencrypted and should never be exposed"
        )
        for f in telnet:
            correlated.append({
                "finding_id": f["id"],
                "correlation_group_id": group_id,
                "correlation_reason": reason
            })

    return correlated


def generate_correlation_reason(
    findings: List[Dict[str, Any]],
    context: str
) -> str:
    """
    Uses LLM to generate a plain English explanation
    of why this combination of findings is dangerous.
    """
    finding_summary = "\n".join([
        f"- {f.get('description', 'Unknown finding')} "
        f"(severity: {f.get('ai_priority') or f.get('raw_severity', 'unknown')})"
        for f in findings
    ])

    prompt = f"""You are a cybersecurity expert. Explain in 2-3 sentences why 
this combination of security findings is dangerous and what an attacker could do.

Context: {context}

Findings:
{finding_summary}

Respond with ONLY the explanation text, no headers, no bullets, no JSON."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Multiple findings compound risk: {context}"
    