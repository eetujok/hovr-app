import { useFindMany } from "@gadgetinc/react";
import {
  Page,
  Card,
  Text,
  Button,
  Grid,
  InlineStack,
  EmptyState,
  Icon,
  Thumbnail
} from "@shopify/polaris";
import { PlusIcon, InfoIcon } from "@shopify/polaris-icons";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import VideoFeedsIllustration from "../assets/Feed Illustration.png";
import { useAction } from "@gadgetinc/react";

export default function VideoFeedsPage() {
const [{ data: createVideoFeedData, fetching: createVideoFeedFetching, error: createVideoFeedError }, createVideoFeed] = useAction(api.videoFeed.create);

  const navigate = useNavigate();

  const [{ data: videoFeeds, fetching, error }] = useFindMany(api.videoFeed, {
    select: {
      id: true,
      name: true,
      videoCount: true,
      productCount: true,
    },
    live: true,
  });

  const handleCreateVideoFeed = () => {
    navigate("/create-video-feed");
  };

  const handleCustomizeFeed = (feedId) => {
    // Navigate to customize feed page (to be implemented later)
    console.log("Customize feed:", feedId);
  };

  const handleInstructions = () => {
    // Open instructions modal or navigate to instructions page (to be implemented later)
    console.log("Show instructions");
  };

  if (fetching) {
    return (
      <Page>
        <Card sectioned>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text variant="bodyLg">Loading video feeds...</Text>
          </div>
        </Card>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Video Feeds">
        <Card sectioned>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text variant="bodyLg" tone="critical">
              Error loading video feeds: {error.message}
            </Text>
          </div>
        </Card>
      </Page>
    );
  }

  // Empty state when no video feeds exist
  if (!videoFeeds || videoFeeds.length === 0) {
    return (
      <Page>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <Text variant="headingLg" as="h1">Video Feeds</Text>
          <Button
            primary
            icon={<Icon source={PlusIcon} />}
            onClick={handleCreateVideoFeed}
          >
            Create Video Feed
          </Button>
        </div>
        
        <Card sectioned>
          <EmptyState
            heading="Setup a video feed."
            action={{
              content: "Create Video Feed",
              icon: <Icon source={PlusIcon} />,
              onAction: handleCreateVideoFeed,
            }}
            image={VideoFeedsIllustration}
          >
            <p>
              Create a video feed that you can display as a shoppable video slider or carousel section anywhere on your store. 
              Tag products to videos to display product links and dynamically display videos on the correct product pages.
            </p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Video Feeds">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <Text variant="headingLg" as="h1">Video Feeds</Text>
        <InlineStack gap="200">
          <Button
            onClick={handleInstructions}
            icon={<Icon source={InfoIcon} />}
          >
            Instructions
          </Button>
          <Button
            primary
            icon={<Icon source={PlusIcon} />}
            onClick={handleCreateVideoFeed}
          >
            Create Video Feed
          </Button>
        </InlineStack>
      </div>

      <Grid>
        {videoFeeds.map((feed) => (
          <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 3 }} key={feed.id}>
            <Card sectioned>
              <div style={{ marginBottom: "16px" }}>
                <InlineStack gap="200" align="start">
                  {/* Placeholder thumbnails since thumbnails field doesn't exist in schema */}
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Thumbnail
                      key={index}
                      source="https://cdn.shopify.com/s/files/1/0757/9955/files/placeholder-images-product-1_large.png"
                      alt={`Placeholder ${index + 1}`}
                      size="small"
                    />
                  ))}
                </InlineStack>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <Text variant="headingMd" as="h3" fontWeight="bold">
                  {feed.name || "Untitled Feed"}
                </Text>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <Text variant="bodyMd" as="p" tone="subdued">
                  {feed.videoCount || "0"} videos
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  {feed.productCount || "0"} products tagged
                </Text>
              </div>

              <Button
                fullWidth
                onClick={() => handleCustomizeFeed(feed.id)}
              >
                Customize Feed
              </Button>
            </Card>
          </Grid.Cell>
        ))}
      </Grid>
    </Page>
  );
}
