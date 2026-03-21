import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  try {
    
    logger.info({ productId: record.id }, "Starting onSuccess for shopifyProductMedia update");
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

    logger.info({ productId: record.id }, "Video sync enabled for shop, checking product video status");

    const productMediaRecord = await api.shopifyProductMedia.findFirst({
      filter: {
        id: { equals: record.id } 
      },
      select: { 
        id: true,
        product: {
          id: true,
          videoSet: true
        },
        file: {
          id: true,
          mediaContentType: true,
          originalSource: true
        }
     }
    });
    
    logger.debug({productMediaRecord: productMediaRecord}, "The product media record")
    // Check if product doesn't have video set
    if (productMediaRecord.product.videoSet) {
      logger.debug({ productId: record.id }, "Product already has video set, skipping");
      return;
    }

    logger.debug({ productMediaId: record.id }, "Found product media");



    if (productMediaRecord.file.mediaContentType !== "VIDEO") {
      logger.debug({ productMediaId: record.id }, "Media file is not a video.");
      return;
    }

    logger.info({ productId: record.id }, "Found video media, creating a productVideo record");


      try {
        const result = await api.productVideos.syncCreate({
          product: { 
            _link: productMediaRecord.product.id 
          },
          fileId: `gid://shopify/Video/${productMediaRecord.file.id}`,
          status: "active",
          type: "HOVER",
          options: "COLLECTION",
          src: productMediaRecord.file.originalSource.url,
          syncVideo: true,
        });

        logger.info({ 
          productId: productMediaRecord.product.id, 
          fileId: productMediaRecord.file.id,
          productVideosId: result?.id 
        }, "Successfully created productVideos record");
      } catch (error) {
        logger.error({ 
          productId: productMediaRecord.product.id, 
          fileId: productMediaRecord.file.id,
          error: error.message 
        }, "Failed to create productVideos record");
      }
    

  } catch (error) {
    logger.error({ 
      productId: record.id, 
      error: error.message,
      stack: error.stack 
    }, "Error in shopifyProductMedia update onSuccess");
    // Don't re-throw the error to prevent webhook failures
  }
};

/** @type { ActionOptions } */
export const options = { actionType: "create" };
