import { PostToShopifyAppMetafieldGlobalActionContext } from "gadget-server";
import { modifyAppMetafield, parseImageSrc, getProductFeaturedImage } from "../helpers/shopifyAppMetafieldFunctions"

export const params = {
  operation: {
    type: "string"
  },
  shopId: {
    type: "string"
  },
  appMetafieldValue: {
    type: "object",
    properties: {
      "id": { type: "string" },
      "streamLink": { type: "string" },
      "srcImage": { type: "string"},
      "handle": {type: "string"},
      "videoType": {type: "string"},
      "options": {type: "string"}
    }
  }
  

}
/**
 * @param { PostToShopifyAppMetafieldGlobalActionContext } context
 */
export async function run({ params, logger, api, connections }) {
  
  const { 
    appMetafieldValue,    // The value to write to the metafield
    operation,         // The operation to perform (add/remove)
    shopId,           // The shop ID for the connection
  } = params;

  
    logger.info(appMetafieldValue, "Input metafield value before modifyAppMetafield")
  
    const result = await modifyAppMetafield(
      appMetafieldValue,
      operation,
      connections,
      shopId,
      logger
    );
    
    logger.info(result, "Video status updated");
    
    

}
