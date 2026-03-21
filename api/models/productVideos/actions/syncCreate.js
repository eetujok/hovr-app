import { applyParams, save, ActionOptions } from "gadget-server";
import { parseImageSrc, getProductFeaturedImage } from "../../../helpers/shopifyAppMetafieldFunctions.js";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  try {
    // Apply params to the record and save it
    applyParams(params, record);
    await save(record);
    
    // Get src from params
    const src = params.productVideos?.src;
    
    // If no product ID or src, log and return
    if (!record.productId || !src) {
      logger.warn("Missing productId or src in syncCreate action", { productId: record.productId, src });
      return;
    }
    
    // Fetch the product to get handle and shop info
    const product = await api.shopifyProduct.findOne(record.productId, {
      select: {
        id: true,
        handle: true,
        shopId: true,
        videoSet: true
      }
    });
    
    if (!product) {
      logger.error("Product not found in syncCreate action", { productId: record.productId });
      return;
    }
    
    // Update product's videoSet flag to true if not already set
    if (!product.videoSet) {
      await api.shopifyProduct.update(product.id, { 
        videoSet: true 
      });
    }
        // Get the featured image for the product
    const featuredImageResponse = await getProductFeaturedImage(
      connections, 
      product.shopId, 
      record.productId
    );

    logger.info(featuredImageResponse, "Featured image fetched");
    
    // Prepare data for app metafield
    await api.enqueue(api.postToShopifyAppMetafield, {
      operation: "add",
      shopId: product.shopId,
      appMetafieldValue: {
        handle: product.handle,
        id: record.productId,
        streamLink: src,
        videoType: record.type || "HOVER",
        options: record.options || "COLLECTION",
        srcImage: parseImageSrc(featuredImageResponse.product.featuredImage.url),
      },
      maxConcurrency: 1
    });
    
    logger.info("Successfully created product video and updated metafield", {
      productId: record.productId,
      productHandle: product.handle
    });
    
  } catch (error) {
    logger.error("Error in syncCreate action", { 
      error: error.message, 
      productId: record.productId 
    });
    throw error;
  }
};

/** @type { ActionOptions } */
export const options = {
  actionType: "create",
};