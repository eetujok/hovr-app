import {
  Layout,
  Page,
  Spinner,
  Text,
  Divider
} from "@shopify/polaris";
import ProductResourceList from "../components/ProductResourceList.jsx"
import VideoSyncCard from "../components/SyncCard.jsx";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
// Import the illustrations to preload them
import AutoplayIllustration from "../assets/AutoplayIllustration.png";
import HoverIllustration from "../assets/HoverIllustration.png";

export default function () {
  const navigate = useNavigate();

  // Preload the illustrations when this component mounts
  useEffect(() => {
    // Create new Image objects to preload the images
    const autoplayImg = new Image();
    const hoverImg = new Image();
    
    // Set the src to trigger the browser to load the images
    autoplayImg.src = AutoplayIllustration;
    hoverImg.src = HoverIllustration;
  }, []);

  return (
    <Page
      title="Add video"
      subtitle="Modify video sync or select the product you want to add a autoplay or hover video for."
      backAction={{ content: 'Dashboard', onAction: () => navigate("/") }}
    >
      <Layout>
        <Layout.Section>
          <div style={{
            width: '60vw',
            maxWidth: '800px',
            margin: '0 auto 20px auto',
            gap: "1.5em", 
            display: 'flex',
            flexDirection: "column",
            alignItems: 'flex-start'
          }}>
            <VideoSyncCard />
            <div style={{ display: "flex", flexDirection: "column", width: "50vw", maxWidth: '50vw', gap: "1em" }}>
              <Divider borderWidth="100" />
              <Text variant="headingMd">Manual Upload</Text>
            </div>
            <ProductResourceList />
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}