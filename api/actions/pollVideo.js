import { ActionRun } from "gadget-server";
import { parseImageSrc, getProductFeaturedImage } from "../helpers/shopifyAppMetafieldFunctions.js";
import fetch from 'node-fetch';
import FormData from 'form-data';

export const params = {
  productId: {
    type: "string"
  },
  recordId: {
    type: "string"
  },
  videoUrl: {
    type: "string"
  },
  shopId: {
    type: "string"
  },
  videoType: {
    type: "string"
  },
  videoOptions: {
    type: "string"
  }
}

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const { productId, recordId, videoUrl: originalVideoUrl, shopId, videoType, videoOptions } = params;
  
  try {
    // Get the shop connection
    const shopify = await connections.shopify.forShopId(shopId);
    
    // Get product details for handle and other info
    const product = await api.shopifyProduct.findOne(productId, {
      select: {
        id: true,
        shopId: true,
        handle: true
      }
    });

    // First, download the video from the temporary URL
    logger.info(originalVideoUrl, "Original video URL");
    
    async function fetchVideo(url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }
      return await response.buffer(); 
    }

    const videoBuffer = await fetchVideo(originalVideoUrl);
    const fileSize = videoBuffer.length.toString(); // Get the file size in bytes
    logger.info(`Video downloaded, size: ${fileSize} bytes`);

    // Generate unique filename with mp4 extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomString}.mp4`;

    // Create staged upload
    const stagedUploadsResponse = await shopify.graphql(`
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            resourceUrl
            url
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      input: [{
        filename: fileName,
        mimeType: "video/mp4",
        resource: "VIDEO",
        fileSize: fileSize,
        httpMethod: "POST"
      }]
    });

    logger.info(stagedUploadsResponse, "Staged upload created");

    if (stagedUploadsResponse.stagedUploadsCreate.userErrors.length > 0) {
      throw new Error(`Failed to create staged upload: ${stagedUploadsResponse.stagedUploadsCreate.userErrors[0].message}`);
    }

    const stagedTarget = stagedUploadsResponse.stagedUploadsCreate.stagedTargets[0];
    
    logger.info({
      stagedTarget: stagedTarget
    }, "Staged upload target details");
    
    const uploadUrl = stagedTarget.url;
    const parameters = stagedTarget.parameters;
    const resourceUrl = stagedTarget.resourceUrl;
    
    logger.info(uploadUrl, "Upload URL");
    logger.info(resourceUrl, "Resource URL");
    
    // Create form data for upload - following Shopify's example
    const formData = new FormData();
    
    // Add all parameters from the staged upload response as form fields
    parameters.forEach(param => {
      formData.append(param.name, param.value);
    });
    
    // Add the file last, with the correct field name
    // In Node.js FormData, we can append the buffer directly with a filename
    formData.append('file', videoBuffer, {
      filename: fileName,
      contentType: 'video/mp4'
    });

    // Upload to Shopify CDN (Google Cloud Storage)
    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      const responseStatus = uploadResponse.status;
      const responseStatusText = uploadResponse.statusText;
      logger.info(`Upload response status: ${responseStatus} ${responseStatusText}`);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        logger.error({
          status: responseStatus,
          statusText: responseStatusText,
          errorText: errorText
        }, "Upload failed with details");
        throw new Error(`Failed to upload video: ${responseStatusText}. Details: ${errorText}`);
      }

      logger.info("Video uploaded to Shopify CDN successfully");
    } catch (error) {
      logger.error(error, "Error uploading video");
      throw error;
    }
    
    // Create the file in Shopify using fileCreate mutation with the resource URL
    const fileCreateResponse = await shopify.graphql(`
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            alt
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      files: [{
        alt: `(Hover Video, don't delete) for product ${product.id}`,
        contentType: "VIDEO",
        originalSource: resourceUrl
      }]
    });

    logger.info(fileCreateResponse, "File created in Shopify");

    if (fileCreateResponse.fileCreate.userErrors && fileCreateResponse.fileCreate.userErrors.length > 0) {
      throw new Error(`Failed to create file: ${fileCreateResponse.fileCreate.userErrors[0].message}`);
    }

    if (!fileCreateResponse.fileCreate.files || fileCreateResponse.fileCreate.files.length === 0) {
      throw new Error("No files were created");
    }

    // Get the file ID from the response
    const fileId = fileCreateResponse.fileCreate.files[0].id;
    
    // Extract the video URL from the response
    let finalVideoUrl = resourceUrl; // Default to resource URL if we can't find a better one
    
    // Function to poll for video URL with timeout
    async function pollForVideoUrl(fileId, maxAttempts = 40, interval = 5000) {
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        logger.info(`Polling for video URL, attempt ${attempts + 1}/${maxAttempts}`);
        
        const fileDetailsResponse = await shopify.graphql(`
          query {
            node(id: "${fileId}") {
              id
              ... on Video {
                sources {
                  url
                  format
                  mimeType
                }
              }
            }
          }
        `);
        
        logger.info(fileDetailsResponse, "File details fetched");
        
        if (fileDetailsResponse.node && 
            fileDetailsResponse.node.sources && 
            fileDetailsResponse.node.sources.length > 0) {
          
          // Prefer MP4 source if available
          const mp4Source = fileDetailsResponse.node.sources.find(source => 
            source.mimeType === 'video/mp4' || source.format === 'mp4'
          );
          
          if (mp4Source && mp4Source.url) {
            logger.info(mp4Source.url, "MP4 source found for Video URL");
            return mp4Source.url;
          } else if (fileDetailsResponse.node.sources[0].url) {
            // Otherwise use the first available source
            logger.info(fileDetailsResponse.node.sources[0].url, "Using first available source for Video URL");
            return fileDetailsResponse.node.sources[0].url;
          }
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      }
      
      // If we've exhausted all attempts, return the resource URL
      logger.warn("Video processing timeout reached, using resource URL as fallback");
      return resourceUrl;
    }
    
    // Poll for the video URL
    finalVideoUrl = await pollForVideoUrl(fileId);

    // Update the product video record with the new URL
    const updateResponse = await api.productVideos.update(recordId, {
      fileId: fileId,
      status: "active",
      video: null
    });

    logger.info(updateResponse, "Video record updated with Shopify CDN URL");

    // Get the featured image for the product
    const featuredImageResponse = await getProductFeaturedImage(
      connections, 
      shopId, 
      productId
    );

    logger.info(featuredImageResponse, "Featured image fetched");

    // Prepare metafield value with new video URL
    const appMetafieldValue = {
      "id": productId,
      "streamLink": finalVideoUrl,
      "srcImage": parseImageSrc(featuredImageResponse.product.featuredImage.url),
      "handle": product.handle,
      "videoType": videoType ? videoType : null,
      "options": videoOptions ? videoOptions : null
    };

    logger.info(appMetafieldValue, "App metafield value");

    // Queue the metafield update
    await api.enqueue(
      api.postToShopifyAppMetafield,
      {
        appMetafieldValue,
        operation: "add",
        shopId: shopId
      },
      {
        queue: "videoUploadQue",
        maxConcurrency: 1
      }
    );
    
    return { success: true, videoUrl: finalVideoUrl };
  } catch (error) {
    logger.error(error, "Error in pollVideo action");
    throw error;
  }
};
