import {
  Filters,
  ResourceList,
  ResourceItem,
  Text,
  Page,
  Thumbnail,
  Box,
  SkeletonThumbnail,
  SkeletonBodyText,
  Badge
} from '@shopify/polaris';
import { useState, useCallback, useEffect, useRef  } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useFindMany } from "@gadgetinc/react";
import { api } from "../api";
import "./resourceList.css"
import FallbackImage from "../assets/NoImagePhoto.png"

const ProductResourceList = () => {

  const navigate = useNavigate()
  const location = useLocation();
  const navigationTimeoutRef = useRef(null);

  // Clear navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);
  
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const [queryValue, setQueryValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  
  useEffect(() => {
    if (location.state?.shouldRefetch) {
      setIsNavigating(false);
    }
  }, [location.state]);
  const handleQueryValueChange = useCallback((value) => {
    setQueryValue(value);
    debouncedSearch(value);
  }, []);

  const handleQueryValueRemove = useCallback(
    () => {
      setQueryValue("");
      debouncedSearch("");
    },
    [],
  );

  const debouncedSearch = useCallback(debounce((value) => {
    setDebouncedQuery(value);
  }, 300), []);
  
  const handleClearAll = useCallback(() => {
    handleQueryValueRemove();
  }, [handleQueryValueRemove]);

  const resourceName = {
    singular: 'customer',
    plural: 'customers',
  };
  
  const handleItemClick = useCallback((item) => {
    
    if (isNavigating) return; // Prevent multiple clicks

    const { id, title, featuredMedia } = item;
    const imageUrl = featuredMedia?.file?.image?.originalSrc;
    
    setIsNavigating(true);
    
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    // Navigate and set a timeout to reset the navigation state
    navigate("/choose-video", { 
      state: { id, title, imageUrl },
      replace: true // Use replace to prevent back navigation
    });
    
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
    }, 1000); // Reset after 1 second
    
  }, [navigate, isNavigating]);
  
  const filterControl = (
    <Filters
      filters={{}}
      hideFilters={true}
      queryValue={queryValue}
      onQueryChange={handleQueryValueChange}
      onQueryClear={handleQueryValueRemove}
      queryPlaceholder="Search products"
      onClearAll={handleClearAll}
    >

    </Filters>
  );

  const [{ data: products, fetching: fetchingProduct, error: errorFetchingProduct }] = useFindMany(api.shopifyProduct, {
      search: debouncedQuery,
      filter: {
          title: { isSet: true },
      },
      select: {
        id: true,
        title: true,
        videoSet: true,
        featuredMedia: {
          file: {
            image: true
          }
        }
      },
      first: 5,
  });
  

  useEffect(() => {
    if (products) {
      const firstFiveProducts = products.slice(0, 5);
      setItems(Object.values(firstFiveProducts));
      console.log("Object array", Object.values(products))
    }
  }, [products]);

  if (errorFetchingProduct) {
    return (
      <Page title="Error">
        <Text variant="bodyMd" as="p">
          Error: {errorFetchingProduct.toString()}
        </Text>
      </Page>
    );
  }

  return (
    <Box background="bg-surface" borderRadius="300" minWidth="50vw" padding='300' borderColor="">
      <ResourceList
        resourceName={resourceName}
        items={fetchingProduct ? Array(5).fill({}) : items}
        renderItem={fetchingProduct ? renderSkeletonItem : renderItem}
        filterControl={filterControl}
        emptySearchState={<div>No products found</div>}
      />
    </Box>
  );



  function renderItem(item) {
    const { id, title, featuredMedia } = item;
    const media = featuredMedia?.file?.image?.originalSrc
    ? <Thumbnail source={featuredMedia?.file?.image?.originalSrc} size="large" />
    : <Thumbnail source={FallbackImage} size="large"/>
    return (
      <ResourceItem id={id} disabled={item.videoSet}  media={media} verticalAlignment="center" onClick={() => handleItemClick(item)}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', maxWidth: '300px'}}>
          <Text variant="bodyMd" fontWeight="bold" as="h3">
            {title}
          </Text>
          {item.videoSet && <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            <Badge tone="success">Video Set</Badge>
          </span>}
        </div>
      </ResourceItem>
    );
  }

  function renderSkeletonItem() {
    return (
      <ResourceItem id="skeleton" media={<SkeletonThumbnail size="large" />} verticalAlignment="center">
        <SkeletonBodyText lines={2} />
      </ResourceItem>
    );
  }

}

export default ProductResourceList