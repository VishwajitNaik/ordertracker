# Use an official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Install global dependencies like Expo and Ngrok
RUN npm install -g expo-cli @expo/ngrok

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose the port used by the mobile app
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Start the Metro Bundler
CMD ["npx", "expo", "start", "--tunnel"]
