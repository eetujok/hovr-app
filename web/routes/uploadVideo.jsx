import {
  InlineStack,
  Page,
  Thumbnail,
  Card,
  BlockStack,
  Button,
  Text,
  Divider,
  Spinner,
  Checkbox
} from '@shopify/polaris';
import { PlusIcon } from "@shopify/polaris-icons";
import VideoDropZone from "../components/VideoDropZone.jsx";
import FallbackImage from "../assets/NoImagePhoto.png"

import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAction } from "@gadgetinc/react";
import { api } from "../api";

const UploadVideo = () => {
  
  const [{ data, fetching, error }, act] = useAction(api.productVideos.create);
  const navigate = useNavigate();
  const location = useLocation();
  const { id, title, imageUrl, type } = location.state || {};
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
  

  const [autoplayOnCollectionPage, setAutoplayOnCollectionPage] = useState(true);
  const [autoplayOnProductPage, setAutoplayOnProductPage] = useState(false);
  const [optionsError, setOptionsError] = useState(''); // Add this state for options error

  const handleAutoplayOnCollectionPageChange = useCallback((newChecked) => {
    setAutoplayOnCollectionPage(newChecked);
    // Clear error if at least one option is selected
    if (newChecked || autoplayOnProductPage) {
      setOptionsError('');
    } else {
      setOptionsError('Please select at least one autoplay option.');
    }
  }, [autoplayOnProductPage])

  const handleAutoplayOnProductPageChange = useCallback((newChecked) => {
    setAutoplayOnProductPage(newChecked);
    // Clear error if at least one option is selected
    if (newChecked || autoplayOnCollectionPage) {
      setOptionsError('');
    } else {
      setOptionsError('Please select at least one autoplay option.');
    }
  }, [autoplayOnCollectionPage])

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

      /* Old Options logic: 
              options: type === "autoplay" 
          ? (autoplayOnCollectionPage && autoplayOnProductPage 
              ? "BOTH" 
              : autoplayOnCollectionPage 
                ? "COLLECTION" 
                : "PRODUCT")
          : null,
      */
      await act({ 
        product: { _link: id }, 
        status: "uploading", 
        video: { directUploadToken: token, fileName: file?.name },
        options: "COLLECTION",
        type: type === "autoplay" ? "AUTOPLAY" : "HOVER",
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
      title={`Upload ${type === "autoplay" ? "autoplay" : "hover"} video`}
      subtitle="Attach your video into the dropbox below"
      backAction={{ 
        content: 'Add video', 
        onAction: () => navigate("/choose-video", { state: { id, title, imageUrl }, replace: true }) // Added replace: true
      }}
      primaryAction={
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={!file || uploading || isSubmitting || (type === "autoplay" && !autoplayOnCollectionPage && !autoplayOnProductPage)} 
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
              <>
              {/* 
              {type == 'autoplay' ? (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1em' }}>
                <Text variant="bodyMd" fontWeight="bold" as="p">Options</Text>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1em' }}>
                  <Checkbox onChange={handleAutoplayOnCollectionPageChange} checked={autoplayOnCollectionPage} label="Autoplay on collection page" helpText="Autoplay uploaded video on collection page and featured collections."/>
                  <Checkbox onChange={handleAutoplayOnProductPageChange} checked={autoplayOnProductPage} label="Autoplay on product page" helpText="Replace product page featured image to autoplay video."/>
                </div>
              </div>) : null}
              */}
              <VideoDropZone 
                onFileUpload={handleFileUpload} 
                disabled={type === "autoplay" && !autoplayOnCollectionPage && !autoplayOnProductPage}
                optionsError={type === "autoplay" && !autoplayOnCollectionPage && !autoplayOnProductPage ? 'Please select at least one autoplay option.' : ''}
              />
              </>
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
