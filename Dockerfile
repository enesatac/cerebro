# Cerebro container image: one jar serving the web app and its API.
#
# The pipeline builds and tests first (frontend → npm run build:api, backend → mvnw verify, which
# packs frontend/dist into the jar), then builds this image from a small context that holds only
# this file and cerebro.jar (see Jenkinsfile, stage "Image"):
#
#   mkdir -p build/image && cp Dockerfile backend/target/cerebro.jar build/image/
#   docker build -t cerebro build/image          # or: oc start-build cerebro --from-dir=build/image
#
# The base is Red Hat's UBI OpenJDK runtime (OpenShift-ready: runs under any assigned UID in group
# 0). Pass BASE_IMAGE to pull it through the Nexus proxy registry.
ARG BASE_IMAGE=registry.access.redhat.com/ubi9/openjdk-21-runtime:latest
FROM ${BASE_IMAGE}

LABEL org.opencontainers.image.title="cerebro" \
      org.opencontainers.image.description="Cerebro portfolio app: web app and REST API"

COPY --chown=185:0 cerebro.jar /deployments/cerebro.jar

ENV JAVA_APP_JAR=/deployments/cerebro.jar \
    JAVA_MAX_RAM_RATIO=75 \
    JAVA_OPTS_APPEND="-Doracle.jdbc.timezoneAsRegion=false -Dfile.encoding=UTF-8" \
    SPRING_PROFILES_ACTIVE=prod \
    TZ=Europe/Istanbul

EXPOSE 8080
USER 185
