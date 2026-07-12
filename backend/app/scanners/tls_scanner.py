import ssl
import socket
from datetime import datetime
from typing import List, Dict, Any

def run_tls_scan(target: str) -> List[Dict[str, Any]]:
    """
    Checks the TLS/SSL certificate and protocol
    configuration of the target on port 443.
    """
    findings = []
    port = 443

    # First check if port 443 is even reachable
    try:
        sock = socket.create_connection((target, port), timeout=10)
        sock.close()
    except Exception:
        # Port 443 not reachable — no TLS findings
        return findings

    # --- Check 1: Certificate validity ---
    try:
        context = ssl.create_default_context()
        with socket.create_connection((target, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=target) as ssock:
                cert = ssock.getpeercert()

                # Check expiry
                expiry_str = cert["notAfter"]
                expiry_date = datetime.strptime(
                    expiry_str, "%b %d %H:%M:%S %Y %Z"
                )

                if expiry_date < datetime.utcnow():
                    findings.append({
                        "target": target,
                        "source_plugin": "tls",
                        "category": "tls_issue",
                        "port": 443,
                        "service": "https",
                        "service_version": None,
                        "raw_severity": "high",
                        "description": f"TLS certificate expired on {expiry_str}",
                        "evidence": f"Certificate notAfter: {expiry_str}",
                        "discovered_at": datetime.utcnow()
                    })
                elif (expiry_date - datetime.utcnow()).days < 30:
                    findings.append({
                        "target": target,
                        "source_plugin": "tls",
                        "category": "tls_issue",
                        "port": 443,
                        "service": "https",
                        "service_version": None,
                        "raw_severity": "medium",
                        "description": f"TLS certificate expiring soon: {expiry_str}",
                        "evidence": f"Certificate notAfter: {expiry_str}",
                        "discovered_at": datetime.utcnow()
                    })

                # Check if self-signed
                issuer = dict(x[0] for x in cert.get("issuer", []))
                subject = dict(x[0] for x in cert.get("subject", []))

                if issuer == subject:
                    findings.append({
                        "target": target,
                        "source_plugin": "tls",
                        "category": "tls_issue",
                        "port": 443,
                        "service": "https",
                        "service_version": None,
                        "raw_severity": "high",
                        "description": "TLS certificate is self-signed",
                        "evidence": f"Issuer equals subject: {issuer}",
                        "discovered_at": datetime.utcnow()
                    })

    except ssl.SSLCertVerificationError as e:
        # Certificate verification failed
        findings.append({
            "target": target,
            "source_plugin": "tls",
            "category": "tls_issue",
            "port": 443,
            "service": "https",
            "service_version": None,
            "raw_severity": "high",
            "description": f"TLS certificate verification failed: {str(e)}",
            "evidence": str(e),
            "discovered_at": datetime.utcnow()
        })
    except Exception as e:
        print(f"TLS cert check failed: {e}")

    # --- Check 2: Weak protocol version ---
    try:
        # Try connecting with only TLS 1.0/1.1 allowed
        old_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        old_context.check_hostname = False
        old_context.verify_mode = ssl.CERT_NONE
        old_context.minimum_version = ssl.TLSVersion.TLSv1
        old_context.maximum_version = ssl.TLSVersion.TLSv1_1

        with socket.create_connection((target, port), timeout=10) as sock:
            with old_context.wrap_socket(sock, server_hostname=target) as ssock:
                protocol = ssock.version()
                findings.append({
                    "target": target,
                    "source_plugin": "tls",
                    "category": "tls_issue",
                    "port": 443,
                    "service": "https",
                    "service_version": None,
                    "raw_severity": "high",
                    "description": f"Server accepts weak TLS version: {protocol}",
                    "evidence": f"Successfully connected using {protocol}",
                    "discovered_at": datetime.utcnow()
                })
    except ssl.SSLError:
        # Good — server rejected old TLS versions
        pass
    except Exception as e:
        print(f"TLS version check failed: {e}")

    return findings
