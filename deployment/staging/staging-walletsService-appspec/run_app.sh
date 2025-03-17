#!/bin/bash

cd /home/ec2-user/

# Stop the running Docker container
sudo docker rm $(sudo docker stop $(sudo docker ps -a -q --filter ancestor=575439814610.dkr.ecr.eu-west-1.amazonaws.com/staging-wallets-service:latest --format="{{.ID}}"))

# Authenticate with AWS ECR
aws ecr get-login-password --region eu-west-1 | sudo docker login --username AWS --password-stdin 575439814610.dkr.ecr.eu-west-1.amazonaws.com

# Pull the latest Docker image
sudo docker pull 575439814610.dkr.ecr.eu-west-1.amazonaws.com/staging-wallets-service:latest

# Run the newly pulled image
sudo docker run -d -p 80:8080 -e NODE_ENV=staging -e SERVICE=staging-walletsService --log-driver=awslogs --log-opt awslogs-region=eu-west-1 --log-opt awslogs-group=/aws/ec2/staging-walletsService --log-opt awslogs-create-group=true 575439814610.dkr.ecr.eu-west-1.amazonaws.com/staging-wallets-service:latest