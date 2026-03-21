import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { modifyAppMetafield, getAppMetafields, getStreamLinksObject, parseImageSrc } from "../../../helpers/shopifyAppMetafieldFunctions"

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
 const updateImageInArray = (objectsArray, targetId, newSrcImage) => {

    return objectsArray.map(obj => {
        if (obj.id === targetId && obj.srcImage !== newSrcImage) {
            return {
                ...obj,
                srcImage: newSrcImage
            };
        }
        return obj;
    });
  }

    // First, check if the product has a video assigned (videoSet == true)
    const product = await api.shopifyProduct.findOne(record.productId, {
      select: {
        id: true,
        videoSet: true
      }
    });
    
    // If the product doesn't have a video assigned, we don't need to update the metafield
    if (!product.videoSet) {
      logger.info(`Product ${record.productId} doesn't have a video assigned, skipping metafield update`);
      return;
    }
    
  logger.info(`Updating metafield for product ${record.productId} with videoSet=${product.videoSet}`);

  const shopify = await connections.shopify.forShopId(record.shopId)

  const response = await shopify.graphql(`
    query getProductFirstImage($productId: ID!) {
      product(id: $productId) {
        id
        featuredImage {
          id
          url
        }
      }
    }
  `, {
    productId: `gid://shopify/Product/${record.productId}`
  })

  logger.info({"productFirstImageResponse": response}, "Line 59")
  
  // Get and parse previous values for stream_links app metafield.

  const metafieldsResp = await getAppMetafields(connections, record.shopId);
  logger.info({"metafieldsResp": metafieldsResp}, "Line 64")

  const valueJson = getStreamLinksObject(metafieldsResp)
  const previousValues = valueJson

  // Update app metafield, if featured image is not included. 
  const newValues = updateImageInArray(previousValues.links, response.product.id.split('/').pop(), parseImageSrc(response.product.featuredImage.url))

  logger.info({"oldInfo": previousValues, "newValues": newValues}, `Updating featured image for ${response.product.id} in app metafield.`)
  const updateResp = await modifyAppMetafield(newValues, "update", connections, record.shopId, logger)
};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
