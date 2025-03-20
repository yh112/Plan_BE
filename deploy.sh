#!/bin/bash

echo "Deploying with the following credentials:"
echo "USER: $USER"
echo "SERVER: $SERVER"

cd /home/yihyun/plan/Plan_BE

git pull origin main

npm install

# 애플리케이션 상태 확인
pm2 list | grep 'app.js' > /dev/null

# 애플리케이션이 실행 중인지 확인하고, 실행 중이면 재시작, 없으면 새로 시작
if [ $? -eq 0 ]; then
  # 이미 실행 중이면 애플리케이션 재시작
  echo "Application is already running. Restarting..."
  pm2 restart app.js || exit
else
  # 실행 중이지 않으면 새로 시작
  echo "Application is not running. Starting..."
  pm2 start app.js || exit
fi

# 애플리케이션 상태 확인
pm2 list