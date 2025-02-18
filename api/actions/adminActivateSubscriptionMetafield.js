/** @type { ActionRun } */

import { modifyAppConditionMetafield } from "../helpers/shopifyAppMetafieldFunctions"

export const params = {
  shopId: {type: "string"}
}
export const run = async ({ params, logger, api, connections }) => {

    const response = await modifyAppConditionMetafield(true, connections, params.shopId)
    logger.info(response, "Subscription activated manually.")
  
};
