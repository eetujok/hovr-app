import { useFindFirst } from "@gadgetinc/react";
import {
  Layout,
  Page,
  Spinner,
  Text,
  Badge,
  Button,
  Banner,
  BlockStack,
} from "@shopify/polaris";
import { PlusIcon, ExternalIcon } from "@shopify/polaris-icons";
import { api } from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import VideoIndexTable from "../components/VideoIndexTable.jsx"
import ActionBanner from "../components/ActionBanner";
import { useEffect } from "react"
import { useGlobalAction } from "@gadgetinc/react";
import { useMantle } from '@heymantle/react';


export default function () {

  const { customer } = useMantle();

  var isSubscribed = false

  if (customer && customer.subscription) {
      isSubscribed = true
  }

  const handlePreviewLink = () => {
    const openUrl = `https://${shop.domain}/admin/themes/current/editor?template=index`;
    window.open(openUrl, "_blank");
  }

  // Refetch after video upload.

  const navigate = useNavigate();
  const location = useLocation();
  
  const shouldRefetch = location.state?.shouldRefetch || false;

  useEffect(() => {
    if (shouldRefetch) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [shouldRefetch, navigate, location.pathname]);


  const [{ data: shop, fetching: fetchingShop, error: errorFetchingShop }] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      extensionInstalled: true,
      domain: true,
    }
  });
  
  // Theme extension install status, false if not on main or development theme, true if is.
  const [{ data: extensionStat, fetching: fetchingExtensionStat, error: errorFetchingExtensionStat }, act] = useGlobalAction(api.themeExtensionCheck);
  

  useEffect(() => {
    if (shop && shop.id && !extensionStat) {
      try {
          act({ shopId: shop.id });
      } catch (error) {
        console.log(error, "Error checking theme extension status.")
      }
    }
  }, [shop, extensionStat, act]);

  useEffect(() => {

    const loadCrispScript = () => {
      window.$crisp = [];
      window.CRISP_WEBSITE_ID = "32d902ee-ad1b-4a8f-a0eb-2a9874403fae";
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = 1;
      d.getElementsByTagName("head")[0].appendChild(s);
    };

    loadCrispScript();

    return () => {
      const crispScript = document.querySelector('script[src="https://client.crisp.chat/l.js"]');
      if (crispScript) {
        crispScript.remove();
      }
  
      delete window.$crisp;
      delete window.CRISP_WEBSITE_ID;
    };
  }, []);

  if (errorFetchingShop) {
    return (
      <Page title="Error">
        <Text variant="bodyMd" as="p">
          Error: {error.toString()}
        </Text>
      </Page>
    );
  }

  if (fetchingShop) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <Spinner accessibilityLabel="Spinner example" size="large" />
      </div>
    );
  }

  // Render badge and banner based on theme extension status.
  
  const badge = fetchingExtensionStat ? (
    <Badge size="small">Checking extension status...</Badge>
  ) : extensionStat?.data == true ? (
    <Badge tone="success" size="medium" progress="complete">Extension enabled</Badge>
  ) : (
    <Badge tone="warning" size="medium" content="disabled" progress="partiallyComplete">Extension disabled</Badge>
  );


  return (
    <Page
      title="Dashboard"
      titleMetadata={badge}
      primaryAction={<Button onClick={ () => navigate("/add-video") } variant="primary" tone="success" icon={PlusIcon}>Add video</Button>}
      secondaryActions={[
        {
          content: "View in theme",
          icon: ExternalIcon,
          disabled: !(extensionStat?.data === true) || !isSubscribed,
          onAction: () => handlePreviewLink(),
        },
      ]}

    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <ActionBanner domain={shop.domain} fetchingCheck={fetchingExtensionStat} navigate={navigate} isExtensionEnabled={extensionStat?.data === true} isSubscriptionActivated={isSubscribed}  />
            <VideoIndexTable navigate={navigate} shouldRefetch={shouldRefetch} />
                          <div style={{ display: 'flex', marginTop: '2em', marginBottom: '2em'}}>
                          </div>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
