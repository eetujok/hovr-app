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
  if (!isExtensionEnabled && !isSubscriptionActivated) {
    return (
      <Banner title="Action needed" tone="warning">
        <p>1. You have to activate your trial, for your video hover extension to be available on your page.</p>
        <p>2. After activating your plan you need to activate our theme extension for the video hovers to appear in your product photos on collection pages.</p>
        <div style={{ marginTop: '0.5em' }}>
          <Button onClick={() => navigate('/plans')}>To Plans</Button>
        </div>
      </Banner>
    );
  }

  if (!isExtensionEnabled && isSubscriptionActivated ) {
    return (
      <Banner title="Theme extension not activated" tone="warning">
        <p>You need to activate our theme extension for the video hovers to appear in your product photos on collection pages. <strong>Remember to save when adding the extension.</strong></p>
        <div style={{ marginTop: '0.5em' }}>
          <Button onClick={handleDeepLink}>Activate extension</Button>
        </div>
      </Banner>
    );
  }

  if (!isSubscriptionActivated && isExtensionEnabled) {
    return (
      <Banner title="Action needed" tone="warning">
        <p>You have to activate your trial, for our video hover extension to be available on your theme.</p>
        <div style={{ marginTop: '0.5em' }}>
          <Button onClick={() => navigate('/plans')}>To Plans</Button>
        </div>
      </Banner>
    );
  }

  return (
    <Banner title="All set!" tone="success">
      <p>Your extension is enabled, and your subscription is active. The video hovers will now be displayed on your collection pages.</p>
    </Banner>
  );
}

export default ActionBanner;
