import { ActionOptions } from "gadget-server";

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  try {
    // Validate shopId parameter
    const { shopId } = params;
    if (!shopId) {
      throw new Error("shopId parameter is required");
    }

    logger.info(`Starting product video sync for shop ${shopId}`);

    // Get all products for this shop that don't have a video record yet
    const products = await api.shopifyProduct.findMany({
      filter: {
        AND: [
          { shopId: { equals: shopId } },
          { videoSet: { equals: false } }
        ]
      },
      select: {
        id: true,
        title: true,
        media: {
          edges: {
            node: {
              id: true,
              mediaContentType: true,
              originalSource: true
            }
          }
        }
      }
    });

    logger.info(`Found ${products.length} products without video records`);

    // Track results
    const results = {
      productsProcessed: products.length,
      videosFound: 0,
      videosCreated: 0,
      errors: []
    };

    // Update the videoSyncEnabled flag on the parent store
    await api.internal.shopifyShop.update(shopId, {
      videoSyncEnabled: "TRUE"
    });

    // Process each product
    for (const product of products) {
      try {
        // Check if product has video media
        const videoMedia = product.media?.edges?.find(edge =>
          edge.node.mediaContentType === "VIDEO"
        );

        logger.info(`Video Media`, videoMedia);

        if (videoMedia) {
          results.videosFound++;
          logger.info(`Found video for product: ${product.title} (${product.id})`);

          // Create a new productVideos record using the syncCreate action
          await api.productVideos.syncCreate({
            product: {
              _link: product.id
            },
            fileId: `gid://shopify/Video/${videoMedia.node.id}`,
            status: "active",
            type: "HOVER",
            options: "COLLECTION",
            src: videoMedia.node.originalSource.url,
            syncVideo: true
          });

          // Update the videoSet flag on the product
          await api.shopifyProduct.update(product.id, {
            videoSet: true
          });

          results.videosCreated++;
        }
      } catch (productError) {
        logger.error(`Error processing product ${product.id}: ${productError.message}`);
        results.errors.push({
          productId: product.id,
          error: productError.message
        });
      }
    }

    logger.info(`Completed product video sync. Found ${results.videosFound} videos, created ${results.videosCreated} records`);
    return results;
  } catch (error) {
    logger.error(`Failed to sync product videos: ${error.message}`);
    throw error;
  }
};

/** @type { ActionOptions } */
export const options = {
  returnType: true,
  timeoutMS: 600000
};

export const params = {
  shopId: {
    type: "string"
  }
};