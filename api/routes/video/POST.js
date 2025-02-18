import { RouteContext } from "gadget-server";
import { Readable } from 'stream';
import fetch from 'node-fetch';
//import { createVideoInBunnyCDN, uploadVideoInBunnyCDN } from "../helpers/bunnyFunctions'"
/**
 * Route handler for POST video
 *
 * @param { RouteContext } route context - see: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 *
 */


export default async function route({ request, reply, api, logger }) {


  async function createVideoInBunnyCDN(title) {
    
    const apiUrl = 'https://video.bunnycdn.com/library/272712/videos';
    const apiKey = process.env.BUNNY_API_KEY; 

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessKey': apiKey, 
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create video: ${response.statusText}`);
    }

    const data = await response.json();
    return data.guid;
  }

  async function uploadVideoInBunnyCDN(fileStream, videoGuid) {

    const apiUrl = `https://video.bunnycdn.com/library/272712/videos/${videoGuid}`;
    const apiKey = process.env.BUNNY_API_KEY;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: fileStream, // Pass the file stream directly
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to upload video: ${response.statusText}. Details: ${errorMessage}`);
    }

    return await response.json();
  }

  try {

    const { productId, title } = request.body

    logger.info({ productId, title }, "Params from upload");

    const data = await request.file();
    const videoGuid = await createVideoInBunnyCDN(title);


    const fileStream = data.file;
    const filename = data.filename;

    const uploadResult = await uploadVideoInBunnyCDN(fileStream, videoGuid);

    const updateResponse = await api.productVideos.update(productId, {
      bunnyGUID: videoGuid,
      status: "active"
    })

    logger.info(updateResponse, "Video uploaded to Bunny")
    reply.code(200).send({ status: "ok", videoGuid, uploadResult });


  } catch (error) {
    logger.error('Error in video route handler:', error);
    reply.code(400).send({ status: "error", message: error.message });
  }


}
