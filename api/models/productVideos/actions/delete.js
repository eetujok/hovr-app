import { deleteRecord, ActionOptions, DeleteProductVideosActionContext } from "gadget-server";
import { deleteVideoInBunnyCDN, deleteVideoInBunnyStorage } from "../../../helpers/bunnyFunctions.js"
import { getAppMetafields, modifyAppMetafield, getStreamLinksObject } from "../../../helpers/shopifyAppMetafieldFunctions"
/**
 * @param { DeleteProductVideosActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  await deleteRecord(record);

  const deleteObjectFromArray = (objectsArray, targetId) => {
    return objectsArray.filter(obj => obj.id !== targetId);
  }


  const product = await api.shopifyProduct.maybeFindFirst({
    filter: {
      id: {equals: record.productId}
    },
    select: {
      shopId: true,
    }
  })

  const metafieldsResp = await getAppMetafields(connections, product.shopId);
  logger.info(metafieldsResp, "Metafield response from delete")

  const valueJson = getStreamLinksObject(metafieldsResp)
  const previousValues = valueJson

  const newValues = deleteObjectFromArray(previousValues.links, record.productId);

  const deleteResp = await modifyAppMetafield(newValues, "delete", connections, product.shopId, logger)

};

/**
 * @param { DeleteProductVideosActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {
  // First, try to delete the file from Shopify if fileId exists
  if (record.fileId && !record.syncVideo) {
    try {
      // Get the shop connection for the product
      const product = await api.shopifyProduct.maybeFindFirst({
        filter: {
          id: {equals: record.productId}
        },
        select: {
          shopId: true,
        }
      });
      
      if (product) {
        const shopify = await connections.shopify.forShopId(product.shopId);
        
        // Delete the file using Shopify's fileDelete mutation
        const fileDeleteResponse = await shopify.graphql(`
          mutation fileDelete($fileIds: [ID!]!) {
            fileDelete(fileIds: $fileIds) {
              deletedFileIds
              userErrors {
                field
                message
              }
            }
          }
        `, {
          fileIds: [record.fileId]
        });
        
        logger.info(fileDeleteResponse, "Shopify file delete response");
        
        if (fileDeleteResponse.fileDelete.userErrors && fileDeleteResponse.fileDelete.userErrors.length > 0) {
          logger.warn({
            errors: fileDeleteResponse.fileDelete.userErrors,
            fileId: record.fileId
          }, "Errors deleting file from Shopify, will try Bunny CDN as fallback");
          throw new Error("Failed to delete file from Shopify");
        } else {
          logger.info({
            deletedFileIds: fileDeleteResponse.fileDelete.deletedFileIds
          }, "Successfully deleted file from Shopify");
        }
      }
    } catch (error) {
      logger.error(error, "Error deleting file from Shopify, falling back to Bunny deletion");
      // Continue to Bunny deletion as fallback
    }
  } else {
    logger.info("No fileId found or a video sync file is processed, skipping Shopify file deletion");
  }

  // Fallback: Try to delete from Bunny if there's a GUID
  const guid = record.bunnyGUID;
  if (guid) {
    try {
      const deleteResponse = await deleteVideoInBunnyStorage(guid);
      logger.info(deleteResponse, "Video deleted from BunnyStorage");
    } catch (error) {
      logger.error(error, "Error deleting video from BunnyStorage, trying to delete from BunnyCDN");

      try {
        const deleteResponse = await deleteVideoInBunnyCDN(guid);
        logger.info(deleteResponse, "Video deleted from BunnyCDN");
      } catch (error) {
        logger.error(error, "Error deleting video from BunnyCDN");
      }
    }
  } else {
    logger.info("No bunnyGUID found, skipping Bunny deletion");
  }
  
  // Update the product's videoSet flag to false
  const productResponse = await api.shopifyProduct.update(record.productId, {
    videoSet: false,
  });
  
  logger.info(productResponse, "Product videoSet to false");
};

/** @type { ActionOptions } */
export const options = {
  actionType: "delete",
  transactional: false,
};
