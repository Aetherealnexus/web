PR Preparation Checklist — Aethereal Nexus

1. Create a branch from `main` named `perf/audit-<short-desc>` (example: `perf/audit-fonts-images`).

```bash
# from repo root
git checkout -b perf/audit-fonts-images
```

2. Ensure working tree is clean and run local audits (see `scripts/run-local-audit.sh`).

3. Commit changes with clear message:

```
git add .
git commit -m "chore(perf): run pre-PR audit and prepare assets/instructions"
```

4. Push branch:

```
git push -u origin perf/audit-fonts-images
```

5. Open a Pull Request on GitHub. The CI workflow (`.github/workflows/ci.yml`) will run Lighthouse + pa11y and attach reports.

Optional: If you want me to prepare the branch locally and create draft PR contents for you to push, tell me and I will create a patch you can apply.
