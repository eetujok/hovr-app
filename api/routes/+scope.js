import { Server } from "gadget-server";

/**
 * Route plugin for *
 *
 * @param { Server } server - server instance to customize, with customizations scoped to descendant paths
 *
 * @see {@link https://www.fastify.dev/docs/latest/Reference/Server}
 */
import cors from "@fastify/cors";
import FastifyMultipart from "@fastify/multipart";

export default async function (server) {
  await server.register(cors, {
    origin: true, 
  });
  await server.register(FastifyMultipart);
}