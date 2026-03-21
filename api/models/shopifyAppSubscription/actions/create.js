import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { modifyAppConditionMetafield } from "../../../helpers/shopifyAppMetafieldFunctions";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  // Check if subscription status is active and enable theme extension
  if (record.status === 'ACTIVE') {
    try {
      logger.info(`Subscription activated for shop ${record.shopId}, enabling theme extension`);
            
      // Enable the theme extension by setting extension_enabled metafield to true
      await modifyAppConditionMetafield(true, connections, record.shopId)      
      
      logger.info(`Successfully enabled theme extension for shop ${record.shopId}`);
    } catch (error) {
      logger.error(`Failed to enable theme extension for shop ${record.shopId}: ${error.message}`);
      // Don't throw error to avoid breaking the subscription creation
    }
  }
};

/** @type { ActionOptions } */
export const options = { actionType: "create" };
