from app.db.session import SessionLocal
from app.db.crud import update_scan_status, create_finding, update_finding_ai_results
from app.scanners.nmap_scanner import run_nmap_scan
from app.scanners.tls_scanner import run_tls_scan
from app.scanners.web_scanner import run_web_scan
from app.agents.priority_agent import run_priority_agent
import socket
from app.agents.correlation_engine import run_correlation_engine
from app.db.crud import update_finding_correlation

def run_full_scan(scan_id: str, target: str, plugins_used: list):
    db = SessionLocal()

    try:
        # Resolve domain to IP once
        try:
            resolved_target = socket.gethostbyname(target)
            print(f"Resolved {target} to {resolved_target}")
        except socket.gaierror:
            resolved_target = target

        update_scan_status(db, scan_id, "running")

        all_findings = []
        open_ports = []

        # Step 1: nmap
        if "nmap" in plugins_used:
            try:
                nmap_findings = run_nmap_scan(resolved_target)
                all_findings.extend(nmap_findings)
                open_ports = [f["port"] for f in nmap_findings if f.get("port")]
                print(f"nmap found {len(nmap_findings)} findings")
            except Exception as e:
                print(f"nmap scanner failed: {e}")

        # Step 2: TLS
        if "tls" in plugins_used:
            if 443 in open_ports or "nmap" not in plugins_used:
                try:
                    tls_findings = run_tls_scan(resolved_target)
                    all_findings.extend(tls_findings)
                    print(f"TLS scanner found {len(tls_findings)} findings")
                except Exception as e:
                    print(f"TLS scanner failed: {e}")
            else:
                print("TLS scanner skipped — port 443 not open")

        # Step 3: Web
        if "web" in plugins_used:
            if any(p in open_ports for p in [80, 443, 8080, 8443]) \
                    or "nmap" not in plugins_used:
                try:
                    web_findings = run_web_scan(resolved_target)
                    all_findings.extend(web_findings)
                    print(f"Web scanner found {len(web_findings)} findings")
                except Exception as e:
                    print(f"Web scanner failed: {e}")
            else:
                print("Web scanner skipped — no web ports open")

        # Step 4: Save all findings to DB
        saved_findings = []
        for finding_data in all_findings:
            saved = create_finding(db, finding_data, scan_id)
            saved_findings.append(saved)

        print(f"Saved {len(saved_findings)} findings. Running AI triage...")

# Step 5: Run AI triage on each finding
        for saved_finding in saved_findings:
            try:
                finding_dict = {
                    "id": saved_finding.id,
                    "target": saved_finding.target,
                    "category": saved_finding.category,
                    "port": saved_finding.port,
                    "service": saved_finding.service,
                    "service_version": saved_finding.service_version,
                    "raw_severity": saved_finding.raw_severity,
                    "description": saved_finding.description
                }

                ai_result = run_priority_agent(finding_dict)

                update_finding_ai_results(
                    db,
                    saved_finding.id,
                    ai_priority=ai_result["priority"],
                    ai_reasoning=ai_result["reasoning"],
                    suggested_fix=ai_result["suggested_fix"]
                )

                print(f"AI triage complete for port {saved_finding.port}: "
                      f"{ai_result['priority']}")

            except Exception as e:
                print(f"AI triage failed for finding {saved_finding.id}: {e}")
                continue

        # Step 6: Run correlation engine
        print("Running correlation engine...")
        try:
            correlations = run_correlation_engine(saved_findings)
            for correlation in correlations:
                update_finding_correlation(
                    db,
                    correlation["finding_id"],
                    correlation["correlation_group_id"],
                    correlation["correlation_reason"]
                )
            print(f"Correlation engine found {len(correlations)} correlations")
        except Exception as e:
            print(f"Correlation engine failed: {e}")

        print(f"Scan {scan_id} complete. Total findings: {len(saved_findings)}")
        update_scan_status(db, scan_id, "completed")

    except Exception as e:
        print(f"Scan {scan_id} failed: {e}")
        update_scan_status(db, scan_id, "failed", error_message=str(e))

    finally:
        db.close()
        