pipeline {
    agent any

    environment {
        NODE_VERSION = '16.x'
        GITHUB_REPO_URL = 'https://github.com/zim0101/node-hello-world'
        APP_NAME = 'node-hello-world'
        DEPLOY_SERVER = 'user@vm-server-ip'
        APP_PATH = '/opt/node-apps/node-hello-world'
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
                    url: "${GITHUB_REPO_URL}"
                
                sh 'node --version'
                sh 'npm --version'
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

        stage('Unit Tests') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    junit 'coverage/junit.xml'
                    jacoco execPattern: 'coverage/jacoco.exec'
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Security Scan') {
            steps {
                sh 'npm audit'
            }
        }

        stage('Deploy') {
            when {
                branch 'master'
            }
            steps {
                script {
                    // Prepare deployment based on environment
                    def deployConfig = [
                        'dev': [port: 3000],
                        'staging': [port: 3001],
                        'production': [port: 3002]
                    ][params.DEPLOY_ENV]

                    // Stop existing application if running
                    sh """
                        ssh ${DEPLOY_SERVER} "
                            if pm2 list | grep ${APP_NAME}-${params.DEPLOY_ENV}; then
                                pm2 delete ${APP_NAME}-${params.DEPLOY_ENV}
                            fi
                        "
                    """

                    // Copy files to server
                    sh """
                        ssh ${DEPLOY_SERVER} "mkdir -p ${APP_PATH}"
                        scp -r . ${DEPLOY_SERVER}:${APP_PATH}
                    """

                    // Install dependencies and start application
                    sh """
                        ssh ${DEPLOY_SERVER} "
                            cd ${APP_PATH} &&
                            npm ci &&
                            PM2_HOME=/home/user/.pm2 pm2 start npm --name ${APP_NAME}-${params.DEPLOY_ENV} -- start -- --port ${deployConfig.port}
                        "
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            slackSend color: 'good', 
                      message: "Build ${env.BUILD_NUMBER} succeeded for ${APP_NAME}"
        }
        failure {
            echo 'Pipeline failed!'
            slackSend color: 'danger', 
                      message: "Build ${env.BUILD_NUMBER} failed for ${APP_NAME}"
        }
        always {
            cleanWs()
        }
    }
}