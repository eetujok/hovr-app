import {
    Layout,
    Page,
    Text,
    Card,
    InlineStack,
    Button,
    Box,
    Banner
  } from "@shopify/polaris";
  import { useCallback, useEffect, useState } from 'react';

  import { useNavigate, useLocation } from "react-router-dom";
  import AutoplayIllustration from "../assets/AutoplayIllustration.png"
  import HoverIllustration from "../assets/HoverIllustration.png"
  
  export default function () {
  
    const navigate = useNavigate();
    const location = useLocation();
    const [autoplayImageLoaded, setAutoplayImageLoaded] = useState(false);
    const [hoverImageLoaded, setHoverImageLoaded] = useState(false);

    const { id, title, imageUrl } = location.state || {};

    useEffect(() => {
      if (!location.state || !id) {
        navigate("/", { replace: true });
        return;
      }
    }, [location.state, id, navigate]);

    const onAutoplayVideoClick = useCallback(() => {
        navigate("/upload-video", { state: { id, title, imageUrl, type: "autoplay" }, replace: true });
    }, [id, title, imageUrl, navigate])

    const onHoverVideoClick = useCallback(() => {
        navigate("/upload-video", { state: { id, title, imageUrl, type: "hover" }, replace: true });
    }, [id, title, imageUrl, navigate])

    return (
      <Page
        title="Choose video type"
        subtitle="Choose the type of video you want to add to your collections."
        backAction={{ content: 'Dashboard', onAction: () => navigate("/add-video") }}
      >
        <Layout>
          <Layout.Section>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '20px'}}>
              <Box background="bg-surface" borderRadius="300" padding='600' width="100%">
                  <InlineStack align="center" gap='800' wrap={true}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '250px'}}>
                        {/* WebP animation of autoplay video */}
                        {!autoplayImageLoaded && (
                          <div style={{
                            width: '100%', 
                            height: '150px', 
                            backgroundColor: '#f1f2f3', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                          </div>
                        )}
                        <img 
                          src={AutoplayIllustration} 
                          style={{
                            width: '100%', 
                            height: 'auto', 
                            maxHeight: '150px', 
                            objectFit: 'contain',
                            display: autoplayImageLoaded ? 'block' : 'none'
                          }}
                          onLoad={() => setAutoplayImageLoaded(true)}
                          alt="Autoplay video illustration"
                        />
                        <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                            <Text variant="headingMd" as="h2">Autoplay Video</Text>
                            <div style={{display: 'flex', flexDirection: 'column', minHeight: '60px'}}>
                             <Text as="p">Add an autoplaying video to your product on collection pages pages. Video is played when in view.</Text>
                            </div>
                        </div>
                        <Button variant="primary" fullWidth onClick={onAutoplayVideoClick}>Choose Autoplay</Button>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '250px'}}>
                            {/* WebP animation of hover video */}
                        {!hoverImageLoaded && (
                          <div style={{
                            width: '100%', 
                            height: '150px', 
                            backgroundColor: '#f1f2f3', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                          </div>
                        )}
                        <img 
                          src={HoverIllustration} 
                          style={{
                            width: '100%', 
                            height: 'auto', 
                            maxHeight: '150px', 
                            objectFit: 'contain',
                            display: hoverImageLoaded ? 'block' : 'none'
                          }}
                          onLoad={() => setHoverImageLoaded(true)}
                          alt="Hover video illustration"
                        />
                            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                              <Text variant="headingMd" as="h2">Hover Video</Text>
                              <Text as="p">Add a hover video to product images in your collection pages. Video is played when hovering.</Text>
                          </div>
                          <Button variant="primary" fullWidth onClick={onHoverVideoClick}>Choose Hover</Button>
                      </div>
                  </InlineStack>
              </Box>
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }