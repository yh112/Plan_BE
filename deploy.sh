#!/bin/bash
cd /home/yihyun/Plan_BE
git pull origin main
npm install
pm2 restart all