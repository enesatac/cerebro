# Deployment (OpenShift)

One image (`Dockerfile`, UBI OpenJDK 21 runtime with `cerebro.jar`) serves the web app and the
API. Jenkins builds and tests it, OpenShift builds the image and pushes it to Nexus, Helm deploys
it. The same image is promoted from dev to test to production; nothing is rebuilt per environment.

```text
git push main ─► Jenkins (agent pod on OpenShift)
                  1 Frontend   npm ci · format · validate · build:api
                  2 Backend    mvnw verify (integration test) → target/cerebro.jar (+ web app)
                  3 Contract   jar on profile h2 ⇄ web app contract test
                  4 Image      oc start-build cerebro --from-dir (Dockerfile + jar) → Nexus :<commit>
                  5 Dev        helm upgrade --install (values-dev.yaml)
                  6 Test       approval → helm (values-test.yaml)
                  7 Prod       approval (cerebro-release-managers) → helm (values-prod.yaml)
```

## One-time setup

**Nexus**

- A Docker hosted repository for `cerebro/cerebro`, plus proxies for the UBI base images (or allow
  `registry.access.redhat.com`).
- npm group (npmjs proxy) and Maven group (Maven Central proxy).

**Jenkins**

- Kubernetes plugin with access to the CI namespace; Config File Provider plugin.
- Managed Maven settings `cerebro-maven-settings` with a mirror to the Nexus Maven group.
- Credentials: `openshift-token-ci`, `openshift-token-dev`, `openshift-token-test`,
  `openshift-token-prod` (service account tokens with edit rights in their namespace);
  optionally `cerebro-ci-oracle` (username/password of an empty CI schema for the integration
  test, with the `TEST_DB_URL` parameter).
- A multibranch pipeline on this repository (`Jenkinsfile`). Adjust the parameter defaults
  (Nexus host, OpenShift API, images) once. The `TOOLS_IMAGE` needs `oc` and `helm`.

**OpenShift — CI namespace (`cerebro-ci`)**

- `oc apply -f deploy/openshift/buildconfig.yaml` (set the Nexus host first).
- Secret `nexus-push` (docker config with push rights), `nexus-pull` if the base image comes
  through Nexus.

**OpenShift — each runtime namespace (`cerebro-dev`, `cerebro-test`, `cerebro-prod`)**

- Secret `nexus-pull` (pull from Nexus).
- Secret `cerebro-secrets`:

  ```bash
  oc -n cerebro-dev create secret generic cerebro-secrets \
    --from-literal=CEREBRO_DB_USER=… --from-literal=CEREBRO_DB_PASSWORD=… \
    --from-literal=CEREBRO_OIDC_CLIENT_ID=… --from-literal=CEREBRO_OIDC_CLIENT_SECRET=…
  ```

  (or the equivalent from Vault / External Secrets).

- `deploy/helm/cerebro/values-<env>.yaml`: route host, `config.databaseUrl`,
  `config.oidcIssuerUri`, sizing.

**Oracle**

- One schema per environment; the application user owns it (Flyway creates the tables on the
  first start). Grants: `CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW` and a quota on
  its tablespace. Character set AL32UTF8 recommended (Turkish text).
- Connections: `replicas × CEREBRO_DB_POOL_SIZE` (+1 during a rolling deploy).

**Oracle Access Manager (OIDC)**

- Register a confidential client (authorization code, `client_secret_basic`), scopes
  `openid profile email`.
- Redirect URI: `https://<route host>/login/oauth2/code/corporate` (one per environment).
- Issuer: `config.oidcIssuerUri` — the application reads `<issuer>/.well-known/openid-configuration`.
- The claim in `config.oidcUserClaim` (default `email`) must equal the person's Cerebro account
  email. If OAM releases only the user id, set the claim (e.g. `sub`) and create accounts with
  that value as email.
- First deployment: set `config.bootstrapAdminEmail`; that person gets the system administrator
  role on start and grants the others their roles in the app.

## Operations

- Probes: `/actuator/health/liveness`, `/actuator/health/readiness` (includes the database).
- Rolling updates keep at least the configured replicas serving (`maxUnavailable: 0`); sessions are
  in the database, so users stay signed in.
- Roll back: `helm rollback cerebro <revision> -n <namespace>` (the image tag is the commit).
  Flyway migrations only move forward — make schema changes backward compatible with the previous
  release.
- Logs: `oc logs deploy/cerebro -n <namespace>`.

## Not verified yet

The chart and pipeline were written for this setup but have not run on the company's OpenShift,
Jenkins, Nexus and OAM; the first pipeline run (`helm lint` runs before every deploy) is their
test. Oracle-specific SQL was tested on H2 in Oracle compatibility mode; the integration test runs
on a real Oracle when the CI schema or Docker is available.
