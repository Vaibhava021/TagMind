# TagMind — Backend and Multi-Platform Roadmap

**Project:** TagMind — Intelligent Bookmark Manager  
**Extension:** Bookmark Companion  
**Status:** Proposed roadmap; version numbers are milestones, not claims of completed releases.  
**Stack:** React, Vite, Tailwind CSS, Django REST Framework, SQLite.  
**Architecture priority:** Cloud-first, local-second for the extension. Website and PWA support comes after the extension is stable.  
**Database decision:** SQLite. PostgreSQL is excluded from this plan.

## 1. Product goals

1. The Chrome extension works without users manually running a server or typing commands.
2. The extension tries the hosted cloud API first.
3. If cloud access fails, the extension may use a local backend fallback once the companion/launcher is implemented.
4. Preserve existing profile selection, navigation, session restoration, bookmarks, folders, tags, and vault behaviour.
5. Add website and PWA support only after the extension is stable.
6. Keep Django REST Framework and SQLite.
7. Preserve existing endpoint prefixes such as `/api/bookmarks/` and `/api/accounts/`.

## 2. Target architecture

### Phase A — Cloud-first extension

```text
Chrome Extension
       |
       | Try cloud API first
       v
Hosted Django REST API
       |
       v
SQLite on persistent hosted storage

If cloud is unavailable (after fallback is implemented):
Chrome Extension -> Local companion/launcher -> Local Django API -> Local SQLite
```

**Important:** A browser extension cannot independently launch an arbitrary local executable. Automatic local fallback needs an installed companion mechanism, such as a native-messaging host or installer-managed background process. Until that is implemented and tested, do not claim automatic local fallback is available.

### Phase B — Website and PWA

```text
Chrome Extension ─┐
Website ──────────┼──> Shared hosted Django REST API ──> SQLite
PWA ──────────────┘
```

The website/PWA should use the hosted API. A website or PWA cannot automatically access a user's local Django server from every device. Any local mode must be explicitly designed.

## 3. SQLite deployment requirements

SQLite remains the chosen database because it is lightweight and widely supported. The following are required for a hosted deployment:

- Store the SQLite database file on **persistent storage**, not an ephemeral filesystem.
- Keep one authoritative database file per environment.
- Configure regular backups and test restoration.
- Never expose the database file through the web server.
- Use Django migrations for schema changes.
- Keep write transactions short and handle database-busy/locking errors.
- Test expected simultaneous use and monitor write contention.

SQLite supports multiple readers well but has more limited concurrent-write behaviour than a client/server database. This is a capacity consideration to test, not a planned migration to PostgreSQL. Local SQLite on a phone does not automatically sync with a hosted SQLite database; offline access and sync need their own design.

---

# 4. Versioned implementation plan

## v0.8.0 — Startup-gate baseline

**Goal:** Preserve the current working implementation as a rollback point.

- [ ] Confirm startup gate runs before app data requests.
- [ ] Confirm timeout/error UI appears without a blank popup.
- [ ] Confirm original `navigate()` behaviour is preserved.
- [ ] Confirm `chrome.storage.session` restores the selected profile when the popup reopens during the same browser session.
- [ ] Build extension and website targets with existing scripts.
- [ ] Test the built extension, not only the development build.
- [ ] Commit the baseline and tag it if tags are part of the release process.

**Acceptance:** Existing profile/navigation/bookmark behaviour works, and backend failure is shown clearly.

Suggested commit: `feat: add backend startup gate and timeout screen`

## v0.8.1 — Account-state reliability

**Goal:** Fix `No UserName` after backend recovery.

- [1] Keep `accounts` state in `App` as the single source of truth.
- [1] Create one `refreshAccounts()` function in `App` to fetch `/api/accounts/profiles/`.
- [ ] Refresh account data after the backend is ready.
- [1] Pass `accounts` to `ProfileSelector` and `Dashboard` through props.
- [1] Pass `accounts` from `Dashboard` to `StatsPanel`.
- [1] Call `refreshAccounts()` after successful registration/login or account changes.
- [ ] Handle failed requests without permanently treating temporary failure as an empty account list.
- [1] Compare selected profile and account IDs consistently.

**Acceptance:** Username recovers without logout/login; profile selection, dashboard, login, logout, and registration still work.

## v0.9.0 — Cloud API foundation

**Goal:** Deploy Django for staging and use SQLite on persistent storage.

- [ ] Choose a host that supports persistent disk/volume storage for SQLite.
- [ ] Deploy Django REST Framework to a test environment.
- [ ] Store secrets and production environment variables outside source control.
- [ ] Configure HTTPS, allowed hosts, and required CORS/origin rules.
- [ ] Audit authentication and authorization on every data endpoint.
- [ ] Preserve `/api/bookmarks/` and `/api/accounts/` routes unless a separate migration is approved.
- [ ] Verify the health endpoint returns small JSON and reveals no secrets.
- [ ] Verify the SQLite file survives restart and redeployment.
- [ ] Configure backups and test restoring one.
- [ ] Test API operations against the hosted backend before changing the production extension.

**Acceptance:** Hosted HTTPS API works; data persists across restarts; user data is properly isolated; backups are restorable; secrets and database files are not committed.

## v0.9.1 — Cloud-first extension configuration

**Goal:** Make the hosted API the production default.

- [ ] Separate development and production API configuration.
- [ ] Use the hosted HTTPS API in production builds.
- [ ] Keep localhost configuration for development only.
- [ ] Check production bundles for accidental `localhost`/`127.0.0.1` URLs.
- [ ] Test Google/email authentication against the hosted API.
- [ ] Test bookmark, folder, tag, search, vault, profile, and account operations.
- [ ] Test a clean browser profile and, if possible, a second machine.
- [ ] Provide clear, recoverable network-error UI.

**Acceptance:** The installed extension works with no local server running and uses the hosted backend for all essential operations.

## v0.9.2 — Local fallback design

**Goal:** Define local fallback without silently mixing cloud and local data.

- [ ] Define which cloud failures permit fallback; authentication/permission errors must not automatically trigger it.
- [ ] Define how cloud and local profiles/identities map.
- [ ] Decide whether local mode is an isolated store or supports explicit synchronisation.
- [ ] Do not silently merge databases.
- [ ] Design conflict handling before building sync.
- [ ] Select and document the local companion/launcher mechanism.
- [ ] Design installation, update, uninstall, and recovery.
- [ ] Separate local and cloud credentials securely.
- [ ] Show the active mode (Cloud or Local) in the UI.

**Acceptance:** Cloud is tried first; fallback rules are documented; users can tell which data store they are using; no manual terminal commands are needed after companion setup.

## v0.9.3 — Local launcher and reliability

**Goal:** Make the optional local backend usable without manual commands.

- [ ] Package the local Django runtime and required files.
- [ ] Use a stable, user-writable path for local SQLite.
- [ ] Prevent multiple backend instances when the extension popup is reopened.
- [ ] Implement health checks, bounded retries, and useful failure messages.
- [ ] Handle an already-running server, occupied ports, missing files, and permission errors.
- [ ] Add diagnostic logs without tokens or sensitive bookmark data.
- [ ] Define installation, update, uninstall, and recovery procedures.

**Acceptance:** After initial setup, users do not need a terminal; reopening the extension does not create duplicate backend processes.

## v0.9.4 — Extension release packaging

**Goal:** Make production builds repeatable.

- [ ] Run lint/tests and the existing production build scripts.
- [ ] Verify the exact build output directory.
- [ ] Load and test the production build in Chrome.
- [ ] Check manifest, permissions, CSP, icons, and production API URL.
- [ ] Exclude secrets, SQLite files, local logs, caches, and development-only files.
- [ ] Keep generated build output out of Git unless the release process explicitly requires it.
- [ ] Document clean installation and upgrade steps.

**Acceptance:** Fresh installation works against cloud without manually running a server.

## v1.0.0 — Stable cloud-first extension

**Goal:** Release a dependable extension.

Release gate:
- [ ] Cloud-first operation works on a clean machine.
- [ ] Authentication, account/profile restoration, and username display work.
- [ ] Bookmarks, folders, tags, search, and vault pass regression tests.
- [ ] Network failures are recoverable and understandable.
- [ ] Local fallback is tested or clearly labelled as not yet available.
- [ ] Privacy/data-handling and backup procedures are documented as needed.
- [ ] Version and release notes are updated.

## v1.1.0 — API readiness for website and PWA

**Goal:** Prepare the hosted API for multiple clients.

- [ ] Audit endpoints for browser-independent behaviour.
- [ ] Verify authentication outside extension-only APIs.
- [ ] Configure CORS for the actual website/PWA origins.
- [ ] Enforce authorization in Django, not only in frontend code.
- [ ] Review pagination, filtering, validation, and consistent error responses.
- [ ] Test concurrent access from multiple clients.
- [ ] Validate SQLite performance and write contention against realistic use.
- [ ] Document API contracts for the React clients.

**Acceptance:** Extension and web clients can safely share the API and data.

## v1.2.0 — Website support

**Goal:** Use the hosted API from the website.

- [ ] Configure production website API URL.
- [ ] Implement/verify browser-compatible authentication.
- [ ] Test profiles, bookmarks, folders, tags, and account operations.
- [ ] Handle expired sessions and network failures.
- [ ] Verify responsive layouts and browser navigation.
- [ ] Confirm website and extension show the same cloud data for the same account.

**Acceptance:** Website works without a local Django server and shares cloud data with the extension.

## v1.3.0 — PWA support

**Goal:** Make the web app installable and define offline behaviour.

- [ ] Add web app manifest and required icons.
- [ ] Configure service worker and installability.
- [ ] Define which assets/pages work offline.
- [ ] If offline editing is required, design a queue and sync/conflict strategy.
- [ ] Do not assume service-worker caching provides database sync.
- [ ] Test install, launch, updates, and online/offline transitions on supported devices.

**Acceptance:** PWA is installable where supported, online operations use the hosted API, and offline behaviour is accurately documented.

## v1.4.0 — Cross-platform cloud/local strategy

**Goal:** Define supported modes for extension, website, and PWA.

- [ ] Document cloud-first/local-second behaviour for the extension.
- [ ] Document cloud behaviour for website and PWA.
- [ ] State whether website/PWA local mode is unsupported or requires a same-device companion.
- [ ] If sync is needed, specify record IDs, conflict resolution, deletion propagation, retry queues, and recovery before implementation.
- [ ] Show active backend/data location clearly.
- [ ] Document export/import and account portability.

**Acceptance:** Users know where data lives; switching modes cannot silently overwrite, merge, or lose data.

---

# 5. Regression checklist

Run after startup, authentication, profile, API configuration, or storage changes.

- [ ] Extension opens without a manually started server.
- [ ] Cloud API is tried first.
- [ ] Startup timeout does not produce a blank popup.
- [ ] Selected profile restores when reopening the popup in the same browser session.
- [ ] New browser session follows the intended profile-selection flow.
- [ ] Username returns after backend recovery without logout/login.
- [ ] Bookmarks, folders, tags, search, and vault work.
- [ ] Login, logout, and profile switching work.
- [ ] Network/cloud outage produces clear errors.
- [ ] Production build uses the hosted API.
- [ ] No credentials, tokens, database files, or private logs are committed or packaged.

# 6. Git and release workflow

For each milestone:

1. Complete one coherent set of changes.
2. Run lint/tests and relevant builds.
3. Test the built extension in Chrome.
4. Review `git status` and the diff.
5. Commit with a descriptive message.
6. Tag only after the milestone's acceptance criteria pass.
7. Keep secrets and local SQLite database files out of Git.

Suggested commits:

```text
feat: centralize account loading and fix username restoration
feat: configure hosted API for production extension
feat: add cloud-first backend selection
feat: add local backend companion launcher
build: prepare cloud-first extension release
```

# 7. Immediate next actions

1. [ ] Commit the current working startup-gate baseline.
2. [ ] Fix the `No UserName` recovery issue by centralizing account loading in `App`.
3. [ ] Build and test the current extension.
4. [ ] Deploy Django with SQLite on persistent storage in a staging environment.
5. [ ] Test authentication and essential operations against the hosted API.
6. [ ] Configure a production extension build to use cloud by default.
7. [ ] Verify the extension works with no local server running.
8. [ ] Design and implement local companion/launcher and fallback rules.
9. [ ] Release a stable cloud-first extension.
10. [ ] Begin website and PWA work after extension stability.

## Decisions to preserve

- Cloud first, local second for the extension.
- No manual server commands for normal extension use after setup.
- Django REST Framework remains the backend.
- SQLite remains the selected database; PostgreSQL is excluded from this plan.
- Website and PWA hybrid support comes after the extension is stable.
- Never silently merge local and cloud data.
- Preserve established API routes and navigation/profile restoration behaviour.
