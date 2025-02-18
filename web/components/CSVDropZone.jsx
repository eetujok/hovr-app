import { DropZone, BlockStack, Thumbnail, Text, Banner, Icon } from '@shopify/polaris';
import { NoteIcon } from '@shopify/polaris-icons';
import { useState, useCallback } from 'react';

const validFileTypes = ['text/csv', 'application/vnd.ms-excel']; // Updated MIME types

const VideoDropZone = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
  
  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, rejectedFiles) => {
      const uploadedFile = acceptedFiles[0];

      if (acceptedFiles.length > 0 && validFileTypes.includes(uploadedFile.type)) {
        if (uploadedFile.size > MAX_FILE_SIZE) {
          setFile(null);
          setError('File size must be under 100MB.');
          onFileUpload(null);
        } else {
          setFile(uploadedFile);
          setError('');
          onFileUpload(uploadedFile); 
        }
      } else {
        setFile(null);
        setError('Please upload a valid CSV file.');
        onFileUpload(null);
      }
    },
    [onFileUpload],
  );

  const fileUpload = !file && <DropZone.FileUpload actionHint="Accepts .csv for batch upload" />;

  const uploadedFile = file && (
    <BlockStack>
      <Thumbnail
        size="small"
        alt={file.name}
        source={window.URL.createObjectURL(file)}
      />
      <div>
        {file.name}{' '}
        <Text variant="bodySm" as="p">
          {file.size} bytes
        </Text>
      </div>
    </BlockStack>
  );

  return (
    <DropZone allowMultiple={false} onDrop={handleDropZoneDrop}>
      {error && (
        <Banner status="critical">
          <p>{error}</p>
        </Banner>
      )}
      {uploadedFile}
      {fileUpload}
    </DropZone>
  );
}

export default VideoDropZone;
