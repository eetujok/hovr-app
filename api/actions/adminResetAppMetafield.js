import { modifyAppMetafield } from "../helpers/shopifyAppMetafieldFunctions"
export const params = {
  shopId: {
    type: "string"
  }
}

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {

  const shopId = params.shopId

  const resp = await modifyAppMetafield([], 'update', connections, shopId, logger)
  logger.info(resp, "Reset app metafield")
};
