import { getAppMetafields } from "../helpers/shopifyAppMetafieldFunctions"

export const params = {
  shopId: {
    type: "string"
  }
}
/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  // Your logic goes here

  const shopId = params.shopId
  
  const response = await getAppMetafields(connections, shopId)

  logger.info(response, `Current app metafield for shop: ${shopId}`)

  return response
};
