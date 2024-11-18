import express from 'express';
import http from 'http';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { typeDefs, resolvers } from './graphql/schema.js';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import path from 'path'
import { fileURLToPath } from 'url';
import { graphqlUploadExpress } from "graphql-upload";

// Set up environment variables for security and flexibility
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

// Initialize Express application and PubSub instance
const app = express();
const pubsub = new PubSub();

// CORS middleware to handle cross-origin requests
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

// Create schema from type definitions and resolvers
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Helper function for decoding JWT tokens
const getUserFromToken = (token) => {
  try {
    if (token) {
      const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET_KEY);
      return decoded.id; // Return user ID from JWT
    }
  } catch (error) {
    console.error("Error decoding token:", error);
  }
  return null;
};

// Initialize Apollo Server
const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    const token = req.headers.authorization || "";
    const userId = getUserFromToken(token);
   
    return { userId, pubsub };
  },
  subscriptions: false, // Disable default subscriptions handling in Apollo Server
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const da = path.join(__dirname, '../uploads')
console.log(da)

app.use('/uploads',express.static(path.join(__dirname, '/uploads')))
// Function to start the Apollo Server and handle WebSocket setup
const startServer = async () => {
  await server.start();
  server.applyMiddleware({ app });

  // Create HTTP server to handle both HTTP and WebSocket requests
  const httpServer = http.createServer(app);

  // Set up WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Use graphql-ws library to handle GraphQL subscriptions and set context for WebSocket
  useServer({
    schema,
    context: async (ctx) => {
      // Get the token from the connection params
      const token = ctx.connectionParams?.Authorization || '';
      const userId = getUserFromToken(token);

  
      console.log(token,"hai")
      console.log(userId)
      return { userId, pubsub }; // Set user ID in context for subscriptions
    },
  }, wsServer);

  // Start the HTTP server
  httpServer.listen(PORT, () => {
    console.log(` Server is running at http://localhost:${PORT}`);
    console.log(` GraphQL API available at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(` Subscriptions available at ws://localhost:${PORT}${server.graphqlPath}`);
  });
};

// Initialize server
startServer().catch((error) => {
  console.error("Server failed to start", error);
});


