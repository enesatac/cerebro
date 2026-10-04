// Cerebro — one pipeline, one image, one deployment.
//
//   Frontend ─► Backend (jar with the web app inside) ─► Contract ─► Image (OpenShift build → Nexus)
//            ─► Deploy dev ─► [approval] Deploy test ─► [approval] Deploy prod
//
// The same image (tag = git commit) is promoted from dev to prod; nothing is rebuilt per
// environment. Environment differences live in deploy/helm/cerebro/values-<env>.yaml and in the
// OpenShift Secret `cerebro-secrets` of each namespace.
//
// Jenkins setup (once): Kubernetes plugin (agents run as pods on OpenShift), Config File Provider
// (Maven settings with the Nexus mirror), credentials listed under `environment` below, and the
// BuildConfig from deploy/openshift/buildconfig.yaml in the CI namespace.

def imageTag = ''

pipeline {
  agent {
    kubernetes {
      defaultContainer 'maven'
      yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: node
      image: ${params.NODE_IMAGE}
      command: ['cat']
      tty: true
      resources: { requests: { cpu: '1', memory: 2Gi }, limits: { memory: 3Gi } }
    - name: maven
      image: ${params.MAVEN_IMAGE}
      command: ['cat']
      tty: true
      resources: { requests: { cpu: '1', memory: 2Gi }, limits: { memory: 3Gi } }
    - name: tools
      image: ${params.TOOLS_IMAGE}
      command: ['cat']
      tty: true
"""
    }
  }

  parameters {
    // Images through the Nexus proxy registry; the tools image needs `oc` and `helm`.
    string(name: 'NODE_IMAGE', defaultValue: 'registry.access.redhat.com/ubi9/nodejs-22:latest', description: 'Node.js 22 build image')
    string(name: 'MAVEN_IMAGE', defaultValue: 'registry.access.redhat.com/ubi9/openjdk-21:latest', description: 'JDK 21 build image')
    string(name: 'TOOLS_IMAGE', defaultValue: 'nexus.example.com:8443/devops/oc-helm:latest', description: 'Image with oc and helm')
    string(name: 'NEXUS_REGISTRY', defaultValue: 'nexus.example.com:8443', description: 'Docker registry on Nexus')
    string(name: 'NPM_REGISTRY', defaultValue: 'https://nexus.example.com/repository/npm-group/', description: 'npm registry on Nexus')
    string(name: 'MAVEN_WRAPPER_URL', defaultValue: 'https://nexus.example.com/repository/maven-public', description: 'Maven repository the wrapper downloads Maven from')
    string(name: 'OPENSHIFT_API', defaultValue: 'https://api.ocp.example.com:6443', description: 'OpenShift API')
    string(name: 'CI_NAMESPACE', defaultValue: 'cerebro-ci', description: 'Namespace with the BuildConfig')
    string(name: 'TEST_DB_URL', defaultValue: '', description: 'Optional CI Oracle schema for the integration test (jdbc:oracle:thin:@//host:1521/SERVICE); empty = H2 in Oracle mode')
    booleanParam(name: 'SKIP_DEPLOY', defaultValue: false, description: 'Build and test only')
  }

  environment {
    IMAGE_REPOSITORY = "${params.NEXUS_REGISTRY}/cerebro/cerebro"
    MVNW_REPOURL = "${params.MAVEN_WRAPPER_URL}"
    npm_config_registry = "${params.NPM_REGISTRY}"
    // Keeps the API started for the contract test alive across steps.
    JENKINS_NODE_COOKIE = 'dontKillMe'
  }

  options {
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
    timestamps()
  }

  stages {
    stage('Frontend') {
      steps {
        container('node') {
          dir('frontend') {
            sh 'npm ci --no-audit --no-fund'
            sh 'npm run format:check'
            // typecheck → lint → unit and screen tests → demo build
            sh 'npm run validate'
            // The production build talks to the API (VITE_DATA_SOURCE=http); it goes into the jar.
            sh 'npm run build:api'
          }
        }
      }
    }

    stage('Backend') {
      steps {
        container('maven') {
          dir('backend') {
            configFileProvider([configFile(fileId: 'cerebro-maven-settings', variable: 'MAVEN_SETTINGS')]) {
              script {
                if (params.TEST_DB_URL?.trim()) {
                  withCredentials([usernamePassword(credentialsId: 'cerebro-ci-oracle', usernameVariable: 'CEREBRO_TEST_DB_USER', passwordVariable: 'CEREBRO_TEST_DB_PASSWORD')]) {
                    withEnv(["CEREBRO_TEST_DB_URL=${params.TEST_DB_URL}"]) {
                      sh './mvnw -B -s "$MAVEN_SETTINGS" verify'
                    }
                  }
                } else {
                  sh './mvnw -B -s "$MAVEN_SETTINGS" verify'
                }
              }
            }
          }
          // The jar must carry the web app (served from the same origin as the API).
          sh 'jar tf backend/target/cerebro.jar | grep -q "BOOT-INF/classes/static/index.html"'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml'
        }
      }
    }

    stage('Contract') {
      // The web app's in-memory backend and the real API must answer every call the same way.
      steps {
        container('maven') {
          sh '''
            setsid nohup java -jar backend/target/cerebro.jar --spring.profiles.active=h2 > api.log 2>&1 &
            echo $! > api.pid
            for i in $(seq 1 60); do
              curl -sf http://localhost:8080/actuator/health/readiness > /dev/null && exit 0
              sleep 2
            done
            cat api.log; exit 1
          '''
        }
        container('node') {
          dir('frontend') {
            sh 'CEREBRO_API_URL=http://localhost:8080 npx vitest run src/services/http/apiContract.test.ts'
          }
        }
      }
      post {
        always {
          container('maven') {
            sh 'kill $(cat api.pid) 2>/dev/null || true'
          }
        }
      }
    }

    stage('Image') {
      when { allOf { branch 'main'; expression { !params.SKIP_DEPLOY } } }
      steps {
        script {
          imageTag = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
        }
        container('tools') {
          withCredentials([string(credentialsId: 'openshift-token-ci', variable: 'OC_TOKEN')]) {
            sh """
              mkdir -p build/image
              cp Dockerfile backend/target/cerebro.jar build/image/
              oc login --token="\$OC_TOKEN" --server='${params.OPENSHIFT_API}' > /dev/null
              oc -n '${params.CI_NAMESPACE}' patch bc/cerebro --type=merge \
                -p '{"spec":{"output":{"to":{"kind":"DockerImage","name":"${env.IMAGE_REPOSITORY}:${imageTag}"}}}}'
              oc -n '${params.CI_NAMESPACE}' start-build cerebro --from-dir=build/image --follow --wait
            """
          }
        }
      }
    }

    stage('Deploy dev') {
      when { allOf { branch 'main'; expression { !params.SKIP_DEPLOY } } }
      steps {
        script { deploy('dev', 'cerebro-dev', 'openshift-token-dev', imageTag) }
      }
    }

    stage('Deploy test') {
      when { allOf { branch 'main'; expression { !params.SKIP_DEPLOY } } }
      steps {
        timeout(time: 3, unit: 'DAYS') {
          input message: "Cerebro ${imageTag} test ortamına alınsın mı?", ok: 'Test ortamına al'
        }
        script { deploy('test', 'cerebro-test', 'openshift-token-test', imageTag) }
      }
    }

    stage('Deploy prod') {
      when { allOf { branch 'main'; expression { !params.SKIP_DEPLOY } } }
      steps {
        timeout(time: 7, unit: 'DAYS') {
          input message: "Cerebro ${imageTag} canlıya alınsın mı?", ok: 'Canlıya al', submitter: 'cerebro-release-managers'
        }
        script { deploy('prod', 'cerebro-prod', 'openshift-token-prod', imageTag) }
      }
    }
  }

  post {
    always {
      archiveArtifacts allowEmptyArchive: true, artifacts: 'api.log'
    }
  }
}

/** helm upgrade of the same image into one namespace, then waits for the rollout. */
def deploy(String environment, String namespace, String tokenCredential, String tag) {
  container('tools') {
    withCredentials([string(credentialsId: tokenCredential, variable: 'OC_TOKEN')]) {
      sh """
        oc login --token="\$OC_TOKEN" --server='${params.OPENSHIFT_API}' > /dev/null
        helm lint deploy/helm/cerebro -f deploy/helm/cerebro/values-${environment}.yaml --set image.tag=${tag}
        helm upgrade --install cerebro deploy/helm/cerebro \
          --namespace '${namespace}' \
          -f deploy/helm/cerebro/values-${environment}.yaml \
          --set image.repository='${env.IMAGE_REPOSITORY}' \
          --set image.tag='${tag}' \
          --wait --timeout 10m --history-max 10
        oc -n '${namespace}' rollout status deploy/cerebro --timeout=5m
      """
    }
  }
}
