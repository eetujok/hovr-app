// Sets up the API client for interacting with your backend. 
// For your API reference, visit: https://docs.gadget.dev/api/preview-product
import { Client } from "@gadget-client/preview-product";

export const api = new Client({ environment: window.gadgetConfig.environment });
