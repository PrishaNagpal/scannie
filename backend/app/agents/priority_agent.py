from groq import Groq
from app.core.config import settings
from app.agents.cve_lookup import lookup_cves
from typing import Dict, Any
import json

client = Groq(api_key=settings.GROQ_API_KEY)

def run_priority_agent(finding: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes a single finding dictionary and returns
    AI-generated priority, reasoning, and suggested fix.
    """
    # Step 1: Look up CVEs if we have service version info
    cves = []
    if finding.get("service") and finding.get("service_version"):
        cves = lookup_cves(
            finding["service"],
            finding["service_version"]
        )

    # Step 2: Build the prompt
    cve_context = ""
    if cves:
        cve_lines = []
        for cve in cves:
            line = f"- {cve['id']}"
            if cve.get('score'):
                line += f" (CVSS: {cve['score']}, {cve.get('severity', 'N/A')})"
            if cve.get('description'):
                line += f": {cve['description'][:150]}"
            cve_lines.append(line)
        cve_context = "Known CVEs for this service version:\n" + "\n".join(cve_lines)
    else:
        cve_context = "No CVE data available for this finding."

    prompt = f"""You are a cybersecurity expert analyzing a security scan finding.
Analyze this finding and provide a priority assessment.

FINDING DETAILS:
- Target: {finding.get('target', 'unknown')}
- Category: {finding.get('category', 'unknown')}
- Port: {finding.get('port', 'N/A')}
- Service: {finding.get('service', 'unknown')}
- Service Version: {finding.get('service_version', 'unknown')}
- Raw Severity: {finding.get('raw_severity', 'unknown')}
- Description: {finding.get('description', '')}

{cve_context}

Respond with ONLY a valid JSON object, no other text, no markdown:
{{
    "priority": "high" or "medium" or "low" or "info",
    "reasoning": "2-3 sentence explanation of why this priority was assigned",
    "suggested_fix": "specific actionable fix for this finding"
}}"""

    # Step 3: Call Groq API
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,  # low temperature = more consistent outputs
            max_tokens=500
        )

        raw_response = response.choices[0].message.content.strip()

        # Step 4: Parse JSON response
        # Clean up any accidental markdown
        if "```json" in raw_response:
            raw_response = raw_response.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_response:
            raw_response = raw_response.split("```")[1].split("```")[0].strip()

        result = json.loads(raw_response)

        # Validate required fields exist
        if "priority" not in result:
            result["priority"] = finding.get("raw_severity", "info")
        if "reasoning" not in result:
            result["reasoning"] = "Unable to generate reasoning"
        if "suggested_fix" not in result:
            result["suggested_fix"] = "Review and remediate this finding"

        # Validate priority is one of the allowed values
        allowed = ["high", "medium", "low", "info"]
        if result["priority"] not in allowed:
            result["priority"] = finding.get("raw_severity", "info")

        return result

    except json.JSONDecodeError:
        # LLM didn't return valid JSON — use fallback
        return {
            "priority": finding.get("raw_severity", "info"),
            "reasoning": "Automated analysis unavailable — using rule-based severity",
            "suggested_fix": "Manual review required"
        }
    except Exception as e:
        print(f"Priority agent failed: {e}")
        return {
            "priority": finding.get("raw_severity", "info"),
            "reasoning": f"Analysis failed: {str(e)}",
            "suggested_fix": "Manual review required"
        }
    