import { applyParams, save, ActionOptions, CreateProductVideosActionContext } from "gadget-server";
import fetch from 'node-fetch';
import { bufferToStream, createVideoInBunnyCDN, uploadVideoInBunnyCDN } from "../../../helpers/bunnyFunctions.js"

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
  
  const productResponse = await api.shopifyProduct.update(record.productId, {
      videoSet: true,
  })
  
  logger.info(productResponse, "Product videoSet to true")
  
  async function fetchVideo(url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        return await response.buffer(); 
  }

    const url = record.video.url
    const videoBuffer = await fetchVideo(url)
    const videoStream = bufferToStream(videoBuffer);
    const videoGuid = await createVideoInBunnyCDN(record.video.fileName);
    const updateResponse = await api.productVideos.update(record.id, {
      bunnyGUID: videoGuid,
      status: "uploading"
    })
    
  const uploadResponse = await uploadVideoInBunnyCDN(videoStream, videoGuid);
  
  const updateProductVideoResponse = await api.productVideos.update(record.id, {
    video: null,
  })
  
};


/** @type { ActionOptions } */
export const options = {
  actionType: "create"
};
