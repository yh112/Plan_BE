#!/bin/bash

echo "Deploying with the following credentials:"
echo "USER: $USER"
echo "SERVER: $SERVER"

cd /home/yihyun/plan/Plan_BE

# SSH 설정
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa

# Git 리모트 URL을 SSH로 변경
git remote set-url origin git@github.com:yihyun/Plan_BE.git

ssh -T git@github.com

git pull origin main
git log -1  # 가장 최신 커밋을 확인

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