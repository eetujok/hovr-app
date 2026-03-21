import { deleteRecord, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { getAppMetafields, modifyAppMetafield } from "../../../helpers/shopifyAppMetafieldFunctions";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  
  await preventCrossShopDataAccess(params, record);

  try {
    logger.info({ productId: record.id }, "Starting run for shopifyProductMedia delete");
    // Get shop data to check if video sync is enabled
    const shop = await api.shopifyShop.findOne(record.shopId, {
      select: { id: true, videoSyncEnabled: true }
    });

    logger.debug({ 
      shopId: record.shopId, 
      videoSyncEnabled: shop?.videoSyncEnabled 
    }, "Checking video sync status for shop");

    if (shop?.videoSyncEnabled !== "TRUE") {
      logger.debug({ 
        shopId: record.shopId, 
        videoSyncEnabled: shop?.videoSyncEnabled 
      }, "Video sync not enabled for shop, skipping video processing");
      return;
    }
    
    logger.info({ productId: record.id }, "Video sync enabled for shop, checking if video is productVideo");

    const productMediaRecord = await api.shopifyProductMedia.findFirst({
      filter: {
        id: { equals: record.id } 
      },
      select: { 
        id: true,
        product: {
          id: true,
          videoSet: true,
          productVideos: {
            id: true,
            syncVideo: true
          }
        }
     }
    });
    
    logger.debug({productMediaRecord: productMediaRecord}, "The product media record")

    // if syncEnabled hover video -> katso appMetafieldistä product id:n avulla appData value ja poista. 
    if (productMediaRecord?.product?.productVideos && productMediaRecord?.product?.productVideos?.syncVideo) {

      const result = await api.productVideos.delete(productMediaRecord.product.productVideos.id)    
      logger.debug("Synced video hover succesfully deleted")
    } else {
      logger.debug("No hover video for file found, or video is not a sync video.")
    }

  } catch (error) {
    logger.error({ 
      productId: record.id, 
      error: error.message,
      stack: error.stack 
    }, "Error in shopifyProductMedia delete onSuccess");
  }
  
  await deleteRecord(record);
  
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
};

/** @type { ActionOptions } */
export const options = { actionType: "delete" };
