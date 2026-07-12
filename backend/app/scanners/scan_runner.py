from app.db.session import SessionLocal
from app.db.crud import update_scan_status, create_finding
from app.scanners.nmap_scanner import run_nmap_scan
from app.scanners.tls_scanner import run_tls_scan
from app.scanners.web_scanner import run_web_scan

def run_full_scan(scan_id: str, target: str, plugins_used: list):
    db = SessionLocal()

    try:
        update_scan_status(db, scan_id, "running")

        all_findings = []
        open_ports = []

        # Step 1: nmap — always runs first
        if "nmap" in plugins_used:
            try:
                nmap_findings = run_nmap_scan(target)
                all_findings.extend(nmap_findings)
                # Extract open ports for other scanners to use
                open_ports = [f["port"] for f in nmap_findings if f.get("port")]
                print(f"nmap found {len(nmap_findings)} findings")
            except Exception as e:
                print(f"nmap scanner failed: {e}")

        # Step 2: TLS — only if port 443 found open by nmap
        if "tls" in plugins_used:
            if 443 in open_ports or "nmap" not in plugins_used:
                try:
                    tls_findings = run_tls_scan(target)
                    all_findings.extend(tls_findings)
                    print(f"TLS scanner found {len(tls_findings)} findings")
                except Exception as e:
                    print(f"TLS scanner failed: {e}")
            else:
                print("TLS scanner skipped — port 443 not open")

        # Step 3: Web — only if port 80 or 443 found open by nmap
        if "web" in plugins_used:
            if any(p in open_ports for p in [80, 443, 8080, 8443]) \
                    or "nmap" not in plugins_used:
                try:
                    web_findings = run_web_scan(target)
                    all_findings.extend(web_findings)
                    print(f"Web scanner found {len(web_findings)} findings")
                except Exception as e:
                    print(f"Web scanner failed: {e}")
            else:
                print("Web scanner skipped — no web ports open")

        # Save all findings
        for finding_data in all_findings:
            create_finding(db, finding_data, scan_id)

        print(f"Scan {scan_id} complete. Total findings: {len(all_findings)}")
        update_scan_status(db, scan_id, "completed")

    except Exception as e:
        print(f"Scan {scan_id} failed: {e}")
        update_scan_status(db, scan_id, "failed", error_message=str(e))

    finally:
        db.close()
        