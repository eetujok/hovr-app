import { Page, Layout, Card, Text, Button } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

    export default function VideoBanner({ domain }) {
    const navigate = useNavigate();
    
    return (
        <Page
            title="Instructions for installing Video Sections"
            backAction={{ content: 'Dashboard', onAction: () => navigate("/") }}
        >
            <Layout>
                <Layout.Section>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <Text as="h1" variant="headingLg">Video Banner/Background</Text>
                    <Card padding="400" borderRadius="300" borderColor="border-brand">
                        <Text as="p" fontWeight="bold" variant="bodyLg">Instructions: </Text>
                        <ol>
                            <li>Navigate to the theme editor</li>
                            <li>Click on "Add Section" {"->"} "Apps" {"->"} "Video Banner/Background"</li>
                            <li>Customize to your liking and save the section</li>
                        </ol>
                        <Button variant="primary" onClick={() => {
                            const openUrl = `https://${domain}/admin/themes/current/editor?addAppBlockId=8594daf9c19b6d35cc6917358d5dd64d/videoBanner&target=newAppsSection`;
                                window.open(openUrl, "_blank");
                            }}>Add to theme</Button>
                        </Card>
                    </div>
                </Layout.Section>
            </Layout>
        </Page>
    )
}