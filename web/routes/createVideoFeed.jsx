import { useState, useEffect, useRef, useCallback } from "react";
import {
  Page,
  Card,
  Text,
  Button,
  TextField,
  InlineStack,
  BlockStack,
  Divider,
  Icon,
} from "@shopify/polaris";
import { ArrowLeftIcon, FolderIcon, UploadIcon,  } from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";
import VideoFeedTable from "../components/VideoFeedTable";
import SliderVideoDropZone from "../components/SliderVideoDropZone";
import VideoUploadModal from "../components/VideoUploadModal";
import { useAction, useFindMany } from "@gadgetinc/react";

import { api } from "../api";

/* 
  TODO:

  If status uploading and then delete what to do?
  Solution: savebar not shown, alert dialog to prevent leaving page, alert in video summary div.
  Ei taritse handlaa casea jossa upload kesken -> lähtee sivulta, tai klikkaa savebaria ennen kuin upload on valmis.
    
  Failed upload handling
  videoFeed delete action onSuccess -> delete related sliderVideos
  customize/update videofeed from prev page
  If create video feed is clicked, but not saved delete.

  Picker API:
  productTagging
  shopifyFile:

  tarkista että discard toimii shopifyfileilla

  onSuccess() todo:
  videoPolling for shopifyFile

  kun kaikki done, refactoraa eri komponentteihin
  */
export default function CreateVideoFeedPage() {

  

  const navigate = useNavigate();
  const [feedName, setFeedName] = useState("Testimonial Carousel");
  const [originalFeedName, setOriginalFeedName] = useState("Testimonial Carousel"); // Track original name for change detection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [originalVideos, setOriginalVideos] = useState([]); // Track original videos for change detection
  const [uploadedVideoIds, setUploadedVideoIds] = useState([]); // Store successfully uploaded video IDs
  const [videoIdMapping, setVideoIdMapping] = useState(new Map()); // Map local video IDs to uploaded video IDs
  const [failedUploads, setFailedUploads] = useState([]); // Track failed uploads
  const [isResetting, setIsResetting] = useState(false); // Track reset state
  const [deletingVideos, setDeletingVideos] = useState(new Set()); // Track which videos are being deleted
  const [deletionErrors, setDeletionErrors] = useState([]); // Track deletion errors
  const [isAddingFromFiles, setIsAddingFromFiles] = useState(false); // Track if adding from files is in progress

  const [changesMade, setChangesMade] = useState(false); // Track if changes have been made to the videos state, if true show savebar.
  
  const [videoFeedId, setVideoFeedId] = useState(null);
  const [discardRequested, setDiscardRequested] = useState(false);
  const [videosBeforeDiscard, setVideosBeforeDiscard] = useState([]);
  const [pendingVideoDeletions, setPendingVideoDeletions] = useState(new Set());

  // Ref to track if cleanup has already run to prevent multiple deletions
  const cleanupRunRef = useRef(false);
  //Crud for video feed
  const [{ data: createVideoFeedData, fetching: createVideoFeedFetching, error: createVideoFeedError }, createVideoFeed] = useAction(api.videoFeed.create);
  const [{ data: updateVideoFeedData, fetching: updateVideoFeedFetching, error: updateVideoFeedError }, updateVideoFeed] = useAction(api.videoFeed.update);
  const [{ data: deleteVideoFeedData, fetching: deleteVideoFeedFetching, error: deleteVideoFeedError }, deleteVideoFeed] = useAction(api.videoFeed.delete);
  
  //Crud for slider video
  const [{ data: createSliderVideoData, fetching: createSliderVideoFetching, error: createSliderVideoError }, createSliderVideo] = useAction(api.sliderVideo.create);
  const [{ data: createSliderVideoFromFileData, fetching: createSliderVideoFromFileFetching, error: createSliderVideoFromFileError }, createSliderVideoFromFile] = useAction(api.sliderVideo.createFromFile);


  const [{ data: updateSliderVideoData, fetching: updateSliderVideoFetching, error: updateSliderVideoError }, updateSliderVideo] = useAction(api.sliderVideo.update);
  const [{ data: deleteSliderVideoData, fetching: deleteSliderVideoFetching, error: deleteSliderVideoError }, deleteSliderVideo] = useAction(api.sliderVideo.delete);


  const [allVideoRecords, setAllVideoRecords] = useState([])

  const [{ data: videoFiles, fetching: videoFilesFetching, error: videoFilesError }] = useFindMany(api.shopifyFile, {
    first: 250,
    select: {
      id: true,
      originalSource: true,
      preview: true,
      filename: true,
    },
    filter: {
      mediaContentType: {
        equals: "VIDEO"
      }
    }
  })

  useEffect(() => {
    if (videoFiles) {
      setAllVideoRecords(videoFiles)
    }

    const fetchAllPages = async () => {
      if (videoFiles?.hasNextPage) {
        let currentPage = videoFiles
        while (currentPage.hasNextPage) {
          const nextPage = await currentPage.nextPage()
          setAllVideoRecords(prev => [...prev, ...nextPage])
          currentPage = nextPage
        }
      }
    }

    fetchAllPages()

  }, [videoFiles])


  // Function to check if changes have been made
  const checkForChanges = useCallback(() => {
    const nameChanged = feedName !== originalFeedName;
    const videosChanged = JSON.stringify(videos) !== JSON.stringify(originalVideos);
    const hasChanges = nameChanged || videosChanged;
    const hasUploadingVideos = videos.some(v => v.status === "uploading");
    // Show save bar when there are changes OR when videos are uploading
    setChangesMade(hasChanges || hasUploadingVideos);
  }, [feedName, originalFeedName, videos, originalVideos]);

  // Effect to check for changes whenever feedName or videos change
  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  // Update original values when they're first set
  useEffect(() => {
    if (feedName && originalFeedName === "Testimonial Carousel") {
      setOriginalFeedName(feedName);
    }
  }, [feedName, originalFeedName]);

  useEffect(() => {
    if (videos.length > 0 && originalVideos.length === 0) {
      setOriginalVideos([...videos]);
    }
  }, [videos, originalVideos]);

  const handlePublish = async () => {
    const completedVideos = videos.filter(v => v.status === "Complete");
    if (completedVideos.length === 0) {
      console.warn('No completed videos to publish');
      return;
    }
    if (!videoFeedId) {
      console.warn('Video feed not ready');
      return;
    }
    
    // Update the existing videoFeed name on publish instead of creating a new one
    await updateVideoFeed({ id: videoFeedId, name: feedName });
    console.log('Published videoFeed with id:', videoFeedId);
    if (saveBarRef.current) {
      saveBarRef.current.hide();
    }
  };

  // Save bar save action - handles the actual saving of changes
  const handleSave = useCallback(async () => {
    try {

      if (saveButtonRef.current) {
        saveButtonRef.current.setAttribute('loading', 'true')
      }

      if (!videoFeedId) {
        console.warn('Video feed not ready');
        return;
      }

      // Update the video feed with the new name
      await updateVideoFeed({ id: videoFeedId, name: feedName });
      
       // Commit pending video deletions to the database
       const idsToDelete = Array.from(pendingVideoDeletions);
       for (const localId of idsToDelete) {
         const uploadedId = videoIdMapping.get(localId);
         if (uploadedId) {
           try {
             await deleteSliderVideo({ id: uploadedId });
           } catch (error) {
             console.error('Failed to delete sliderVideo during save with ID:', uploadedId, error);
           }
         }
       }
       
       // Update local mappings and uploaded ids after deletion
       setUploadedVideoIds(prev => prev.filter(id => !Array.from(idsToDelete).some(localId => videoIdMapping.get(localId) === id)));
       setVideoIdMapping(prev => {
         const updated = new Map(prev);
         for (const localId of idsToDelete) {
           updated.delete(localId);
         }
         return updated;
       });
      
       // Clear pending deletions
       setPendingVideoDeletions(new Set());
      
      // Update original values to reflect the saved state
      setOriginalFeedName(feedName);
      setOriginalVideos([...videos]);
      setChangesMade(false);


      if (saveBarRef.current) {
        saveBarRef.current.hide();
      }

      
      if (saveButtonRef.current) {
        saveButtonRef.current.setAttribute('loading', 'false')
      }
      
      console.log('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  }, [videoFeedId, feedName, videos, updateVideoFeed]);

  // Save bar discard action - reverts changes
  const handleDiscard = useCallback(() => {
    if (discardButtonRef.current) {
      discardButtonRef.current.setAttribute('loading', 'true')
    }
    // Capture current videos to detect which ones were newly added since last save
    setVideosBeforeDiscard(videos);
    // Revert feed name
    setFeedName(originalFeedName);
    
    // Revert videos to original state
    setVideos([...originalVideos]);
    
    // Reset change tracking
    setChangesMade(false);
    setDiscardRequested(true);
    setPendingVideoDeletions(new Set());
    if (saveBarRef.current) {
      saveBarRef.current.hide();
    }
    if (discardButtonRef.current) {
      discardButtonRef.current.setAttribute('loading', 'false')
    }
    console.log('Changes discarded');
  }, [originalFeedName, originalVideos]);

  const handleDeleteVideoFeed = async () => {
    if (!videoFeedId) {
      console.warn('Video feed not ready');
      return;
    }
    if (saveBarRef.current) {
      saveBarRef.current.hide();
    }
    await deleteVideoFeed({ id: videoFeedId });
    navigate("/video-feeds");
  };

  // Create a blank videoFeed on mount
  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const resp = await createVideoFeed({});
        if (isActive) {
          const id = resp?.id ?? resp?.data?.id;
          setVideoFeedId(id);
          console.log('Created blank videoFeed with id:', id);
        }
      } catch (err) {
        console.error('Failed to create blank videoFeed:', err);
      }
    })();
    return () => {
      isActive = false;
    };
  }, []);

  
  // Cleanup effect to revoke blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Prevent multiple cleanup runs
      if (cleanupRunRef.current) {
        return;
      }
      cleanupRunRef.current = true;
      
      // Clean up blob URLs
      videos.forEach(video => {
        if (video.thumbnail && 
            !video.thumbnail.includes('cdn.shopify.com') &&
            !video.thumbnail.startsWith('data:')) {
          try {
            URL.revokeObjectURL(video.thumbnail);
          } catch (error) {
            console.warn('Could not revoke blob URL during cleanup:', error);
          }
        }
      });
      
      // Delete any remaining sliderVideo records when component unmounts
      const completedVideoIds = videos.filter(v => v.status === "Complete").map(video => videoIdMapping.get(video.id)).filter(Boolean);
      
      if (completedVideoIds.length > 0) {
        console.log('Component unmounting, deleting', completedVideoIds.length, 'sliderVideo records');
        
        // Use a non-blocking approach for cleanup
        completedVideoIds.forEach(async (id) => {
          try {
            await deleteSliderVideo({ id });
            console.log('Deleted sliderVideo with ID:', id);
          } catch (error) {
            console.error('Failed to delete sliderVideo with ID:', id, error);
          }
        });
      }

      // Delete the created videoFeed as well
      if (videoFeedId) {
        (async () => {
          try {
            await deleteVideoFeed({ id: videoFeedId });
            console.log('Deleted videoFeed with ID:', videoFeedId);
          } catch (error) {
            console.error('Failed to delete videoFeed with ID:', videoFeedId, error);
          }
        })();
      }
    };
  }, [videoFeedId]);

  // Debug effect to monitor uploadedVideoIds changes
  useEffect(() => {
    console.log('uploadedVideoIds state updated:', uploadedVideoIds);
  }, [uploadedVideoIds]);

  // Handle page refresh and navigation cleanup
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const completedVideoIds = videos.filter(v => v.status === "Complete").map(video => videoIdMapping.get(video.id)).filter(Boolean);
      const hasUploadingVideos = videos.some(v => v.status === "uploading");
      
      if (completedVideoIds.length > 0 || hasUploadingVideos || videoFeedId) {
        // The actual deletion will happen in the component unmount effect
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videos, videoIdMapping, videoFeedId]);

  const clearFailedUploads = async () => {
    // Delete any completed sliderVideo records before clearing failed uploads
      
      if (uploadedVideoIds.length > 0) {
      console.log('Clearing failed uploads, deleting', uploadedVideoIds.length, 'sliderVideo records');
      
      // Delete all sliderVideo records
      for (const videoId of uploadedVideoIds) {
        try {
          await deleteSliderVideo({ id: videoId });
          console.log('Deleted sliderVideo with ID:', videoId);
        } catch (error) {
          console.error('Failed to delete sliderVideo with ID:', videoId, error);
          setDeletionErrors(prev => [...prev, { videoId, error: error.message }]);
        }
      }
    }
    
    // Clear failed uploads and reset state
    setFailedUploads([]);
    setVideos([]);
    setUploadedVideoIds([]);
    setVideoIdMapping(new Map());
    setDeletionErrors([]);
    
    // Reset original values and change tracking
    setOriginalFeedName("Testimonial Carousel");
    setOriginalVideos([]);
    setChangesMade(false);
    
    console.log('Failed uploads cleared and state reset');
  };

  const clearDeletionErrors = () => {
    setDeletionErrors([]);
  };

  const resetState = async () => {
    // Confirm before resetting
    if (!window.confirm('Are you sure you want to reset? This will delete all uploaded videos and cannot be undone.')) {
      return;
    }
    
    setIsResetting(true);
    
    try {
      // Set flag to prevent cleanup effects from running
      cleanupRunRef.current = true;
      
      // Delete all sliderVideo records before clearing state
      
      if (uploadedVideoIds.length > 0) {
        console.log('Deleting', uploadedVideoIds.length, 'sliderVideo records before reset');
        
        // Delete all sliderVideo records
        for (const videoId of uploadedVideoIds) {
          try {
            await deleteSliderVideo({ id: videoId });
            console.log('Deleted sliderVideo with ID:', videoId);
          } catch (error) {
            console.error('Failed to delete sliderVideo with ID:', videoId, error);
            setDeletionErrors(prev => [...prev, { videoId, error: error.message }]);
          }
        }
      }
      
      // Clear all state
      setVideos([]);
      setUploadedVideoIds([]);
      setVideoIdMapping(new Map());
      setFailedUploads([]);
      setDeletionErrors([]);
      
      // Reset original values and change tracking
      setOriginalFeedName("Testimonial Carousel");
      setOriginalVideos([]);
      setChangesMade(false);
      
      console.log('State reset completed');
    } catch (error) {
      console.error('Error during reset:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleBack = () => {
    navigate("/video-feeds");
  };

  const handleAddFromFiles = async () => {
    try {
      if (!videoFeedId) {
        console.warn('VideoFeed not initialized yet; cannot add files');
        alert('Please save the video feed first before adding files from your media library.');
        return;
      }

      setIsAddingFromFiles(true);

      // Access shopify object through window or app bridge
      const shopify = window.shopify || (window.shopifyAppBridge && window.shopifyAppBridge.picker);
      
      if (!shopify || !shopify.picker) {
        console.error('Shopify picker not available');
        setIsAddingFromFiles(false);
        return;
      }

      if (allVideoRecords.length === 0) {
        alert('No video files available in your media library. Please upload some videos first.');
        setIsAddingFromFiles(false);
        return;
      }

      // Filter valid items for the picker
      const validItems = allVideoRecords.filter(item => item.id && item.filename);
      
      console.log('Available video files:', allVideoRecords.length);
      console.log('Valid items for picker:', validItems.length);
      
      if (validItems.length === 0) {
        alert('No valid video files found. Please check your media library.');
        setIsAddingFromFiles(false);
        return;
      }

      const picker = await shopify.picker({
        heading: "Select video files to add to your video feed",
        multiple: true,
        items: validItems.map(item => ({
            id: item.id,
            heading: item.filename,
            description: item.filename,
            thumbnail: item.preview?.image?.url ? {
              url: item.preview.image.url,
            } : {
              url: 'https://cdn.shopify.com/s/files/1/0757/9955/files/placeholder-images-product-1_large.png',
            },
          })),
        headers: [
          {
            content: "Filename",
          },
        ],
      }).catch(error => {
        console.error('Error creating picker:', error);
        throw new Error('Failed to open file picker. Please try again.');
      });

      const selected = await picker.selected;
      
      console.log('Selected video IDs:', selected);
      
      // If no videos selected or user cancelled, just return
      if (!selected || selected.length === 0) {
        return;
      }
      
      if (selected && selected.length > 0) {
        // Filter videos from allVideoRecords by selected ids
        const selectedVideos = allVideoRecords.filter(video => selected.includes(video.id));
        console.log('Selected videos:', selectedVideos);
        
        // Filter out videos without valid source URLs
        const validVideos = selectedVideos.filter(video => video.originalSource?.url);
        const invalidVideos = selectedVideos.filter(video => !video.originalSource?.url);
        
        console.log('Valid videos with source URLs:', validVideos.length);
        console.log('Invalid videos without source URLs:', invalidVideos.length);
        
        if (invalidVideos.length > 0) {
          console.warn('Some selected videos have no source URL:', invalidVideos);
        }
        
        if (validVideos.length === 0) {
          alert('No valid videos selected. All selected videos must have accessible source URLs.');
          return;
        }
        
        // Add valid videos to the videos state
        setVideos(prevVideos => [...prevVideos, ...validVideos.map(video => ({
          id: video.id,
          name: video.filename,
          thumbnail: video.preview?.image?.url || 'https://cdn.shopify.com/s/files/1/0757/9955/files/placeholder-images-product-1_large.png',
          status: "Complete",
          src: video.originalSource?.url,
          uploadType: "shopifyFile"
        }))]);

        // Create sliderVideo records for each valid video
        let successCount = 0;
        let errorCount = 0;
        
        for (const video of validVideos) {
          try {
            await createSliderVideoFromFile({
              name: video.filename,
              src: video.originalSource?.url,
              status: "active",
              videoFeed: videoFeedId ? { _link: videoFeedId } : undefined,
              uploadType: "shopifyFile"
            });
            successCount++;
          } catch (error) {
            console.error('Error creating slider video from file:', error);
            errorCount++;
          }
        }
        
        // Show user feedback
        if (successCount > 0) {
          if (errorCount > 0) {
            alert(`Successfully added ${successCount} video(s) to your feed. ${errorCount} video(s) failed to be added.`);
          } else {
            alert(`Successfully added ${successCount} video(s) to your feed!`);
          }
        } else if (errorCount > 0) {
          alert(`Failed to add ${errorCount} video(s) to your feed. Please try again.`);
        }
      }
    } catch (error) {
      console.error('Error with picker:', error);
      alert(error.message || 'An error occurred while trying to open the file picker. Please try again.');
    } finally {
      setIsAddingFromFiles(false);
    }
  };

  const handleUploadVideo = () => {
    openUploadModal();
  };

  const handleDeleteVideo = async (videoId) => {
    // Confirm before marking for deletion
    if (!window.confirm('Remove this video from the feed? It will be permanently deleted after you click Save.')) {
      return;
    }

    // Mark for deletion to be processed on Save
    setPendingVideoDeletions(prev => {
      const updated = new Set(prev);
      updated.add(videoId);
      return updated;
    });

    // Optimistically remove from current view; do not touch originalVideos so SaveBar appears
    setVideos(prevVideos => prevVideos.filter(video => video.id !== videoId));
  };

  const handleTagProducts = (videoId) => {
    // Handle tagging products (to be implemented later)
    console.log("Tag products for video:", videoId);
  };

  const openUploadModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFilesUploaded = async (files) => {
    try {
      console.log('Files uploaded:', files);
      if (!videoFeedId) {
        console.warn('VideoFeed not initialized yet; cannot upload');
        return;
      }
      
      // Convert uploaded files to video objects and add them to the videos state immediately
      const newVideos = await Promise.all(files.map(async (file, index) => {
        // Create the video object with uploading status immediately
        const videoObj = {
          id: Date.now() + index,
          name: file.name,
          thumbnail: 'https://cdn.shopify.com/s/files/1/0757/9955/files/placeholder-images-product-1_large.png',
          status: "uploading",
          uploadProgress: "Uploading file",
        };
        
        // Add to videos state immediately with uploading status
        setVideos(prevVideos => [...prevVideos, videoObj]);
        
        // Also add to original videos if this is the first video
        if (videos.length === 0) {
          setOriginalVideos([videoObj]);
        }
        
        console.log('Video added to table with uploading status:', videoObj.name);
        
        // REMOVED: Complex thumbnail generation that was causing crashes
        // Just use the default placeholder thumbnail

        try {
          // Get direct upload token
          const {url, token} = await api.getDirectUploadToken();

          // Upload the file
          try {
            // Update progress to show file upload starting
            setVideos(prevVideos => 
              prevVideos.map(v => 
                v.id === videoObj.id 
                  ? { ...v, uploadProgress: "Uploading file..." }
                  : v
              )
            );
            
            await fetch(url, {
              method: 'PUT',
              headers: {
                'Content-Type': file.type,
              },
              body: file,
            });
            
            // Update progress to show file upload complete
            setVideos(prevVideos => 
              prevVideos.map(v => 
                v.id === videoObj.id 
                  ? { ...v, uploadProgress: "File uploaded, creating record..." }
                  : v
              )
            );
          } catch (error) {
            console.error('Error uploading file:', error);
            setFailedUploads(prev => [...prev, { fileName: file.name, error: error.message }]);
            // Update video status to failed
            setVideos(prevVideos => 
              prevVideos.map(v => 
                v.id === videoObj.id 
                  ? { ...v, status: "Failed to upload", uploadProgress: "Upload failed" }
                  : v
              )
            );
            return null; // Return null for failed uploads
          }

          // Create sliderVideo record and link to this videoFeed
          const response = await createSliderVideo({
            name: file.name,
            video: {
              directUploadToken: token,
              fileName: file.name,
            },
            status: "uploading",
            videoFeed: videoFeedId ? { _link: videoFeedId } : undefined,
            uploadType: "direct"
          });
          
          // Store the successfully created sliderVideo ID and create mapping
          const createdId = response?.data?.id ?? response?.id;
          if (createdId) {
            console.log('Successfully created sliderVideo with ID:', createdId);
            setUploadedVideoIds(prevIds => [...prevIds, createdId]);
            setVideoIdMapping(prevMapping => {
              const newMapping = new Map(prevMapping);
              newMapping.set(videoObj.id, createdId);
              return newMapping;
            });
            
            // Update video status to Complete
            setVideos(prevVideos => 
              prevVideos.map(v => 
                v.id === videoObj.id 
                  ? { ...v, status: "Complete", uploadProgress: undefined }
                  : v
              )
            );
            
            // Update original videos to include the completed video
            setOriginalVideos(prevOriginalVideos => {
              const existingIndex = prevOriginalVideos.findIndex(v => v.id === videoObj.id);
              if (existingIndex >= 0) {
                // Update existing video
                const updated = [...prevOriginalVideos];
                updated[existingIndex] = { ...videoObj, status: "Complete", uploadProgress: undefined };
                return updated;
              } else {
                // Add new video
                return [...prevOriginalVideos, { ...videoObj, status: "Complete", uploadProgress: undefined }];
              }
            });
            
            console.log('Video status updated to Complete for:', videoObj.name);
          }
          
          // The video object already has the default placeholder thumbnail
          
          return videoObj;
        } catch (error) {
          console.error('Error creating sliderVideo record:', error);
          setFailedUploads(prev => [...prev, { fileName: file.name, error: `Failed to create record: ${error.message}` }]);
          // Update video status to failed
          setVideos(prevVideos => 
            prevVideos.map(v => 
              v.id === videoObj.id 
                ? { ...v, status: "Failed to create record", uploadProgress: "Record creation failed" }
                : v
            )
          );
          return null; // Return null for failed record creation
        }
      }));
      
      // Filter out any null values from failed uploads
      const successfulVideos = newVideos.filter(video => video !== null);
      
      console.log('Files upload completed. Current uploaded video IDs:', uploadedVideoIds);
      
      closeModal();
    } catch (error) {
      console.error('Unexpected error in handleFilesUploaded:', error);
      setFailedUploads(prev => [...prev, { fileName: 'Unknown', error: `Unexpected error: ${error.message}` }]);
      closeModal();
    }
  };

  const saveBarRef = useRef(null);
  const saveButtonRef = useRef(null);
  const discardButtonRef = useRef(null);


  useEffect(() => {
    if (changesMade && saveBarRef.current) {
      saveBarRef.current.show();
    }
  }, [changesMade]);

  // When discard is requested, delete sliderVideos that were added since the last saved/original state
  useEffect(() => {
    if (!discardRequested) return;
    (async () => {
      try {
        const originalIds = new Set(originalVideos.map(v => v.id));
        const newlyAddedLocals = videosBeforeDiscard.filter(v => !originalIds.has(v.id));
        const uploadedIdsToDelete = newlyAddedLocals
          .map(v => videoIdMapping.get(v.id))
          .filter(Boolean);

        for (const uploadedId of uploadedIdsToDelete) {
          try {
            await deleteSliderVideo({ id: uploadedId });
            setUploadedVideoIds(prev => prev.filter(id => id !== uploadedId));
          } catch (error) {
            console.error('Failed to delete sliderVideo during discard with ID:', uploadedId, error);
          }
        }

        // Remove localId->uploadedId mappings for the discarded videos
        setVideoIdMapping(prev => {
          const updated = new Map(prev);
          for (const v of newlyAddedLocals) {
            updated.delete(v.id);
          }
          return updated;
        });
      } finally {
        setDiscardRequested(false);
      }
    })();
  }, [discardRequested, originalVideos, videosBeforeDiscard, videoIdMapping, deleteSliderVideo]);

  if (changesMade) {
    
  }

  return (
    <Page
      title={
        <InlineStack gap="200" align="center">
          <Button
            icon={<Icon source={ArrowLeftIcon} />}
            onClick={handleBack}
            variant="tertiary"
          />
          <Text variant="headingLg" as="h1">Create Video Feed</Text>
        </InlineStack>
      }
      primaryAction={
        <InlineStack gap="200" align="center">
          <Button primary onClick={handlePublish} disabled={videos.filter(v => v.status === "Complete").length === 0}>
            Publish {videos.filter(v => v.status === "Complete").length > 0 && `(${videos.filter(v => v.status === "Complete").length} videos)`}
          </Button>
          <Button variant="tertiary" onClick={resetState} loading={isResetting}>
            Reset
          </Button>
        </InlineStack>
      }
      secondaryActions={
        <Button variant="tertiary" onClick={handleDeleteVideoFeed} loading={deleteVideoFeedFetching}>
          Delete
        </Button>
      }
    >
      <div style={{ marginBottom: "16px" }}>
        <Text variant="bodyMd" tone="subdued">
          Note: You don't have to create feeds for each specific product page. Just tag products for one feed and enable "Dynamic Videos" in section settings.
        </Text>
      </div>

      <Card sectioned>
        <BlockStack gap="400">
          {/* Feed Name Section */}
          <div>
            <Text variant="headingMd" as="h3" fontWeight="bold">
              Feed Name
            </Text>
            <div style={{ marginTop: "8px" }}>
              <TextField
                value={feedName}
                onChange={setFeedName}
                placeholder="Enter feed name"
                autoComplete="off"
              />
            </div>
            <div style={{ marginTop: "4px" }}>
              <Text variant="bodySm" tone="subdued">
                Visible only to you.
              </Text>
            </div>
          </div>

          <Divider />

          {/* Videos Section */}
          <div>
            <Text variant="headingMd" as="h3" fontWeight="bold">
              Videos
            </Text>
            <div style={{ marginTop: "8px", marginBottom: "16px" }}>
              <Text variant="bodyMd" tone="subdued">
                Upload MP4 videos up to 500MB. Files are automatically added to the table below when dropped or uploaded.
              </Text>
            </div>

            <InlineStack gap="200" style={{ marginBottom: "16px" }}>
              <Button
                icon={<Icon source={FolderIcon} />}
                onClick={handleAddFromFiles}
                disabled={videoFilesFetching || allVideoRecords.length === 0 || !videoFeedId || isAddingFromFiles}
                loading={isAddingFromFiles}
              >
                {videoFilesFetching ? "Loading..." : isAddingFromFiles ? "Adding..." : "Add from Files"}
              </Button>
              <Button
                icon={<Icon source={UploadIcon} />}
                onClick={handleUploadVideo}
              >
                Upload Video
              </Button>
            </InlineStack>

            {/* Help text when no video files available or feed not saved */}
            {!videoFilesFetching && (allVideoRecords.length === 0 || !videoFeedId) && (
              <div style={{ marginTop: "8px", marginBottom: "16px" }}>
                <Text variant="bodySm" tone="subdued">
                  {!videoFeedId 
                    ? "Save the video feed first to add files from your media library."
                    : "No video files found in your Shopify media library. Upload videos first to add them to your feed."
                  }
                </Text>
              </div>
            )}

            {/* File Drop Zone - Only show when no videos exist */}
            {videos.length === 0 && (
              <SliderVideoDropZone
                onFilesUploaded={handleFilesUploaded}
                existingFiles={videos}
              />
            )}
          </div>

          <Divider />

          {/* Video Table */}
          <div>
            {/* Video Summary */}
          {videos.length > 0 && (
            <div style={{ 
              marginBottom: "16px", 
              padding: "16px", 
              backgroundColor: videos.some(v => v.status === "uploading") ? "#fefce8" : "#f8f9fa", 
              borderRadius: "8px",
              border: videos.some(v => v.status === "uploading") ? "1px solid #facc15" : "1px solid #e1e3e5"
            }}>
              <InlineStack align="space-between">
                <div>
                  <Text variant="bodyMd" fontWeight="semibold">
                    Video Summary
                  </Text>
                  <div style={{ marginTop: "4px" }}>
                    <Text variant="bodySm" tone="subdued">
                      {videos.length} total video{videos.length !== 1 ? 's' : ''} • {videos.filter(v => v.status === "uploading").length} uploading • {videos.filter(v => v.status === "Complete").length} complete • {failedUploads.length} failed
                    </Text>
                  </div>
                  {/* Warning message when videos are uploading */}
                  {videos.filter(v => v.status === "uploading").length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      <Text variant="bodySm" tone="caution">
                        ⚠ Please wait for all videos to finish uploading before saving changes.
                      </Text>
                    </div>
                  )}
                </div>
                {videos.length > 0 && (
                  <Button variant="tertiary" onClick={() => resetState()}>
                    Clear All
                  </Button>
                )}
              </InlineStack>
            </div>
            )}
            {/* Failed Uploads Summary */}
            {failedUploads.length > 0 && (
              <div style={{ 
                marginBottom: "16px", 
                padding: "12px", 
                backgroundColor: "#fef7f0", 
                borderRadius: "8px",
                border: "1px solid #f4b266"
              }}>
                <InlineStack align="space-between">
                  <div>
                    <Text variant="bodyMd" tone="caution">
                      ⚠ {failedUploads.length} upload{failedUploads.length !== 1 ? 's' : ''} failed
                    </Text>
                    <div style={{ marginTop: "8px" }}>
                      {failedUploads.map((failed, index) => (
                        <div key={index} style={{ fontSize: "14px", color: "#8c9196" }}>
                          {failed.fileName}: {failed.error}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button variant="tertiary" onClick={clearFailedUploads}>
                    Clear Errors
                  </Button>
                </InlineStack>
              </div>
            )}

            {/* Deletion Errors Summary */}
            {deletionErrors.length > 0 && (
              <div style={{ 
                marginBottom: "16px", 
                padding: "12px", 
                backgroundColor: "#fef2f2", 
                borderRadius: "8px",
                border: "1px solid #fecaca"
              }}>
                <InlineStack align="space-between">
                  <div>
                    <Text variant="bodyMd" tone="critical">
                      ❌ {deletionErrors.length} deletion error{deletionErrors.length !== 1 ? 's' : ''}
                    </Text>
                    <div style={{ marginTop: "8px" }}>
                      {deletionErrors.map((error, index) => (
                        <div key={index} style={{ fontSize: "14px", color: "#8c9196" }}>
                          Video ID {error.videoId}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button variant="tertiary" onClick={clearDeletionErrors}>
                    Clear Errors
                  </Button>
                </InlineStack>
              </div>
            )}

            <VideoFeedTable
              videos={videos}
              onDeleteVideo={handleDeleteVideo}
              onTagProducts={handleTagProducts}
              deletingVideos={deletingVideos}
            />
          </div>
        </BlockStack>
      </Card>
      
      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onFilesUploaded={handleFilesUploaded}
      />

      <ui-save-bar ref={saveBarRef} id="save-bar" message={videos.some(v => v.status === "uploading") ? "Unsaved changes (wait for videos to upload)" : "Unsaved changes"}>
            <button ref={saveButtonRef} variant="primary" id="save-button" onClick={handleSave} disabled={videos.some(v => v.status === "uploading")}>Save</button>
            <button ref={discardButtonRef} id="discard-button" onClick={handleDiscard} disabled={videos.some(v => v.status === "uploading")}>Discard</button>
      </ui-save-bar>

    </Page>
  );
}
