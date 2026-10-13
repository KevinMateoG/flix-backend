pipeline {
  agent any

  environment {
    IMAGE = 'kevinmateog/flix-backend'
    NAMESPACE = 'flix-backend-ci'
  }

  stages {
    stage('Install and build') {
      steps {
        sh '''
          set -eu
          npm ci
          npm run build
        '''
      }
    }

    stage('Build and push image') {
      steps {
        script {
          withCredentials([
            usernamePassword(
              credentialsId: 'dockerhub',
              usernameVariable: 'DOCKERHUB_USERNAME',
              passwordVariable: 'DOCKERHUB_TOKEN'
            )
          ]) {
            sh '''
              set -eu
              echo "$DOCKERHUB_TOKEN" | docker login --username "$DOCKERHUB_USERNAME" --password-stdin
              docker build -t "$IMAGE:$BUILD_NUMBER" -t "$IMAGE:latest" .
              docker push "$IMAGE:$BUILD_NUMBER"
              docker push "$IMAGE:latest"
              docker logout
            '''
          }
        }
      }
    }

    stage('Validate in Minikube') {
      steps {
        script {
          withCredentials([
            string(credentialsId: 'flix-ci-db-password', variable: 'DB_PASSWORD'),
            string(credentialsId: 'flix-ci-better-auth-secret', variable: 'BETTER_AUTH_SECRET'),
            string(credentialsId: 'flix-ci-tmdb-api-key', variable: 'TMDB_API_KEY')
          ]) {
            sh '''
              set -eu
              minikube status >/dev/null 2>&1 || minikube start --driver=docker
              minikube image load "$IMAGE:$BUILD_NUMBER"
              kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
              kubectl -n "$NAMESPACE" create secret generic flix-secrets \
                --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
                --from-literal=BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
                --from-literal=TMDB_API_KEY="$TMDB_API_KEY" \
                --dry-run=client -o yaml | kubectl apply -f -

              cat <<YAML | kubectl apply -f -
              apiVersion: apps/v1
              kind: Deployment
              metadata:
                name: db
                namespace: $NAMESPACE
              spec:
                selector:
                  matchLabels: { app: db }
                template:
                  metadata:
                    labels: { app: db }
                  spec:
                    containers:
                      - name: postgres
                        image: postgres:17-alpine
                        env:
                          - { name: POSTGRES_DB, value: flix }
                          - { name: POSTGRES_USER, value: flix_user }
                          - name: POSTGRES_PASSWORD
                            valueFrom: { secretKeyRef: { name: flix-secrets, key: POSTGRES_PASSWORD } }
                        readinessProbe:
                          exec: { command: ["pg_isready", "-U", "flix_user", "-d", "flix"] }
                          periodSeconds: 5
              ---
              apiVersion: v1
              kind: Service
              metadata:
                name: db
                namespace: $NAMESPACE
              spec:
                selector: { app: db }
                ports: [{ port: 5432, targetPort: 5432 }]
              ---
              apiVersion: apps/v1
              kind: Deployment
              metadata:
                name: backend
                namespace: $NAMESPACE
              spec:
                selector:
                  matchLabels: { app: backend }
                template:
                  metadata:
                    labels: { app: backend }
                  spec:
                    containers:
                      - name: backend
                        image: $IMAGE:$BUILD_NUMBER
                        imagePullPolicy: Never
                        ports: [{ containerPort: 3000 }]
                        env:
                          - { name: PORT, value: "3000" }
                          - name: DATABASE_URL
                            value: postgresql://flix_user:$DB_PASSWORD@db:5432/flix
                          - { name: BETTER_AUTH_URL, value: http://localhost:3000 }
                          - { name: BETTER_AUTH_TRUSTED_ORIGINS, value: http://localhost:5173 }
                          - name: BETTER_AUTH_SECRET
                            valueFrom: { secretKeyRef: { name: flix-secrets, key: BETTER_AUTH_SECRET } }
                          - name: TMDB_API_KEY
                            valueFrom: { secretKeyRef: { name: flix-secrets, key: TMDB_API_KEY } }
                        readinessProbe:
                          httpGet: { path: /, port: 3000 }
                          initialDelaySeconds: 15
                          periodSeconds: 5
              ---
              apiVersion: v1
              kind: Service
              metadata:
                name: backend
                namespace: $NAMESPACE
              spec:
                selector: { app: backend }
                ports: [{ port: 3000, targetPort: 3000 }]
              YAML

              kubectl -n "$NAMESPACE" wait --for=condition=available deployment/db deployment/backend --timeout=180s
              kubectl -n "$NAMESPACE" run smoke --rm -i --restart=Never \
                --image=curlimages/curl:8.10.1 -- curl --fail http://backend:3000/
            '''
          }
        }
      }
    }
  }

  post {
    always {
      sh '''
        set +e
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true --wait=false
      '''
    }
  }
}
