/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const { shopId } = params;
  
  logger.info({ shopId }, "Starting to disable sync for product videos");

  // Find all productVideos records where syncVideo == true for products belonging to the specified shop
  const productVideosToDelete = await api.productVideos.findMany({
    filter: {
      AND: [
        { syncVideo: { equals: true } },
        { product: { shop: { id: { equals: shopId } } } }
      ]
    },
    select: {
      id: true,
      product: {
        id: true,
        title: true
      }
    }
  });

  logger.info({ count: productVideosToDelete.length, shopId }, "Found product videos to delete");

  // Delete each found productVideos record using the delete model action
  let deletedCount = 0;
  
  for (const productVideo of productVideosToDelete) {
    await api.productVideos.delete(productVideo.id);
    deletedCount++;
    logger.info({ 
      productVideoId: productVideo.id, 
      productTitle: productVideo.product?.title,
      deletedCount,
      totalToDelete: productVideosToDelete.length 
    }, "Deleted product video");
  }

  // Update the videoSyncEnabled flag on the parent store
  await api.internal.shopifyShop.update(shopId, {
    videoSyncEnabled: "FALSE"
  });

  logger.info({ shopId, deletedCount }, "Successfully disabled sync and deleted product videos");

  // Return a summary of the operation
  return {
    success: true,
    deletedCount,
    shopId,
    message: `Successfully deleted ${deletedCount} product video records and disabled sync for shop ${shopId}`
  };
};

/** @type { ActionOptions } */
export const params = {
  shopId: { type: "string" }
};
