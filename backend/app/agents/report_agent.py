from typing import List, Dict, Any
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def generate_report(
    scan: Dict[str, Any],
    findings: List[Dict[str, Any]]
) -> Dict[str, str]:
    """
    Takes scan details and all findings,
    generates executive summary + technical report.
    """
    if not findings:
        return {
            "executive_summary": "No security findings were detected during this scan.",
            "technical_report": "The scan completed without identifying any security issues."
        }

    # Count by severity
    high = [f for f in findings if f.get("ai_priority") == "high"
            or f.get("raw_severity") == "high"]
    medium = [f for f in findings if f.get("ai_priority") == "medium"
              or f.get("raw_severity") == "medium"]
    low = [f for f in findings if f.get("ai_priority") == "low"
           or f.get("raw_severity") == "low"]

    # Build findings summary for prompt
    findings_text = ""
    for f in findings:
        priority = f.get("ai_priority") or f.get("raw_severity", "info")
        findings_text += f"\n[{priority.upper()}] {f.get('description', '')}"
        if f.get("ai_reasoning"):
            findings_text += f"\n  Reasoning: {f.get('ai_reasoning')}"
        if f.get("suggested_fix"):
            findings_text += f"\n  Fix: {f.get('suggested_fix')}"
        findings_text += "\n"

    # Executive summary prompt
    exec_prompt = f"""You are a cybersecurity consultant writing an executive summary 
for a non-technical audience.

Scan target: {scan.get('target')}
Total findings: {len(findings)} ({len(high)} high, {len(medium)} medium, {len(low)} low)

Key findings:
{findings_text[:1000]}

Write a 3-4 sentence executive summary explaining:
1. What was scanned
2. Overall security posture
3. Most critical issues
4. Recommended immediate actions

Use plain English, no technical jargon. No headers, just paragraphs."""

    # Technical report prompt
    tech_prompt = f"""You are a cybersecurity engineer writing a technical report.

Scan target: {scan.get('target')}
Scan time: {scan.get('created_at')}
Plugins used: {scan.get('plugins_used')}
Total findings: {len(findings)}

All findings:
{findings_text}

Write a detailed technical report with:
1. Summary of scan methodology
2. Finding-by-finding breakdown with remediation steps
3. Prioritized action items

Be specific and technical. Use clear sections."""

    try:
        # Generate executive summary
        exec_response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": exec_prompt}],
            temperature=0.3,
            max_tokens=400
        )
        executive_summary = exec_response.choices[0].message.content.strip()

        # Generate technical report
        tech_response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": tech_prompt}],
            temperature=0.3,
            max_tokens=1500
        )
        technical_report = tech_response.choices[0].message.content.strip()

        return {
            "executive_summary": executive_summary,
            "technical_report": technical_report
        }

    except Exception as e:
        return {
            "executive_summary": f"Report generation failed: {str(e)}",
            "technical_report": "Manual review required."
        }
    