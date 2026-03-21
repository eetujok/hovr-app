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
  InlineStack,
  Divider
} from "@shopify/polaris";
import { PlusIcon, ExternalIcon, InfoIcon } from "@shopify/polaris-icons";
import { api } from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import VideoIndexTable from "../components/VideoIndexTable.jsx"
import ActionBanner from "../components/ActionBanner";
import SectionLayout from "../components/SectionLayout.jsx"
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

    // When Crisp script loads, push custom session data
    s.onload = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const company = urlParams.get("shop");

      if (company) {
        window.$crisp.push([
          "set",
          "session:data",
          [[["storeUrl", company]]]
        ]);
      }
    };

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

  const autoplayBadge = fetchingExtensionStat ? (
    <></>
  ) : extensionStat?.data == true ? (
    extensionStat?.autoplay == true ? (
      <Badge size="small" content="Autoplay All Video - enabled" progress="complete">Autoplay All Video - enabled</Badge>
    ) : (
      <Badge size="small" content="Autoplay All Video - disabled" progress="partiallyComplete">Autoplay All Video - disabled</Badge>
    )
  ) : (
    <></>
  );

  console.log(extensionStat, "Extension status")

  const badgeStack = (  
    <InlineStack blockAlign="center" gap="200">
      {badge}
      {autoplayBadge}
    </InlineStack>
  )
  return (
    <Page
      title="Dashboard"
      titleMetadata={badgeStack}
      secondaryActions={[
        {
          content: "Edit Extension Settings",
          icon: ExternalIcon,
          disabled: !(extensionStat?.data === true) || !isSubscribed,
          onAction: () => handlePreviewLink(),
        },
      ]}

    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
              <Text variant="bodyMd" as="p">
                Here you can add/remove hover videos, autoplay videos and install video sections. To autoplay every video (in banners, sliders, etc.) on your storefront, navigate to extension settings.
              </Text>
            <ActionBanner domain={shop.domain} fetchingCheck={fetchingExtensionStat} navigate={navigate} isExtensionEnabled={extensionStat?.data === true} isSubscriptionActivated={isSubscribed}  />
            <Divider borderWidth="025" />
            <SectionLayout domain={shop.domain} />
            <Divider borderWidth="025" />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "10px", justifyContent: "space-between" }}>
            <Text variant="headingMd" as="h2">Video Hover & Autoplay</Text>
            <Button onClick={ () => navigate("/add-video") } variant="primary" tone="success" icon={PlusIcon}>Add video</Button>
            </div>
              <VideoIndexTable navigate={navigate} shouldRefetch={shouldRefetch} />
            </div>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
