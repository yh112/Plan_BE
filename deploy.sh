#!/bin/bash

echo "Deploying with the following credentials:"
echo "USER: $USER"
echo "SERVER: $SERVER"

cd /home/yihyun/plan/Plan_BE


# SSH 설정
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa
echo "SSH setup completed."

# SSH 키가 제대로 설정되어 있는지 확인
if [ ! -s ~/.ssh/id_rsa ]; then
  echo "Error: SSH private key is missing or empty!"
  exit 1
else
  echo "SSH private key is present."
fi

# SSH 설정
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install 22  # Node.js 16 버전 설치
nvm use 22

git remote -v
git pull origin main -o StrictHostKeyChecking=no
git log -1  # 가장 최신 커밋을 확인

npm install

# 애플리케이션 상태 확인
if pm2 jlist | jq '.[] | select(.name == "app") | .pm2_env.status' > /dev/null; then
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