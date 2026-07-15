import nmap
from datetime import datetime
from typing import List, Dict, Any

def run_nmap_scan(target: str) -> List[Dict[str, Any]]:
    """
    Runs nmap -sV against the target and returns
    a list of raw finding dictionaries.
    """
    scanner = nmap.PortScanner()
    
    try:
        # -sV = service version detection
        # --open = only show open ports
        # -T4 = faster scan timing
        scanner.scan(target, arguments="-sT -sV -Pn --open -T4")
    except Exception as e:
        raise RuntimeError(f"nmap scan failed: {str(e)}")

    findings = []

    # Loop through all scanned hosts
    for host in scanner.all_hosts():
        # Loop through protocols (tcp, udp)
        for protocol in scanner[host].all_protocols():
            # Loop through all open ports
            ports = scanner[host][protocol].keys()
            for port in ports:
                port_data = scanner[host][protocol][port]

                # Only process open ports
                if port_data["state"] != "open":
                    continue

                service = port_data.get("name", "unknown")
                version = port_data.get("product", "")
                extra = port_data.get("version", "")
                service_version = f"{version} {extra}".strip() or None

                # Determine category
                if service in ["http", "https", "http-alt"]:
                    category = "web_service"
                elif service in ["ssh", "telnet", "ftp"]:
                    category = "remote_access"
                elif service in ["mysql", "postgresql", "mongodb", "redis"]:
                    category = "database"
                else:
                    category = "open_port"

                # Determine raw severity
                high_risk_ports = [21, 23, 3306, 5432, 27017, 6379, 3389]
                medium_risk_ports = [22, 80, 8080, 8443]

                if port in high_risk_ports:
                    raw_severity = "high"
                elif port in medium_risk_ports:
                    raw_severity = "medium"
                else:
                    raw_severity = "info"

                finding = {
                    "target": host,
                    "source_plugin": "nmap",
                    "category": category,
                    "port": port,
                    "service": service,
                    "service_version": service_version,
                    "raw_severity": raw_severity,
                    "description": f"Port {port}/{protocol} open running {service}"
                                   + (f" ({service_version})" if service_version else ""),
                    "evidence": str(port_data),
                    "discovered_at": datetime.utcnow()
                }

                findings.append(finding)

    return findings
