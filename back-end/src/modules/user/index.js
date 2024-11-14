import authResolvers from "./auth/graphql/auth-resolvers.js";
import authTypeDefs from "./auth/graphql/auth-typedefs.js";
import chatResolvers from "./chat/graphql/chat-resolvers.js";
import chatTypeDefs from "./chat/graphql/chat-typedefs.js";

const userResolvers = [chatResolvers,authResolvers]
const userTypeDefs = [chatTypeDefs,authTypeDefs]

export { userTypeDefs, userResolvers };