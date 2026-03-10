FROM node:20

WORKDIR /app

COPY package*.json ./

RUN node -e "const fs=require('fs');const p=require('./package.json');if(p.devDependencies && p.devDependencies['@web-bench/test-util']){delete p.devDependencies['@web-bench/test-util'];}fs.writeFileSync('package.json',JSON.stringify(p,null,2));" \
    && npm install

COPY . .

ENV EVAL_PROJECT_PORT=3211

EXPOSE 3211

CMD ["bash", "-lc", "npx vite --port ${EVAL_PROJECT_PORT:-3211} --host 0.0.0.0"]
