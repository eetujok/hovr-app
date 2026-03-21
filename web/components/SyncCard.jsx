import {
  Box,
  Text,
  Button,
  Badge,
  SkeletonBodyText,

} from '@shopify/polaris';
import { api } from "../api";
import { useGlobalAction, useFindFirst } from '@gadgetinc/react';
import { useEffect, useState } from 'react';

const VideoSyncCard = () => {

  const [{ data: shop, fetching: fetchingShop, error: errorFetchingShop }, refetchShop] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      videoSyncEnabled: true
    }
  });

  const syncEnabled = shop?.videoSyncEnabled;
  const shopId = shop?.id;
  // Set up action hooks
  const [{ data: syncData, fetching: syncFetching, error: syncError }, syncProductVideos] = useGlobalAction(api.syncProductVideos);
  const [{ data: disableSyncData, fetching: disableSyncFetching, error: disableSyncError }, disableSyncProductVideos] = useGlobalAction(api.disableSyncProductVideos);

  // Button click handlers
  const handleEnableSync = async () => {
    if (shopId) {
      try {
        console.log("Enable sync");
        await syncProductVideos({ shopId: shopId });
        refetchShop();
      } catch (error) {
        console.error('Error enabling video sync:', error);
      }
    }
  };

  const handleDisableSync = async () => {
    if (shopId) {
      try {
        console.log("Disable sync");
        await disableSyncProductVideos({ shopId: shopId });
        refetchShop();
      } catch (error) {
        console.error('Error disabling video sync:', error);
      }
    }
  };

  const isLoading = syncFetching || disableSyncFetching;

  // Toast notifications
  useEffect(() => {
    if (syncData && !syncFetching) {
      shopify.toast.show(`Video sync enabled successfully.`, {
        duration: 5000
      });
    }
  }, [syncData, syncFetching]);

  useEffect(() => {
    if (syncError) {
      shopify.toast.show('Error enabling video sync. Please contact support.', {
        duration: 5000,
        isError: true
      });
    }
  }, [syncError]);

  useEffect(() => {
    if (disableSyncError) {
      shopify.toast.show('Error disabling video sync. Please contact support.', {
        duration: 5000,
        isError: true
      });
    }
  }, [disableSyncError]);

  if (fetchingShop) {
    return (
      <Box background="bg-surface" borderRadius="300" width="50vw" padding='400' borderColor='border-brand'>
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: '1.5em', width: '100%' }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "start", justifyContent: "space-between", marginTop: '2em', marginBottom: '2em', gap: "2em"}}>
            <div style={{ width: '100%' }}>
                <SkeletonBodyText lines={1} />
            </div>
              <div style={{ width: '100%' }}>
                <SkeletonBodyText lines={3} />
              </div>
            </div>
          </div>
        </div>
      </Box>
    );
  }

  return (

    <Box background="bg-surface" borderRadius="300" width="50vw" minWidth="50vw" padding='400' borderColor='border-brand'>
      <div style={{ display: "flex", flexDirection: "column", gap: '1.5em' }}>
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between" }}>
          <Text variant='headingMd'>Video Sync</Text>
          <Badge tone={'info'}>
            Recommended
          </Badge>
        </div>
        <Text variant='bodyMd'>
          {syncEnabled == "LOADING" ?
            "Videos are synced in the background. You can leave the page and come back later if you wish. This will take some time." :
            (syncEnabled == "TRUE"
              ? <>The sync is <strong>successfully enabled</strong> and synced hover videos are currently active. You can disable hover video from specific products using the dashboard.</>
              : <>Use existing video attached to your products and add <strong>hover video</strong> to each one automatically. New video uploaded to your products will be automatically added as a video hover seen in collections.</>
            )
          }
        </Text>
        <div style={{ maxWidth: "350px" }}>
          <Button
            variant={syncEnabled == 'TRUE' ? 'plain' : 'primary'}
            loading={isLoading}
            tone={syncEnabled == 'TRUE' ? 'critical' : 'default'}
            onClick={syncEnabled == 'FALSE' ? handleEnableSync : handleDisableSync}
          >
            {syncEnabled == 'TRUE' ? 'Disable Video Sync' : 'Enable Video Sync'}
          </Button>
        </div>
      </div>
    </Box>

  );
};

export default VideoSyncCard;