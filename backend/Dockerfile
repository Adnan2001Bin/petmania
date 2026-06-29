FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma migrate dev
# RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run" , "dev"]
