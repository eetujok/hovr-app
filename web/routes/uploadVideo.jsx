import {
  InlineStack,
  Page,
  Thumbnail,
  Card,
  BlockStack,
  Button,
  Text,
  Divider,
  Spinner
} from '@shopify/polaris';
import { PlusIcon } from "@shopify/polaris-icons";
import VideoDropZone from "../components/VideoDropZone.jsx";
import FallbackImage from "../assets/NoImagePhoto.png"

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAction } from "@gadgetinc/react";
import { api } from "../api";

const UploadVideo = () => {
  
  const [{ data, fetching, error }, act] = useAction(api.productVideos.create);
  const navigate = useNavigate();
  const location = useLocation();
  const { id, title, imageUrl } = location.state || {};
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add this state

  useEffect(() => {
    if (!location.state || !id) {
      navigate("/", { replace: true });
      return;
    }
  }, [location.state, id, navigate]);
  
  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    setErrorMessage(""); // Clear any previous errors
  };
  
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (!file) {
      setErrorMessage("No file selected.");
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
        product: { _link: id }, 
        status: "uploading", 
        video: { directUploadToken: token, fileName: file?.name } 
      });

      navigate("/", { 
        replace: true, 
        state: { shouldRefetch: true } 
      });

    } catch (error) {
      setErrorMessage("Error during upload: " + error.message);
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  if (!location.state || !id) {
    return null;
  }

  return (
    <Page
      title="Upload video"
      subtitle="Attach your video into the dropbox below"
      backAction={{ 
        content: 'Add video', 
        onAction: () => navigate("/add-video", { replace: true }) // Added replace: true
      }}
      primaryAction={
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={!file || uploading || isSubmitting} 
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '60vh', gap: '1em' }}>
              <Thumbnail source={imageUrl || FallbackImage} size="large" />
              <Text variant="bodyLg" fontWeight="bold" as="p">{title}</Text>
            </div>
            <Divider />
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
          </BlockStack>
        </Card>
      </div>
    </Page>
  );
};

export default UploadVideo;
