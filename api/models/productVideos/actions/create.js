import { applyParams, save, ActionOptions, CreateProductVideosActionContext } from "gadget-server";

/**
 * @param { CreateProductVideosActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  await save(record);
};

/**
 * @param { CreateProductVideosActionContext } context
 */
export async function onSuccess({ params, record, logger, api, connections }) {
  // Update product to indicate video is being set
  const productResponse = await api.shopifyProduct.update(record.productId, {
    videoSet: true,
  });
  
  logger.info(productResponse, "Product videoSet to true");
  
  // Get the shop connection for the product
  const product = await api.shopifyProduct.findOne(record.productId, {
    select: {
      id: true,
      shopId: true
    }
  });

  // Enqueue the pollVideo action to handle all video processing
  await api.enqueue(
    api.pollVideo,
    {
      productId: record.productId,
      recordId: record.id,
      videoUrl: record.video.url,
      shopId: product.shopId,
      videoType: record.type,
      videoOptions: record.options
    },
    {
      queue: "videoProcessingQueue",
      maxConcurrency: 5
    }
  );

  logger.info("Enqueued pollVideo action to handle video processing");
};

/** @type { ActionOptions } */
export const options = {
  actionType: "create",
  timeoutMS: 600000,
};
