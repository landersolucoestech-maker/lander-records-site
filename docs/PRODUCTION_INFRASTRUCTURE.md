# Production infrastructure readiness

Status: **NOT READY — deployment blocked**. This document records repository evidence as of commit `a6145b0`; it does not authorize deployment, DNS changes, production access, restart, backup or migration.

## What is known

- The application is Next.js 16.3.3 with `output: "standalone"`, PostgreSQL and optional Supabase Storage/integrations.
- GitHub has environments named `Production` and `github-pages`. `Production` currently has no protection rules or branch policy. No repository Actions secrets or variables are configured.
- GitHub Pages is externally configured as legacy Pages from `dev` `/`, HTTPS enforced, without a custom domain. No current workflow owns it.
- Repository examples assume a conventional Linux host, Nginx, systemd and a loopback Node listener. They are templates, not proof of the IONOS product or server state.
- The real IONOS product, OS, architecture, hostname/IP, SSH port/user, sudo policy, firewall, installed services, proxy, domain and database/PITR state are **unknown**.

## Target architecture (conditional on a Linux VPS/cloud/dedicated server)

```text
Internet :80/:443 -> Nginx -> 127.0.0.1:3000 -> systemd -> standalone Next.js
                                   |
                                   +-> PostgreSQL over TLS/private network
```

Canonical proposal:

- service user: `landerrecords` (no interactive root runtime);
- root: `/var/www/lander-records`;
- immutable releases: `/var/www/lander-records/releases/<full-sha>`;
- active symlink: `/var/www/lander-records/current`;
- shared secrets: `/var/www/lander-records/shared/.env.production`, owner-readable only (`0600`);
- release evidence: `/var/www/lander-records/shared/release-evidence`;
- backups: `/var/backups/lander-records`, restricted and copied to an independently protected destination;
- internal application port: `3000`, bound to `127.0.0.1` only;
- process manager: systemd; reverse proxy: Nginx; TLS: existing IONOS certificate or Let's Encrypt with automatic renewal, selected only after inspecting the host.

Do not install this design on shared hosting or a managed runtime without adapting it to the actual IONOS product.

## Access matrix

| Resource | Current evidence | Required | Safe configuration |
|---|---|---:|---|
| IONOS host/product | Unknown | Yes | Owner identifies product; read-only inventory over SSH first |
| SSH host/port/user | Not configured in GitHub | Yes | Dedicated deploy user/key; non-default port as variable |
| SSH host fingerprint | Not configured | Yes | Verify out-of-band; store SHA256 fingerprint as Environment secret |
| sudo | Unknown | Conditional | Narrow sudoers command for the one systemd unit; never unrestricted |
| GitHub `Production` | Exists, unprotected | Yes | Required reviewer, deployment branch/tag policy, no admin bypass where practical |
| Repository secrets | None | Yes | Put production values in `Production` Environment, not repository-wide |
| Node runtime | Repo pins major 24 | Yes | Install Node 24 LTS; verify exact patch before first release |
| Reverse proxy/TLS | Unknown | Yes | Inspect existing server before choosing/installing Nginx/certificate |
| Domain/DNS | Unknown; Pages has no CNAME | Yes | Inventory A/AAAA/CNAME/TTL; change only during approved cutover |
| PostgreSQL/PITR | Unknown | Yes | Provider evidence, TLS, least privilege, retention and restore window |

## Network and host baseline

Future inventory must record `uname -a`, `/etc/os-release`, `hostnamectl`, architecture, public/private addresses, listening sockets, firewall rules, disk/RAM, Node/npm/PostgreSQL client versions, Docker, Nginx/Apache/Caddy, systemd units and application directories. Read-only commands only until the owner approves configuration.

Expected public ports are 80/443 and a restricted SSH port. Port 3000 must not be publicly reachable. Database ingress must be restricted to the application/rehearsal source and require TLS where remote.

## GitHub configuration still required

Create these in the **Production Environment**, not in source:

- secrets: `IONOS_HOST`, `IONOS_USER`, `IONOS_SSH_KEY`, `IONOS_HOST_FINGERPRINT`;
- variable: `IONOS_SSH_PORT`;
- fail-closed variable: keep `PRODUCTION_DEPLOY_ENABLED` absent/false during readiness. The current workflow intentionally fails even if it is set; replace that blocking job with the reviewed host-specific atomic implementation only in a separately authorized round.

The runtime/database secrets stay on the host in protected files; they do not need to traverse the SSH action. Add required reviewers and restrict deployments to an explicitly approved production ref. `dev` must not deploy automatically.

## DNS, HTTPS and Pages

No DNS change is authorized. Before cutover, capture current authoritative DNS, A/AAAA/CNAME records, TTL and target IP; validate TLS on a temporary hostname; then schedule an approved low-TTL cutover and retain rollback records. Disable legacy GitHub Pages through repository Settings only if the owner confirms it is unused. It is not official production.
