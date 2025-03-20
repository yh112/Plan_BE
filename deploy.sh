#!/bin/bash

echo "Deploying with the following credentials:"
echo "USER: $USER"
echo "SERVER: $SERVER"
=
cd /home/yihyun/Plan_BE
git pull origin main
npm install
pm2 restart all