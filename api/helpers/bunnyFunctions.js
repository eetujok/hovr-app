import { Readable } from 'stream';
import fetch from 'node-fetch';


async function createVideoInBunnyCDN(title) {
      
    const apiUrl = 'https://video.bunnycdn.com/library/270532/videos';
    const apiKey = process.env.BUNNY_API_KEY;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        AccessKey: apiKey,
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create video: ${response.statusText}`);
    }

    const data = await response.json();
    return data.guid;
  }
  
  async function uploadVideoInBunnyCDN(videoStream, videoGuid) {
    const apiUrl = `https://video.bunnycdn.com/library/270532/videos/${videoGuid}`;
    const apiKey = process.env.BUNNY_API_KEY;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': apiKey,
        accept: 'application/json',
      },
      body: videoStream,
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to upload video: ${response.statusText}. Details: ${errorMessage}`);
    }

    return await response.json();
}

  async function deleteVideoInBunnyCDN(videoGuid) {
    const apiUrl = `https://video.bunnycdn.com/library/270532/videos/${videoGuid}`
    const apiKey = process.env.BUNNY_API_KEY;

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'AccessKey': apiKey,
        accept: 'application/json',
      }
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to upload video: ${response.statusText}. Details: ${errorMessage}`);
    }

    return await response.json();

  }

  function bufferToStream(buffer) {
        const stream = new Readable();
        stream._read = () => {}; 
        stream.push(buffer);
        stream.push(null);
        return stream;
  }

 export {  bufferToStream, createVideoInBunnyCDN, uploadVideoInBunnyCDN, deleteVideoInBunnyCDN} 