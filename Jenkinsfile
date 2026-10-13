pipeline {
  agent none

  stages {
    stage('Npm Install') {
      agent any
      steps {
        sh 'npm ci'
      }
    }

    stage('Build') {
      agent any
      steps {
        sh 'npm run build'
      }
    }

    stage('Docker Build') {
      agent any
      steps {
        sh 'docker build -t kevinmateog/flix-backend:$BUILD_NUMBER -t kevinmateog/flix-backend:latest .'
      }
    }

    stage('Docker Push') {
      agent any
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerHub',
          passwordVariable: 'dockerHubPassword',
          usernameVariable: 'dockerHubUser'
        )]) {
          sh 'echo "$dockerHubPassword" | docker login -u "$dockerHubUser" --password-stdin'
          sh 'docker push kevinmateog/flix-backend:$BUILD_NUMBER'
          sh 'docker push kevinmateog/flix-backend:latest'
          sh 'docker logout'
        }
      }
    }

  }
}
