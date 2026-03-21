import { Banner, Button } from "@shopify/polaris";

const ActionBanner = ({ domain, fetchingCheck, isExtensionEnabled, isSubscriptionActivated, navigate }) => {

  const handleDeepLink = () => {
    const openUrl = `https://${domain}/admin/themes/current/editor?context=apps&activateAppId=583bccef-b1d0-4e19-8e24-245ace8c5fee/previewVideoBlock&target=mainSection`;
    window.open(openUrl, "_blank");
  }

  if (fetchingCheck) {
    return (
      <div></div>
    )
  }
  
  // Don't display anything if extension is enabled and subscription is activated
  if (isExtensionEnabled && isSubscriptionActivated) {
    return null;
  }
  
  if (!isExtensionEnabled && !isSubscriptionActivated) {
    return (
      <Banner title="Action needed" tone="warning">
        <p>1. You have to activate your trial, for the Hovr extension to be available on your page.</p>
        <p>2. After activating your plan you need to activate our theme extension for autoplay video and/or video hovers to appear in your storefront.</p>
        <div style={{ marginTop: '0.5em' }}>
          <Button onClick={() => navigate('/plans')}>To Plans</Button>
        </div>
      </Banner>
    );
  }

  if (!isExtensionEnabled && isSubscriptionActivated ) {
    return (
      <Banner title="Theme extension not activated" tone="warning">
        <p>You need to activate our theme extension for the autoplay videos and/or video hovers to appear on your collection pages. <strong>Remember to save when adding the extension.</strong> If you've successfully added the theme extension, disregard this message.</p>
        <div style={{ marginTop: '0.5em' }}>
          <Button onClick={handleDeepLink}>Activate extension</Button>
        </div>
      </Banner>
    );
  }

  if (!isSubscriptionActivated && isExtensionEnabled) {
    return (
      <Banner title="Action needed" tone="warning">
        <p>You have to activate your trial, to add the video banner or hover/autoplay videos to your theme.</p>
        <div style={{ marginTop: '0.5em' }}>
          <Button onClick={() => navigate('/plans')}>To Plans</Button>
        </div>
      </Banner>
    );
  }

  return null;
}

export default ActionBanner;
