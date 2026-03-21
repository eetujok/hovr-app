import {
  IndexTable,
  Text,
  Badge,
  Thumbnail,
  Button,
  InlineStack,
  Icon
} from '@shopify/polaris';
import { DeleteIcon, InfoIcon } from '@shopify/polaris-icons';

const VideoFeedTable = ({ videos, onDeleteVideo, onTagProducts }) => {
  const resourceName = {
    singular: 'video',
    plural: 'videos',
  };

  const rowMarkup = videos.map((video, index) => (
    <IndexTable.Row
      id={video.id}
      key={video.id}
      position={index}
    >
      <IndexTable.Cell>
        <InlineStack gap="200" align="center">
          <Thumbnail
            source={video.thumbnail}
            alt={`Thumbnail for ${video.name}`}
            size="small"
          />
          <Text variant="bodyMd" as="span">
            {video.name}
          </Text>
        </InlineStack>
      </IndexTable.Cell>
      
      <IndexTable.Cell>
        {Array.isArray(video.taggedProducts) ? (
          <InlineStack gap="200" align="center">
            <Thumbnail
              source={video.thumbnail}
              alt="Product thumbnail"
              size="small"
            />
            <Text variant="bodyMd" as="span">
              {video.taggedProducts[0]}
            </Text>
          </InlineStack>
        ) : (
          <Button
            variant="tertiary"
            onClick={() => onTagProducts(video.id)}
            size="slim"
          >
            {video.taggedProducts}
          </Button>
        )}
      </IndexTable.Cell>
      
      <IndexTable.Cell>
        <InlineStack gap="200" align="center">
          <Icon
            source={InfoIcon}
            tone={video.statusTone}
          />
          <Text
            variant="bodyMd"
            as="span"
            tone={video.statusTone}
          >
            {video.status}
          </Text>
        </InlineStack>
      </IndexTable.Cell>
      
      <IndexTable.Cell>
        <Button
          icon={<Icon source={DeleteIcon} />}
          onClick={() => onDeleteVideo(video.id)}
          variant="tertiary"
          size="slim"
          tone="critical"
        />
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <IndexTable
      resourceName={resourceName}
      emptyState={<></>}
      itemCount={videos.length}
      headings={[
        { title: 'Video Name' },
        { title: 'Tagged Products' },
        { title: 'Video Status' },
        { title: '' }
      ]}
      selectable={false}
    >
      {rowMarkup}
    </IndexTable>
  );
};

export default VideoFeedTable;
