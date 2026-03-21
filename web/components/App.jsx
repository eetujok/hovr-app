import {
  AppType,
  Provider as GadgetProvider,
  useGadget,
} from "@gadgetinc/react-shopify-app-bridge";
import { NavMenu } from "@shopify/app-bridge-react";
import { Page, Spinner, Text, Box, Card } from "@shopify/polaris";
import { useEffect } from "react";
import {
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
  Link
} from "react-router-dom";
import Index from "../routes/index";
import AboutPage from "../routes/about";
import AddVideoPage from "../routes/addVideo"
import UploadVideoPage from "../routes/uploadVideo"
import PlansPage from "../routes/plans";
import AdminUploadVideo from "../routes/adminUploadVideo"
import ChooseVideoPage from "../routes/chooseVideo"
import VideoBannerPage from "../routes/videoBanner"
import VideoFeedsPage from "../routes/videoFeeds"
import CreateVideoFeedPage from "../routes/createVideoFeed"

import { api } from "../api";
import { MantleProvider } from "@heymantle/react";
import { useFindFirst } from "@gadgetinc/react";

function Error404() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const appURL = process.env.GADGET_PUBLIC_SHOPIFY_APP_URL;

    if (appURL && location.pathname === new URL(appURL).pathname) {
      navigate("/", { replace: true });
    }
  }, [location.pathname]);

  return <div>404 not found</div>;
}

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
              <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Error404 />} />
          <Route path="/add-video" element={<AddVideoPage />} />
          <Route path="/upload-video" element={<UploadVideoPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/admin-upload-video" element={<AdminUploadVideo />} />
          <Route path="/choose-video" element={<ChooseVideoPage />} />
          <Route path="/video-banner" element={<VideoBannerPage />} />
          <Route path="/video-feeds" element={<VideoFeedsPage />} />
          <Route path="/create-video-feed" element={<CreateVideoFeedPage />} />
        </Route>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

function Layout() {
  return (
    <GadgetProvider
      type={AppType.Embedded}
      shopifyApiKey={window.gadgetConfig.apiKeys.shopify}
      api={api}
    >
      <AuthenticatedApp />
    </GadgetProvider>
  );
}

function AuthenticatedApp() {
  // we use `isAuthenticated` to render pages once the OAuth flow is complete!
  const { isAuthenticated, loading } = useGadget();
  if (loading) {
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
  return isAuthenticated ? <EmbeddedApp /> : <UnauthenticatedApp />;
}

function EmbeddedApp() {

  const [{ data, fetching }] = useFindFirst(api.shopifyShop);

  if (fetching) {
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

  return (
    <MantleProvider
      appId={process.env.GADGET_PUBLIC_MANTLE_APP_ID}
      customerApiToken={data?.mantleApiToken}
    >
      <Outlet />
      <NavMenu>
        <Link to="/" rel="home">Shop Information</Link>
        <Link to="/video-feeds" rel="video-feeds">Video Feeds</Link>
        <Link to="/plans" rel="plans">Select plan</Link>
      </NavMenu>
    </MantleProvider>
  );

}

function UnauthenticatedApp() {
  return (
    <Page>
      <div style={{ height: "80px" }}>
        <Card padding="500">
          <Text variant="headingLg" as="h1">
            App must be viewed in the Shopify Admin
          </Text>
          <Box paddingBlockStart="200">
            <Text variant="bodyLg" as="p">
              Edit this page: <a href={`/edit/${process.env.GADGET_PUBLIC_APP_ENV}/files/web/components/App.jsx`}>web/components/App.jsx</a>
            </Text>
          </Box>
        </Card>
      </div>
    </Page>
  );
}

export default App;
