pipeline {
    agent any

    environment {
        NODE_VERSION = '16.x'
        REGISTRY_URL = 'https://registry.hub.docker.com'
        DOCKER_CREDENTIALS = credentials('docker-hub-credentials')
        APP_NAME = 'node-hello-world'
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['dev', 'staging', 'production'], description: 'Deployment environment')
        string(name: 'BRANCH', defaultValue: 'master', description: 'Branch to build')
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: "${params.BRANCH}", 
                    url: 'https://github.com/zim0101/node-hello-world.git'
            }
        }

        stage('Setup Node') {
            steps {
                nodejs(nodeJSInstallationName: 'Node 16') {
                    sh 'node --version'
                    sh 'npm --version'
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npx eslint .'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
                junit 'coverage/junit.xml'
            }
            post {
                always {
                    jacoco execPattern: 'coverage/jacoco.exec'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${APP_NAME}:${env.BUILD_NUMBER}")
                }
            }
        }

        stage('Push to Registry') {
            when { branch 'master' }
            steps {
                script {
                    docker.withRegistry(REGISTRY_URL, DOCKER_CREDENTIALS) {
                        docker.image("${APP_NAME}:${env.BUILD_NUMBER}").push()
                    }
                }
            }
        }

        stage('Deploy') {
            when { expression { params.DEPLOY_ENV == 'production' } }
            steps {
                script {
                    // Example deployment step
                    sh """
                        kubectl set image deployment/${APP_NAME} \
                        ${APP_NAME}=${APP_NAME}:${env.BUILD_NUMBER}
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            slackSend(
                color: 'good', 
                message: "Build ${env.BUILD_NUMBER} succeeded for ${APP_NAME}"
            )
        }
        failure {
            echo 'Pipeline failed!'
            slackSend(
                color: 'danger', 
                message: "Build ${env.BUILD_NUMBER} failed for ${APP_NAME}"
            )
        }
        always {
            cleanWs()
            deleteDir()
        }
    }
}