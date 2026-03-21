import { useCallback } from "react";
import { DropZone, Text } from "@shopify/polaris";

const SliderVideoDropZone = ({ onFilesUploaded, existingFiles = [] }) => {
  const handleDropZoneDrop = useCallback(
    (droppedFiles, acceptedFiles, rejectedFiles) => {
      // Filter for MP4 files and check size limit
      const validFiles = acceptedFiles.filter(file => {
        const isValidType = file.type === 'video/mp4';
        const isValidSize = file.size <= 500 * 1024 * 1024; // 500MB limit
        
        if (!isValidType) {
          console.warn(`File ${file.name} is not an MP4 file`);
        }
        if (!isValidSize) {
          console.warn(`File ${file.name} exceeds 500MB limit`);
        }
        
        return isValidType && isValidSize;
      });

      if (validFiles.length > 0) {
        // Immediately upload files to parent component
        onFilesUploaded(validFiles);
      }
    },
    [onFilesUploaded]
  );

  return (
    <div>
      <DropZone
        accept="video/mp4"
        type="video"
        onDrop={handleDropZoneDrop}
        allowMultiple
      >
        <DropZone.FileUpload actionHint="Accepts .mp4 files up to 500MB" />
      </DropZone>
    </div>
  );
};

export default SliderVideoDropZone;
