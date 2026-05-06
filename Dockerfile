FROM node:18-alpine

# Keep WORKDIR consistent with VPS layout (requested):
WORKDIR /opt/SENA/BackEnd-SENA

# install deps
COPY package*.json ./
RUN npm install --production

# copy sources
COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
