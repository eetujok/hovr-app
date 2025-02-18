import {
  InlineStack,
  Page,
  Thumbnail,
  Card,
  BlockStack,
  Button,
  Text,
  Divider,
  TextField,
  Spinner
} from '@shopify/polaris';
import { PlusIcon } from "@shopify/polaris-icons";
import VideoDropZone from "../components/VideoDropZone.jsx";
import CSVDropZone from "../components/CSVDropZone.jsx";
import FallbackImage from "../assets/NoImagePhoto.png"
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAction, useFindFirst } from "@gadgetinc/react";
import { api } from "../api";

const AdminUploadVideo = () => {
  
  const [{ data, fetching, error }, act] = useAction(api.productVideos.create);
  const [{ data: csvUploadData, fetching: csvUploadFetching, error: csvUploadError }, actTwo] = useAction(api.shopifyShop.uploadCsv);

  const navigate = useNavigate();
  const location = useLocation();
  const [id, setId] = useState("");
  const [productId, setProductId] = useState("");
  const [shopId, setShopId] = useState(""); // State for shop ID
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null); // State for CSV file
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [{ data: shop, fetching: fetchingShop, error: errorFetchingShop }] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      extensionInstalled: true,
      domain: true,
    }
  });
  
  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    setErrorMessage(""); // Clear any previous errors
  };

  const handleCsvUpload = (uploadedCsv) => {
    setCsvFile(uploadedCsv);
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!file) {
      setErrorMessage("No file selected.");
      return;
    }

    if (!productId) {
      setErrorMessage("Please enter a product ID.");
      return;
    }

    setIsSubmitting(true);
    setUploading(true);
    setErrorMessage(""); // Clear any previous errors

    try {
      const { url, token } = await api.getDirectUploadToken();

      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "text/plain",
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      await act({
        product: { _link: productId },
        status: "uploading",
        video: { directUploadToken: token, fileName: file?.name }
      });

      setIsSubmitting(false);
      setUploading(false);
      
    } catch (error) {
      setErrorMessage("Error during upload: " + error.message);
      setIsSubmitting(false);
      setUploading(false);
    }
  };

const handleCsvSubmit = async () => {
    if (!csvFile || !shopId) {
      setErrorMessage("Please provide both a CSV file and shop ID.");
      return;
    }

    try {
      const { url, token } = await api.getDirectUploadToken();

      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "text/plain",
        },
        body: csvFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("CSV Upload failed");
      }

      await actTwo({
        id: shopId,
        batchCsv: { directUploadToken: token, fileName: csvFile?.name }
      });

      setErrorMessage("");
      setCsvFile(null);
      setShopId("");
      
    } catch (error) {
      setErrorMessage("Error during CSV upload: " + error.message);
    }
  };
  
  if (fetchingShop) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <Spinner accessibilityLabel="Spinner example" size="large" />
      </div>
    );
  }
  
   // IF admin store id, show this page
  if (shop.id === "85532344635") {
  
    return (
      <Page
        title="Upload video"
        subtitle="Attach your video into the dropbox below"
        backAction={{
          content: 'Add video',
          onAction: () => navigate("/add-video", { replace: true })
        }}
        primaryAction={
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!file || !productId || uploading || isSubmitting}
            tone="success"
            icon={PlusIcon}
          >
            {isSubmitting ? 'Uploading...' : 'Submit video'}
          </Button>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60vh' }}>
          <Card sectioned>
            <BlockStack gap="400">
              <TextField
                label="Product ID"
                value={productId}
                onChange={(value) => setProductId(value)}
                placeholder="Enter product ID"
              />
              {uploading ? (
                <InlineStack align="center" blockAlign="center" gap="400">
                  <Spinner accessibilityLabel="Spinner example" size="large" />
                  <Text variant="bodyLg" fontWeight="bold" as="p">
                    Your video is uploading, please wait.
                  </Text>
                </InlineStack>
              ) : (
                <VideoDropZone onFileUpload={handleFileUpload} />
              )}
              {errorMessage && (
                <Text variant="bodyMd" tone="critical">
                  {errorMessage}
                </Text>
              )}
              <Divider />
              <TextField
                label="Shop ID"
                value={shopId}
                onChange={(value) => setShopId(value)}
                placeholder="Enter shop ID for CSV upload"
              />
              <CSVDropZone onFileUpload={handleCsvUpload} />
              <Button
                variant="primary"
                onClick={handleCsvSubmit}
                disabled={!csvFile || !shopId}
                tone="success"
              >
                Submit CSV
              </Button>
            </BlockStack>
          </Card>
        </div>
      </Page>
    );
    } else {
    return (
      <div>
        <Text>Nothing to see here!</Text>
      </div>
      
    )
    }
};

export default AdminUploadVideo;