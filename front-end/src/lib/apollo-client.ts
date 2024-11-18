import { ApolloClient, InMemoryCache,  ApolloLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import Cookies from 'js-cookie';
import createUploadLink  from 'apollo-upload-client/createUploadLink.mjs';

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:5000/graphql',
    connectionParams: () => ({
      Authorization: `Bearer ${Cookies.get('userToken')}`,
    }),
  })
);

const httpLink = createUploadLink({
  uri: 'http://localhost:5000/graphql',
  credentials: 'same-origin',
  headers: {
    Authorization: `Bearer ${Cookies.get('userToken')}`,
  },
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink
);

const apolloClient = new ApolloClient({
  link: ApolloLink.from([splitLink]),
  cache: new InMemoryCache(),
});

export default apolloClient;
