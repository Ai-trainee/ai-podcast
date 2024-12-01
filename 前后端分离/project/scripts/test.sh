#!/bin/bash

# 设置基础 URL（从环境变量获取端口）
PORT=${PORT:-3000}
BASE_URL="http://localhost:$PORT"

# 检查服务器是否可用
echo "正在检查服务器..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s "$BASE_URL" > /dev/null; then
    echo "服务器已就绪"
    break
  fi
  
  echo "服务器未就绪，等待..."
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "服务器未响应，请检查服务器是否正在运行"
  exit 1
fi

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "开始测试..."

# 1. 注册用户
echo -e "${GREEN}1. 注册新用户...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "username": "testuser"
  }')
echo "注册响应: $REGISTER_RESPONSE"

# 2. 登录
echo -e "${GREEN}2. 登录获取token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }')
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "获取到token: $TOKEN"

# 3. 测试文本转播客
echo -e "${GREEN}3. 测试文本转播客...${NC}"
PODCAST_RESPONSE=$(curl -s -X POST "$BASE_URL/api/podcast/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "text": "人工智能正在改变我们的生活方式。从语言处理到图像识别，从自动驾驶到医疗诊断，AI技术已经渗透到了社会的各个领域。"
  }')
TASK_ID=$(echo $PODCAST_RESPONSE | jq -r '.taskId')
echo "获取到taskId: $TASK_ID"

# 4. 轮询任务状态
echo -e "${GREEN}4. 开始轮询任务状态...${NC}"
for i in {1..10}; do
  echo "第 $i 次查询状态..."
  STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/podcast/status/$TASK_ID" \
    -H "Authorization: Bearer $TOKEN")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  PROGRESS=$(echo $STATUS_RESPONSE | jq -r '.progress')
  echo "当前状态: $STATUS, 进度: $PROGRESS"
  
  if [ "$STATUS" = "completed" ]; then
    AUDIO_URL=$(echo $STATUS_RESPONSE | jq -r '.audioUrl')
    echo -e "${GREEN}任务完成! 音频URL: $AUDIO_URL${NC}"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo -e "${RED}任务失败!${NC}"
    break
  fi
  
  sleep 5
done

echo "测试完成!" 