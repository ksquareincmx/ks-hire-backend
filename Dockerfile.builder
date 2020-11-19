FROM node:10

# Wait for it
ENV WAIT_FOR_IT_VERSION 54d1f0b
RUN curl -sL https://raw.githubusercontent.com/vishnubob/wait-for-it/$WAIT_FOR_IT_VERSION/wait-for-it.sh > /usr/local/bin/wait-for-it \
	&& chmod +x /usr/local/bin/wait-for-it

# Set working directory
WORKDIR /usr/src/ks-hire

# Copy project files
COPY package.json .
COPY package-lock.json .

# Install node packages
RUN npm ci

# Bundle app source
COPY . .

# Run linter, setup and tests
CMD npm run lint && npm run setup && npm run test
