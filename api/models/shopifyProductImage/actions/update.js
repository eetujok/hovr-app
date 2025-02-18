import { applyParams, preventCrossShopDataAccess, save, ActionOptions, UpdateShopifyProductImageActionContext } from "gadget-server";
import { modifyAppMetafield, getAppMetafields, getStreamLinksObject, parseImageSrc } from "../../../helpers/shopifyAppMetafieldFunctions"

/**
 * @param { UpdateShopifyProductImageActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/**
 * @param { UpdateShopifyProductImageActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {
  
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

  
  // Get and parse previous values for stream_links app metafield.

  const metafieldsResp = await getAppMetafields(connections, record.shopId);
  const valueJson = getStreamLinksObject(metafieldsResp)
  const previousValues = valueJson

  // Update app metafield, if featured image is not included. 
  const newValues = updateImageInArray(previousValues.links, response.product.id.split('/').pop(), parseImageSrc(response.product.featuredImage.url))
  const updateResp = await modifyAppMetafield(newValues, "update", connections, record.shopId, logger)


};

/** @type { ActionOptions } */
export const options = { actionType: "update" };
