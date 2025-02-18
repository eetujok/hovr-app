import { RouteContext } from "gadget-server";
import { modifyAppConditionMetafield } from "../../../helpers/shopifyAppMetafieldFunctions"

/**
 * Route handler for POST webhooks/mantle/subscriptionCancelled
 *
 * @param { RouteContext } route context - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 *
 */
export default async function route({ request, reply, api, logger, connections }) {

  const data = request.body;
  
  logger.info(data, "Data object")

  await modifyAppConditionMetafield(false, connections, data.customer.shopify.shopId)
  
  return reply.code(204).send();

  
}
