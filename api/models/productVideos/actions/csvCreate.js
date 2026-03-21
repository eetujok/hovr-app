import { applyParams, save, ActionOptions, CsvCreateProductVideosActionContext } from "gadget-server";
import fetch from 'node-fetch';
import { bufferToStream, createVideoInBunnyCDN, uploadVideoInBunnyCDN } from "../../../helpers/bunnyFunctions.js"

/**
 * @param { CsvCreateProductVideosActionContext } context
 */
export async function run({ params, record, logger, api, connections }) {
  applyParams(params, record);
  
  // Set videoType to HOVER and videoOptions to COLLECTION for all CSV uploads
  record.type = "HOVER";
  record.options = "COLLECTION";
  
  await save(record);
};

export async function onSuccess({params, record, logger, api, connections}) {
  
  const productResponse = await api.shopifyProduct.update(record.productId, {
      videoSet: true,
  })
  
  logger.info(productResponse, "Product videoSet to true")
  
  // Get the shop connection for the product
  const product = await api.shopifyProduct.findOne(record.productId, {
    select: {
      id: true,
      shopId: true
    }
  });


  const url = record.batchUrl

  
  // Enqueue the pollVideo action to handle all video processing
  await api.enqueue(
    api.pollVideo,
    {
      productId: record.productId,
      recordId: record.id,
      videoUrl: url,
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
}

/** @type { ActionOptions } */
export const options = {
  actionType: "create",
  timeoutMS: 600000,
};
