# Bookmark Companion --- Sync and Deployment Checkpoints

**Project:** Bookmark Companion / TagMind\
**Scope:** Online-first, offline-capable synchronization through
production deployment\
**Status date:** 11 November 2026

Completed (`[x]`) checkpoints from the previous plan are retained.
Obsolete architectural work is explicitly marked **\[TO BE REMOVED\]**.
Unverified integration work remains unchecked.

------------------------------------------------------------------------

## Project architecture --- agreed direction

### Target behaviour

-   The cloud-hosted Django backend is the primary application backend
    and the central source of truth for authenticated user data.
-   The browser extension and TagMind website/PWA communicate with the
    same HTTPS Django API. Neither client has its own separate CRUD or
    business-logic implementation.
-   Users do not install, start or manage Django, Python, a local server
    or a local database.
-   The existing Django project is the single backend codebase. The
    same codebase is used for local development and cloud deployment;
    there is no separately maintained second Django project.
-   Django owns the application API, authentication integration,
    authorization, validation, bookmark/folder/tag business logic and
    synchronization-facing API behaviour.
-   A managed cloud database stores the central application data. The
    selected database must have a verified, supported Django integration
    or database driver. A provider's HTTP database API must not be
    assumed to work with Django ORM automatically.
-   Keep the existing SQLite database for local development.
-   **Preferred production/testing database for V1: SQLite**, provided the
    selected host offers persistent storage and supports Django's SQLite
    backend reliably. SQLite is not inherently unsuitable merely because
    Django is cloud-hosted.
-   PostgreSQL is an alternative, not a requirement. Consider it if the
    expected concurrent write workload, operational requirements or host
    limitations justify it.
-   Do not select a database solely because a hosting provider makes it
    convenient. Verify Django compatibility, persistence, transaction
    behaviour, write concurrency, backups, restore options, limits and
    cost before final selection.
-   Online operations are cloud-backed. Bookmark, folder, tag and other
    mutations require a successful online API operation; clients do not
    queue offline writes.
-   When offline, clients provide read-only access to previously cached
    data. Offline cache is not a second authoritative database.
-   The extension uses browser-appropriate local storage for its cache.
    The website/PWA uses IndexedDB for its structured cache.
-   The clients refresh their caches from the cloud API when connectivity
    and authentication are available.
-   Offline cache must be isolated by account. On logout, delete that
    account's cached bookmarks and related cached data. On account
    switching, clear the previous account's cache before showing the
    next account's data; never expose another user's cached data.
-   The browser service worker may cache the website app shell and
    support PWA loading, but it does not host or run Django.
-   The cloud provider has not yet been selected.
-   GitHub-connected deployment is the recommended deployment workflow:
    connect the existing repository to the hosting provider and deploy
    from a chosen branch. It is a convenience, not an architectural
    requirement; CLI, Docker or another repeatable deployment workflow
    may be used instead.
-   A testing/staging deployment should be separated from production when
    production deployment is introduced. A typical branch arrangement is
    `development` for testing and `main` for production, subject to the
    repository's actual branch strategy.

### Online and offline behaviour

1.  When online and authenticated, the extension and website request
    application data from the same cloud Django API.
2.  Bookmark/folder/tag mutations are sent to Django and are accepted
    only after server-side authentication, authorization and validation.
3.  Django commits accepted changes to the managed cloud database.
4.  After successful responses, clients update or refresh their local
    read cache.
5.  When offline, clients display previously cached bookmarks and
    supported cached metadata in read-only mode.
6.  Mutating actions are disabled or clearly reported as unavailable
    while offline. No offline mutation is queued for later upload.
7.  When connectivity returns, clients verify API reachability and
    authentication, then refresh cached data from the cloud.
8.  The cloud database is the central source of truth. Multi-device
    consistency is provided by the cloud API and database, with
    concurrent-edit behaviour defined in Phase 7.

### Cloud-backend architecture

```text
             TagMind Browser Extension
             (local read cache)
                         |
                         | HTTPS API
                         |
             TagMind Website / PWA
             (IndexedDB read cache)
                         |
                         | HTTPS API
                         v
               Cloud-hosted Django
          Authentication · Authorization
          API · Validation · Business logic
          Bookmark · Folder · Tag operations
                         |
                         | Django-supported
                         | database connection
                         v
             Managed cloud database
          Central bookmarks · folders · tags
          Profiles · vault data · relationships
```

Both clients use one cloud Django API and one central database. There
is no user-installed local Django service and no local SQLite database
required for end users. The existing local SQLite database remains useful
for development and testing, but it is not the production source of truth.

### Existing local outbox work and architectural impact

-   Phase 1–3 work was implemented for the earlier local-write-first
    replication design. Preserve the completed work and its tests as
    historical implementation until dependencies have been inspected.
-   The client-side `SyncOutBox` push/pull replication workflow is not
    part of the new online-only write model. Offline client writes are
    disabled, so clients do not need to upload queued mutations later.
-   Do not delete `SyncOutBox`, `SyncChange`, `SyncState`, migrations or
    related code immediately. First inspect all references and decide
    whether any component is still needed for server-side reliability,
    auditing or safe migration.
-   Do not treat the old local outbox as the mechanism for synchronizing
    client caches. Cache refresh is read-based through the cloud API.
-   Keep the existing Django API routes and behaviour compatible unless
    a specific change is planned and regression-tested.

### Architecture decisions still required

-   [ ] Select a cloud hosting platform for the existing Django project.
-   [ ] Select a managed production database with a verified Django
        integration; evaluate SQLite-compatible hosting only if its
        Django connectivity, transactions and operational limits are
        supported.
-   [ ] Verify hosting limits, persistent storage, database connection
        behaviour, transaction support, backups, restore options and
        pricing.
-   [ ] Define production settings, environment variables, secrets,
        static/media handling and deployment process.
-   [ ] Decide the authentication mechanism and how extension and
        website clients securely obtain and refresh credentials.
-   [ ] Define account ownership and authorization for bookmarks,
        folders, tags, profiles and vault data.
-   [ ] Define extension cache storage and website/PWA IndexedDB schema.
-   [ ] Define which data is cached, cache size/retention, refresh
        behaviour and account isolation.
-   [ ] Define exact offline read-only behaviour, including which
        screens/actions remain available without connectivity.
-   [ ] Define concurrent online edit/delete behaviour and server-side
        conflict handling.
-   [ ] Review the old outbox/sync modules and identify what can be
        retained, retired or removed safely.

### Cancelled direction --- do not implement

-   [CANCELLED] A local Django server installed or managed on each
        end user's computer.
-   [CANCELLED] Requiring users to install Python, Django, a runtime
        manager or a separate native service.
-   [CANCELLED] Making the browser extension responsible for starting or
        supervising a local backend process.
-   [CANCELLED] Local-write-first operation with automatic upload of
        offline mutations.
-   [CANCELLED] A separate local SQLite database as the end-user
        application's source of truth.
-   [CANCELLED] A provider-native backend that duplicates or replaces
        the existing Django application without an explicit decision.
-   [CANCELLED] A second independently maintained Django project.
-   [REMOVED] Treating a simple comparison of current database rows as
        the complete synchronization mechanism. Client cache refresh is
        now read-based; multi-device consistency is handled centrally.

## Project principles and constraints

-   [ ] Preserve existing frontend import paths.
-   [ ] Preserve existing Django API routes and behavior unless
    explicitly planned.
-   [ ] Keep the serializer filename `bookmarks/api/seralizers.py` as it
    currently exists.
-   [x] Keep SQLite for local development.
-   [ ] Prefer SQLite for V1 cloud testing/initial deployment if the host
    provides reliable persistent storage and Django-compatible operation.
-   [ ] Make the final production database decision only after verifying
    host persistence, concurrency, transactions, backups, restore and cost;
    PostgreSQL is optional rather than mandatory.
-   [ ] Do not reset the database or delete existing migrations.
-   [ ] Use Django migrations for model changes.
-   [ ] Keep each implementation phase small; test and review before
    continuing.
-   [ ] Keep bookmark, folder, tag, profile and vault behavior working
    throughout sync development.
-   [ ] Do not call the cloud application production-ready until
    authentication, authorization, offline cache isolation, recovery
    and end-to-end tests are complete.
-   [ ] Make shared model/domain/serialization changes once; isolate
    runtime-specific behaviour in settings or dedicated services.
-   [ ] Preserve change/deletion information; do not rely only on
    comparing current database snapshots.

## Pre-Phase 4 --- Backend readiness gate

**Goal:** Resolve the backend security and configuration blockers found
before selecting or deploying cloud infrastructure. This gate does not
select a host or production database and does not retire historical sync
models.

-   [x] Require JWT authentication by default for API endpoints.
-   [x] Scope profile, bookmark and folder API access to the authenticated
    user while preserving existing route paths and profile query parameter.
-   [x] Bind bookmark and folder creation to the authenticated user and
    reject cross-owner folder relationships.
-   [x] Require the authenticated user to own the profile used by vault
    operations.
-   [x] Restrict development CORS defaults and remove wildcard origins
    from the production configuration.
-   [x] Require production secrets and explicit database engine settings
    while retaining local SQLite defaults.
-   [x] Declare backend dependencies in `Backend/config/requirements.txt`.
-   [x] Attach the existing JWT access token to authenticated client API
    requests and establish a session after email registration/login.
-   [x] Store the email-login refresh token and refresh expired access
    tokens for fetch and Axios requests.
-   [x] Require a short-lived, server-signed vault unlock token for vault
    reads and writes; clear/lock the client vault when that token expires.
-   [x] Apply Django password validators during registration and scope
    rate limits to registration, email login and vault password endpoints.
-   [ ] Complete Google credential exchange and access-token refresh for
    both clients; current extension credential type does not match the
    backend ID-token verifier contract.
-   [ ] Add and run regression tests for authentication, ownership and
    mixed-owner relationships; retain sync deletion tests with authenticated
    requests.
-   [ ] Verify Google credential type and OAuth client configuration for
    the extension and website before enabling Google login in production.
-   [ ] Run Django checks, migration-state checks, backend tests and
    frontend lint/build in an environment with declared dependencies.
-   [ ] Review deployment-specific HTTPS proxy, static-file, database
    driver, logging and connection-pooling settings in Phase 4.

**Exit criteria**

-   [ ] All API ownership and authentication regression tests pass.
-   [ ] Local SQLite development and existing API routes remain usable.
-   [ ] Production settings fail closed when required secrets/database
    configuration is missing.
-   [ ] No migrations are generated as part of this readiness gate.

The current changes provide the initial implementation of this gate. Its
unchecked verification items must be completed before Phase 4 begins.

> **Architecture status:** Phases 1–3 record work already completed for
> the previous local-write-first design. Their implementation history and
> completed test results are retained. They are not a requirement to build
> a client-side offline write queue in the new cloud-first, offline
> read-only architecture. Do not delete their code or migrations until
> the dependency review in the architecture decisions is completed.

## Phase 1 --- Historical local-sync foundation (retained implementation)

**Status: Core tests reported passing.** Re-run relevant checks if later
changes affect these components.

### Data model and migration foundation

-   [x] Add stable `sync_uuid` identifiers to Bookmark, Folder and Tag.
-   [x] Add `SyncOutBox` and related sync tracking models (`SyncChange`,
    `SyncState`).
-   [x] Apply migrations without resetting the database or deleting
    migration history.
-   [x] Confirm `python manage.py check` passes.
-   [x] Confirm `python manage.py makemigrations --check` reports no
    unplanned model changes at the time of verification.
-   [x] Re-run migration consistency checks after the latest
    `accent_color` editability change.

### Outbox helpers and payloads

-   [x] Implement `record_sync_change()` and skip records with no
    user/account to sync.
-   [x] Implement payload helpers for bookmarks, folders and tags.
-   [x] Include stable UUIDs and relationships in bookmark payloads.
-   [x] Include folder UUID in bookmark payloads rather than relying
    only on database primary keys.
-   [x] Include tag UUIDs in bookmark payloads.
-   [x] Capture deletion payloads before deleting the database record.

### Bookmark operations

-   [x] Test bookmark creation event.
-   [x] Test creation events for newly created tags.
-   [x] Test bookmark update event and updated payload.
-   [x] Test bookmark deletion event and payload.
-   [x] Confirm event recording occurs in the same database transaction
    as the data change.

### Folder operations

-   [x] Test folder deletion event.
-   [x] Test cascade deletion: record bookmark deletion events before
    folder deletion removes its bookmarks.
-   [x] Test folder update event and payload.
-   [x] Make `accent_color` writable in the model so the backend can
    accept future color updates.
-   [x] Re-run folder update test and verify payload contains requested
    color.
-   [x] Confirm `FolderSerializer` includes `accent_color` and does not
    declare it read-only.
-   [x] Add/apply a migration if Django generates one for the
    model-state change.

### Tag lifecycle

-   [x] Preserve a tag if other bookmarks still use it.
-   [x] Delete an unused tag when its last bookmark relationship is
    removed.
-   [x] Record tag deletion before deleting the tag.
-   [x] Test shared-tag preservation.
-   [x] Test unused-tag deletion.
-   [x] Verify rollback leaves no test data or outbox records behind.

### Phase 1 exit criteria

-   [x] Re-run `python manage.py check`.
-   [x] Re-run `python manage.py makemigrations --check`.
-   [x] Run key create/update/delete tests after recent changes.
-   [x] Verify no test data remains.
-   [x] Confirm existing bookmark and folder API behavior is unchanged.

## Phase 2 --- Historical outbox consistency and event semantics

**Goal:** Ensure outbox events accurately and reliably describe changes
that need syncing.

-   [x] Review folder updates and all payload fields.
-   [x] Verify all entity events use the correct account/user and entity
    UUID.
-   [x] Verify event creation and model mutations roll back together on
    errors.
-   [x] Define expected ordering for multiple events affecting the same
    entity.
-   [x] Decide whether repeated pending updates remain separate or are
    coalesced.
-   [x] Define create → update, create → delete and update → delete
    sequences.
-   [x] Ensure deletion payloads are captured before records or
    relationships disappear.
-   [x] Check whether tag create/delete sequences can produce
    unnecessary intermediate events.
-   [x] Confirm folder deletion records child bookmark deletes before
    folder deletion.
-   [x] Review transaction boundaries for bookmark tags and folder
    cascades.
-   [x] Add tests for failed operations and transaction rollback.
-   [x] Ensure event timestamps and ordering are adequate; do not rely
    on timestamps alone if ties are possible.
-   [x] Document outbox lifecycle (`pending`, `processing`, `failed`,
    `synced`) and valid transitions.

**Exit criteria** - \[x\] Event ordering and duplicate behavior are
documented. - \[x\] Failure/rollback tests pass. - \[x\] Payloads
represent intended final or sequential state consistently.

## Phase 3 --- Historical outbox processing reliability

**Historical goal:** Make local outbox event processing safe to retry and resilient to failures. This work belongs to the previous local-write-first architecture; review dependencies before retaining or retiring it.

-   [x] Define how pending events are claimed for processing.
-   [x] Implement conditional claim-token logic to prevent duplicate
    claims; function-level tests passed.
-   [x] Define retry limits and retry delays.
-   [x] Persist useful error details without storing secrets.
-   [ ] Make processing idempotent so a retried event cannot create
    duplicate remote changes. **Cloud-side implementation pending.**
-   [x] Define when an event moves to `synced`: only after a valid cloud
    acknowledgement. Actual cloud acknowledgement is not yet implemented
    or integration-tested.
-   [x] Define how permanently failed events are surfaced and manually
    recovered.
-   [x] Implement stale processing lease recovery and test at function
    level.
-   [x] Define stale `processing` recovery and claim-token invalidation.
-   [ ] Test transient network errors, server errors, real process
    interruption and repeated delivery against a cloud endpoint.
-   [x] Test that local bookmark/folder deletion events survive
    source-row deletion and transaction rollback.
-   [ ] Verify deletion events remain until cloud acknowledgement and
    are not discarded prematurely.
-   [ ] Add operational logging for counts, failures, retries and
    processing duration.
-   [x] Implement heartbeat/lease renewal and test that a stale worker
    cannot renew after recovery.
-   [x] Test both conditional-update execution orders: heartbeat before
    recovery and recovery before heartbeat.
-   [x] Test actual simultaneous multi-connection/multi-worker
    behaviour. The execution-order tests do not prove simultaneous
    concurrency safety.
-   [x] Verify SQLite locking/concurrency behaviour under the intended
    local runtime.

**Exit criteria** - \[ \] Reprocessing the same event is safe at the
cloud boundary. - \[x\] Interrupted processing can recover at function
level. - \[ \] Retry and terminal-failure behaviour is tested with real
network/server failures. - \[ \] Cloud acknowledgement and
deletion-retention lifecycle are integration-tested.

## Phase 4 --- Cloud Django backend and managed database integration

**Goal:** Deploy the existing Django codebase as the single cloud
application backend and connect it to a suitable managed production
database.

-   [ ] Select the cloud hosting platform for the existing Django
    project.
-   [ ] Verify whether persistent SQLite is supported by the selected
    host and adequate for the expected workload.
-   [ ] If SQLite is not operationally suitable, select a managed
    PostgreSQL database with a verified Django backend/driver and
    supported transaction behaviour.
-   [ ] Verify hosting, database, connection, storage, request and
    pricing limits before committing to the provider.
-   [ ] Configure the existing Django project for environment-based
    production database settings without breaking local SQLite
    development.
-   [ ] Preserve existing models, migrations, stable entity UUIDs and
    relationships unless a reviewed migration is required.
-   [ ] Configure persistent database storage and verify that data
    survives application restarts and deployments.
-   [ ] Configure Django's production database connection pooling or
    connection lifecycle appropriately for the selected host.
-   [ ] Ensure bookmark, folder, tag, profile and vault operations use
    the central cloud database.
-   [ ] Keep existing API routes and response behaviour compatible
    unless a specific change is planned.
-   [ ] Validate request data and relationships server-side.
-   [ ] Ensure database transactions protect multi-step mutations such
    as bookmark/tag and folder/cascade operations.
-   [ ] Define server-side handling for concurrent requests and
    duplicate submissions where required.
-   [ ] Configure static files and required media handling.
-   [ ] Add health checks and useful backend operational logging.
-   [ ] Add tests for database connectivity, transactions, failed
    operations and application restart/reconnection.
-   [ ] Confirm local development still works with the existing SQLite
    database and migrations.

**Exit criteria**

-   [ ] Existing Django code runs against the selected managed
        production database.
-   [ ] Existing API operations pass regression tests.
-   [ ] Data persistence and transaction behaviour are verified.
-   [ ] Local SQLite development remains functional.

## Phase 5 --- Authentication, ownership and security

**Goal:** Secure the cloud Django API and prevent cross-account access
or modification.

-   [ ] Decide the authentication mechanism for the existing Django
        backend.
-   [ ] Support secure authentication from both the browser extension
        and website/PWA.
-   [ ] Define token/session storage, expiry, refresh and sign-out
        behaviour for both clients.
-   [ ] Require authenticated identity for account-owned API
        operations.
-   [ ] Enforce ownership checks server-side for every bookmark,
        folder, tag, profile and vault operation.
-   [ ] Do not trust a client-supplied user ID as proof of ownership.
-   [ ] Validate bookmark, folder and tag relationships against the
        authenticated account.
-   [ ] Decide how existing local development/test data is handled
        when creating or signing into a cloud account.
-   [ ] Prevent cross-user UUID access or modification.
-   [ ] Ensure vault data is isolated and follows intended privacy
        rules.
-   [ ] Add permission tests for unauthenticated users, other users'
        UUIDs and mixed-owner relationships.
-   [ ] Configure HTTPS for production.
-   [ ] Protect secrets, tokens, cookies and credentials.
-   [ ] Apply suitable rate and request-size limits.
-   [ ] Review CORS, allowed hosts, CSRF settings where applicable, and
        production `DEBUG=False`.
-   [ ] Avoid logging tokens, private bookmark content or sensitive
        payloads unnecessarily.

**Exit criteria**

-   [ ] Ownership checks are enforced server-side.
-   [ ] Extension and website authentication flows work securely.
-   [ ] Authentication and authorization tests pass.
-   [ ] Production security settings are reviewed.

## Phase 6 --- Frontend cloud-first and offline read-cache integration

**Goal:** Connect the React extension and website/PWA to the same cloud
Django API and provide read-only access to previously cached data while
offline.

-   [ ] Define frontend connection states (online, offline,
        loading, authentication-required and error).
-   [ ] Define the shared cloud API client behaviour for extension and
        website without changing existing import paths unnecessarily.
-   [ ] Preserve current API routes and compatible response behaviour.
-   [ ] Route online bookmark, folder, tag, profile and vault reads
        through the cloud Django API.
-   [ ] Route all mutations through the cloud Django API.
-   [ ] Require a successful online API operation for every mutation.
-   [ ] Disable or clearly reject add, edit, delete, move, tag and
        folder mutations while offline.
-   [ ] Do not create client-side offline mutation queues or pending
        writes.
-   [ ] Implement extension-side read caching using appropriate
        browser storage.
-   [ ] Implement website/PWA structured read caching using IndexedDB.
-   [ ] Define and implement which bookmark fields and related data are
        cached.
-   [ ] Refresh caches after successful online reads and mutations.
-   [ ] Handle stale cache and refresh failures without presenting
        cached data as freshly synchronized.
-   [ ] Isolate cached data by authenticated account.
-   [ ] Clear or safely isolate cached data on logout and account
        switching.
-   [ ] Check actual API reachability rather than relying only on the
        browser internet indicator.
-   [ ] Handle authentication expiry and re-authentication.
-   [ ] Prevent overlapping refresh requests from corrupting cache
        state.
-   [ ] Provide clear online/offline status and cache freshness
        feedback.
-   [ ] Add manual refresh/retry where useful.
-   [ ] Ensure vault, profile, folder, tags, search and current
        bookmark actions still work according to online/offline rules.
-   [ ] Ensure the extension can save a bookmark through the cloud API
        when online.
-   [ ] Ensure the website/PWA can perform the same supported
        operations through the same API.
-   [ ] Test extension startup, browser restart and website/PWA reload
        behaviour.
-   [ ] Use the service worker for website/PWA app-shell caching only;
        do not treat it as a Django hosting process.

**Exit criteria**

-   [ ] Both clients use the same cloud Django API.
-   [ ] All mutations require a successful online API operation.
-   [ ] Previously cached data remains readable offline.
-   [ ] Offline mutation controls are disabled or return clear errors.
-   [ ] Cache refresh, account isolation and authentication recovery
        work correctly.
-   [ ] Existing extension and website behaviour passes regression
        tests.

## Phase 7 --- Concurrent edits and multi-device consistency

**Goal:** Define predictable results when multiple authenticated clients
modify the same cloud data.

-   [ ] Choose a server-authoritative conflict policy, with versioning
        or equivalent safeguards where appropriate.
-   [ ] Do not rely on client clocks alone as the conflict authority.
-   [ ] Define simultaneous edits to the same bookmark.
-   [ ] Define edits to the same folder or tag.
-   [ ] Define when one client deletes an item another client edits.
-   [ ] Define when a folder is deleted while another client creates or
        moves bookmarks into it.
-   [ ] Define tag removal versus tag addition from different clients.
-   [ ] Use database transactions and conditional updates/version
        checks where needed to prevent lost updates.
-   [ ] Ensure stale cached data cannot silently overwrite newer cloud
        data.
-   [ ] Define client refresh behaviour after a rejected stale update.
-   [ ] Test two clients editing the same record concurrently.
-   [ ] Test delete/edit and folder/relationship races.
-   [ ] Document data-loss trade-offs in the chosen conflict policy.

**Exit criteria**

-   [ ] Conflict policy is documented.
-   [ ] Concurrent-edit and deletion tests pass.
-   [ ] Stale cached data cannot silently overwrite newer cloud data.

## Phase 8 --- End-to-end and regression testing

**Goal:** Verify the complete cloud-backed application across the
extension and website/PWA, including offline read-only behaviour.

-   [ ] Test a new account with no bookmarks.
-   [ ] Test an account with an existing bookmark library.
-   [ ] Test bookmark create, edit, delete and URL changes through the
        cloud API from both clients.
-   [ ] Test folder create, rename, color change and deletion.
-   [ ] Test shared tags and deletion of unused tags.
-   [ ] Test normal and vault data separation.
-   [ ] Test moving bookmarks between folders.
-   [ ] Test two clients viewing and modifying the same account.
-   [ ] Test concurrent edits, stale updates and deletion/edit races.
-   [ ] Test offline access to previously cached bookmarks and related
        data.
-   [ ] Verify all mutations are unavailable while offline and no
        pending offline writes are created.
-   [ ] Test reconnection and cache refresh after offline use.
-   [ ] Test malformed or outdated client payloads.
-   [ ] Test large libraries, pagination and bounded API responses.
-   [ ] Test authentication expiry and re-authentication.
-   [ ] Test cloud backend restart during normal requests.
-   [ ] Verify no data loss or duplicate records after repeated client
        requests.
-   [ ] Verify cache isolation after logout and account switching.
-   [ ] Run Django checks and all backend tests.
-   [ ] Run frontend lint/build and relevant UI tests.
-   [ ] Verify production extension package does not rely on Vite HMR
        or localhost development URLs.
-   [ ] Test transient network failures, HTTP 5xx responses, timeouts
        and recovery after the cloud service becomes available.
-   [ ] Test website/PWA app-shell loading and cached-data access while
        offline.

**Exit criteria**

-   [ ] Critical workflows pass on the extension and website/PWA.
-   [ ] Offline cached reads work and offline writes are prevented.
-   [ ] No unresolved critical data-loss, ownership or security defects
        remain.
-   [ ] Build artifacts and configuration are production-appropriate.

## Phase 9 --- Production deployment readiness

**Goal:** Deploy safely and make the system maintainable.

### Configuration and infrastructure

-   [ ] Keep the existing Django project/repository as the single source
    codebase; do not create a separately maintained cloud Django project.
-   [ ] Prefer connecting the GitHub repository to the hosting provider
    for repeatable, branch-based deployments. This is recommended, not
    mandatory.
-   [ ] Define which branch deploys to testing/staging and which branch
    deploys to production; do not deploy unreviewed development changes
    directly to production.
-   [ ] Verify that deployments do not overwrite or delete the persistent
    database or user data.
-   [ ] Set production environment variables and keep secrets out of
    source control.

-   [ ] Set `DEBUG=False`, configure `ALLOWED_HOSTS`, and review
    HTTPS/security settings.

-   [ ] Configure production process supervision for the single
    cloud-hosted Django application.

-   [ ] Configure static files and required media handling.

-   [ ] Verify API base URLs and remove development-only localhost
    references.

-   [ ] Restrict CORS and browser-extension origins appropriately.

-   [ ] Add health checks and useful operational logs.

-   [ ] Configure monitoring/alerts for server errors and repeated sync
    failures.

-   [ ] Document how local development and cloud production deployments
    are built from the same Django codebase.

-   [ ] Confirm the selected production database is suitable for
    expected cloud write concurrency and workload.

### Database and recovery

-   [ ] Verify the selected production database's persistence,
    concurrency and transaction guarantees.
-   [ ] Keep local SQLite development data separate from production
    cloud data.
-   [ ] Store production database data on provider-managed persistent
    storage, not an ephemeral application filesystem.
-   [ ] Confirm backup, restore and retention capabilities for the
    selected managed database.

-   [ ] Back up before migrations and initial production rollout.

-   [ ] Test restoring a backup in a non-production environment.

-   [ ] Document migration and rollback procedures.

-   [ ] Never delete migration history to fix deployment issues.

-   [ ] Define backup frequency and retention policy.

### Extension release

-   [ ] Update production extension configuration and permissions.
-   [ ] Remove development-only CSP entries and localhost WebSocket
    permissions where not needed.
-   [ ] Verify the packaged extension works with the deployed HTTPS
    Django API without requiring a local backend service.
-   [ ] Test install, update, browser restart, sign-in, sync and
    sign-out.
-   [ ] Review store listing, privacy disclosures and data-use
    declarations.
-   [ ] Confirm version number and release notes.
-   [ ] Keep a known-good release package for rollback.

### Launch and post-launch

-   [ ] Deploy to staging first.
-   [ ] Run staging smoke tests.
-   [ ] Deploy with a documented rollback plan.
-   [ ] Run production smoke tests using a test account.
-   [ ] Verify logs, sync status and database persistence after restart.
-   [ ] Monitor errors, failed events, latency and database growth.
-   [ ] Document incident response and user-data recovery steps.

**Exit criteria**

-   [ ] Production deployment is repeatable.
-   [ ] Backup restoration and rollback procedures are tested.
-   [ ] Extension and website/PWA work without users installing or
        manually starting a local backend.
-   [ ] Offline cached reads and online-only mutations work in the
        production build.
-   [ ] Monitoring and post-launch ownership are defined.

------------------------------------------------------------------------

## Decisions clarified --- 11 November 2026

### Database direction

-   SQLite remains the local development database.
-   SQLite is the preferred V1 cloud database candidate because the
    application workload and current requirements do not by themselves
    require PostgreSQL.
-   This is conditional on the hosting platform providing persistent
    storage for the SQLite database file and supporting the required
    Django transaction and operational behaviour.
-   A free hosting tier with an ephemeral filesystem must not be used
    for a persistent SQLite database. A restart, redeployment or
    instance replacement could otherwise destroy the database file.
-   PostgreSQL remains a valid alternative if persistent SQLite hosting
    is unavailable or if measured concurrent write workload and
    operational requirements justify PostgreSQL.
-   Do not migrate to PostgreSQL solely because the backend is hosted
    in the cloud.

### Deployment direction

-   GitHub-connected deployment is recommended for convenience,
    repeatability, deployment history and branch-based testing.
-   GitHub integration is not mandatory; another repeatable deployment
    method is acceptable.
-   GitHub stores source code. It does not host or persist the live
    application database.
-   Keep application files and database persistence separate. Never
    assume that a successful code deployment also protects database
    persistence.
-   Render may be evaluated for Django hosting, but its free web-service
    filesystem is ephemeral and is not suitable for a persistent SQLite
    database. A persistent-disk plan or another host with persistent
    storage would be required for that arrangement.
-   The hosting provider and final database provider remain unselected
    until current pricing, persistent storage, limits, backups and
    restore behaviour have been verified.

### Offline cache and logout behaviour

-   The cloud Django API and cloud database remain the source of truth.
-   Online CRUD continues through the existing Django REST Framework
    endpoints and JWT authentication.
-   Offline mode is read-only and displays previously fetched bookmarks
    and supported related data.
-   No local database is required as the end-user source of truth, and
    no offline mutation queue is required.
-   Use browser-appropriate storage for the extension cache and IndexedDB
    for the website/PWA structured cache.
-   When a user logs out, delete that user's cached bookmarks, folders,
    tags and other private cached data. Account switching must clear the
    previous account's cache before the next account's data is shown.

## Current implementation notes --- 6 November 2026

### Local Phase 3 implementation already present

-   Outbox claiming uses conditional updates and a per-claim token.
-   Retry policy, retry scheduling, sanitized error details, stale lease
    recovery, manual failed-event retry and heartbeat renewal are
    implemented.
-   Local bookmark and folder cascade deletion events are recorded
    transactionally before source rows disappear.
-   Tests for both heartbeat/recovery execution orders passed. These are
    deterministic interleaving tests, not simultaneous multi-process
    concurrency tests.
-   Local deletion-event persistence and rollback tests passed.
-   Cloud receipt/idempotency and provider acknowledgement work belonged
    to the previous client-to-provider outbox design. Under the new
    architecture, review whether any outbox functionality remains
    necessary before retaining or retiring it.
-   Real cloud API failure tests, production operational logging and
    concurrent multi-client conflict handling remain to be implemented.
-   `SyncOutBox` has a unique `event_uuid`; `entity_uuid` is not unique.
    This was checked against the actual SQLite index.
-   The existing Django backend currently runs locally with SQLite for
    development. The new target is a cloud-hosted Django API with a
    managed production database; offline clients will read cached data
    only. The cloud deployment has not yet been created.

### Setup exploration

-   Project root: `D:\Programming\Bookmark Application\TagMind`
-   Existing directories include `Backend`, `Frontend` and
    `node_modules`.
-   A `cloud_backend` directory and its `venv` were created during
    exploration, but a separate Django project was not created and
    Django/DRF were not installed there.
-   Agreed direction: use the existing Django project as the single
    cloud-hosted backend. Do not maintain `cloud_backend` as a second
    independent Django project. Inspect before cleanup; do not delete
    blindly.

## Final deployment gate

Do not mark the project deployment-ready until all of these are true:

-   [ ] Cloud backend mutations are transactionally consistent.
-   [ ] Authentication and ownership checks are enforced by Django.
-   [ ] Concurrent edits and deletion propagation behave predictably
    across multiple clients.
-   [ ] Extension and website/PWA use the same cloud API.
-   [ ] Offline cached reads work, and offline mutations are prevented.
-   [ ] Cache refresh, account isolation and recovery after interruptions
    are tested.
-   [ ] Existing bookmark, folder, tag, profile and vault behavior
    passes regression tests.
-   [ ] Production configuration contains no accidental development
    settings or secrets.
-   [ ] Database persistence, backups, restore and rollback are tested.
-   [ ] Production extension and website/PWA work against the deployed
    cloud Django API without a user-installed local backend.
-   [ ] Critical defects are resolved and release notes are prepared.
