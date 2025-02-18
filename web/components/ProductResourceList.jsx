import {
  Filters,
  Card,
  ResourceList,
  Avatar,
  ResourceItem,
  Text,
  Spinner,
  Page,
  Thumbnail,
  Box,
  SkeletonThumbnail,
  SkeletonBodyText,
  Icon,
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

    const { id, title, images } = item;
    const imageUrl = images?.edges[0]?.node?.source;
    
    setIsNavigating(true);
    
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    // Navigate and set a timeout to reset the navigation state
    navigate("/upload-video", { 
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
      AND: [
        { title: { isSet: true } },
        { status: { equals: 'active'} },
        { videoSet: { equals: false }}
        ]
      },
      select: {
        id: true,
        title: true,
        images: {
          edges: {
            node: {
              position: true,
              source: true,
            }
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
    <Box background="bg-surface" borderRadius="300" minWidth="70vh" padding='300' borderColor="">
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
    const { id, title, images } = item;
    const media = images?.edges?.length > 0
    ? <Thumbnail source={images.edges[0].node.source} size="large" />
    : <Thumbnail source={FallbackImage} size="large"/>
    return (
      <ResourceItem id={id} media={media} verticalAlignment="center" onClick={() => handleItemClick(item)}>
        <Text variant="bodyMd" fontWeight="bold" as="h3">
          {title}
        </Text>
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