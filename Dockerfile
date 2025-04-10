# --------- Stage 1: Build ----------
    FROM node:slim AS builder

    WORKDIR /app
    
    # Install dependencies
    COPY package*.json ./
    RUN npm install
    
    # Copy app source code
    COPY . .
    
    # --------- Stage 2: Production ----------
    FROM node:slim
    
    WORKDIR /app
    
    # Copy only needed files from builder
    COPY --from=builder /app /app
    
    # Expose the port your app listens on
    EXPOSE 3000
    
    # Set environment
    ENV NODE_ENV=production
    
    # Start the app
    CMD ["node", "server.js"]
    