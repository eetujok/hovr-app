import { api } from "../api";
import {
  IndexTable,
  Box,
  useIndexResourceState,
  Text,
  Badge,
  SkeletonTabs,
  Card
} from '@shopify/polaris';
import { DeleteIcon } from '@shopify/polaris-icons';
import { useFindMany, useAction } from '@gadgetinc/react'
import { useState, useCallback, useEffect } from 'react'
import DashboardEmptyState from "./DashboardEmptyState.jsx"

const VideoIndexTable = ({ navigate, shouldRefetch }) => {

  const NUM_ON_PAGE = 10; // the number of records per page
  const [cursor, setCursor] = useState({ first: NUM_ON_PAGE });
  
  const [{ data: videos, fetching: fetchingVideos, error: errorFetchingVideos }, _refetch] = useFindMany(api.productVideos, {
    select: {
      id: true,
      status: true,
      createdAt: true,
      product: {
        title: true,
        images: {
          edges: {
            node: {
              position: true,
              source: true,
            },
          },
        },
      },
    },
    live: true,
    ...cursor
  });

  const [{ data: deleteData, fetching: fetchingDeleteData, error: errorDeleteData }, act] = useAction(api.productVideos.delete);
  
  useEffect(() => {
    _refetch()
  }, [deleteData])

  useEffect(() => {
    if (shouldRefetch) {
      console.log("Refetching")
      _refetch();
    }
  }, [shouldRefetch]);

  const getNextPage = useCallback(() => {
    // use first + after to page forwards
    setCursor({ first: NUM_ON_PAGE, after: videos.endCursor });
  }, [videos]);

  const getPreviousPage = useCallback(() => {
    // use last + before to page backwards
    setCursor({ last: NUM_ON_PAGE, before: videos.startCursor });
  }, [videos]);

  const resourceName = {
    singular: 'video',
    plural: 'videos',
  };

  const videoStatusBadge = {

    "active": <Badge size="large" tone="success-strong">Active</Badge>,
    "uploading": <Badge size="large" tone="info">Uploading</Badge>,
    "uploadFailed": <Badge size="large" tone="critical-strong">Uploading</Badge>,
    "encoding": <Badge size="large" tone="success">Encoding</Badge>

  }

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(videos);

  const rowMarkup = videos?.map((video, index) => (
    <IndexTable.Row
      id={video.id}
      key={video.id}
      selected={selectedResources.includes(video.id)}
      position={index}
    >
      <IndexTable.Cell>
        <img
          src={video?.product?.images?.edges[0]?.node.source}
          alt={`Video thumbnail for ${video?.product?.title}`}
          style={{ width: 50, height: 50 }}
        />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {video?.product?.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        { videoStatusBadge[video.status] || <Badge status="default">Unknown</Badge>}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {video.createdAt.toISOString().split('T')[0]}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const promotedBulkActions = [
    {
      icon: DeleteIcon,
      destructive: true,
      content: 'Delete videos',
      onAction: async () => {
        const videosToDelete = selectedResources;
        console.log('Deleting videos:', videosToDelete);
        for (const id of videosToDelete) {
          await act({ id: id })
        }
        selectedResources.length = 0
      },
    },
  ];


  if (errorFetchingVideos) {
    return (
      <Text variant="bodyMd" color="critical">
        Error fetching videos: {errorFetchingVideos.toString()}
      </Text>
    );
  }

  // Jos fetchaa videoita, returnaa skeleton tabsit jos ei löydä mitään niin näytä emptyState. 

  return (
    <Box>
      {fetchingVideos || fetchingDeleteData ? (
        <Card>
          <SkeletonTabs fitted count={4} />
        </Card>
      ) : (videos && videos.length ? (<IndexTable
        loading={fetchingDeleteData || fetchingVideos}
        condensed={false}
        resourceName={resourceName}
        itemCount={videos?.length || 0}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: '' },
          { title: 'Product with video' },
          { title: 'Status' },
          { title: 'Uploaded at' },

        ]}
        promotedBulkActions={promotedBulkActions}
        pagination={{
          hasNext: videos?.hasNextPage,
          hasPrevious: videos?.hasPreviousPage,
          onNext: getNextPage,
          onPrevious: getPreviousPage
        }}
      >
        {rowMarkup}
        </IndexTable>) : (<DashboardEmptyState navigate={navigate} /> )
      )}
    </Box>
  ) 
  
};

export default VideoIndexTable;