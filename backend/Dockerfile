FROM node:18-alpine

RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY python/requirements.txt ./python/
RUN pip3 install --no-cache-dir -r python/requirements.txt --break-system-packages

COPY . .

EXPOSE 3001

USER node

CMD ["npm", "start"] 