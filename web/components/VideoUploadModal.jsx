import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SliderVideoDropZone from "./SliderVideoDropZone";

const VideoUploadModal = ({ isOpen, onClose, onFilesUploaded }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && !modalRef.current) {
      // Create modal element
      const modalElement = document.createElement('ui-modal');
      modalElement.id = 'video-upload-modal';
      modalElement.variant = 'large';
      
      // Add title bar
      const titleBar = document.createElement('ui-title-bar');
      titleBar.title = 'Upload Videos';
      titleBar.innerHTML = `
        <button onclick="document.getElementById('video-upload-modal').hide()">Cancel</button>
      `;
      
      // Add modal content container
      const modalContent = document.createElement('div');
      modalContent.id = 'modal-content-container';
      modalContent.style.padding = '24px';
      
      modalElement.appendChild(titleBar);
      modalElement.appendChild(modalContent);
      document.body.appendChild(modalElement);
      
      modalRef.current = modalElement;
      
      // Show modal
      modalElement.show();
      
      // Listen for hide event
      const handleHide = () => {
        onClose();
      };
      
      modalElement.addEventListener('hide', handleHide);
      
      return () => {
        modalElement.removeEventListener('hide', handleHide);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Show modal if it exists
      modalRef.current.show();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (modalRef.current) {
        try {
          document.body.removeChild(modalRef.current);
        } catch (e) {
          // Modal might already be removed
        }
      }
    };
  }, []);

  if (!isOpen) return null;

  // Render the SliderVideoDropZone in the modal using createPortal
  const modalContent = document.getElementById('modal-content-container');
  
  if (modalContent) {
    return createPortal(
      <div>
        <SliderVideoDropZone
          onFilesUploaded={onFilesUploaded}
          existingFiles={[]}
        />
      </div>,
      modalContent
    );
  }

  return null;
};

export default VideoUploadModal;
