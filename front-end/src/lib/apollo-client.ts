import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { createClient } from 'graphql-ws';
import Cookies from 'js-cookie';

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: 'http://localhost:5000/graphql',
  
});

// Create WebSocket link using graphql-ws
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:5000/graphql',
  connectionParams: () => {
    const token = Cookies.get("userToken"); 
    return {
      authorization: token ? `Bearer ${token}` : '',
    };
  },
}));

// Auth link setup
const authLink = setContext((_, { headers }) => {
  const token = Cookies.get("userToken"); 
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error link to handle errors from Apollo Client (including WebSocket)
const errorLink = ApolloLink.from([
  new ApolloLink((operation, forward) => {
    return forward(operation).map((data) => {
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
      }
      return data;
    });
  }),
]);

// Split link configuration for using both HTTP and WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

// Create the Apollo Client
const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, splitLink]),
  cache: new InMemoryCache(),
});

export default apolloClient;
