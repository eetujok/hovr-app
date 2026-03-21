import SectionCard from "./SectionCard";
import VideoBannerIllustration from "../assets/VideoBannerIllustration.png";
import { Text, Button } from "@shopify/polaris";
import { PlusIcon, InfoIcon, HideIcon, ViewIcon } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VideoSliderIllustration from "../assets/Video Slider Illustration.png";

export default function SectionLayout({ domain }) {
    
    // Don't render if domain is not available yet
    if (!domain) {
        return null;
    }
    const navigate = useNavigate();

    const sectionCards = [
        {
            title: "Video Banner/Background",
            description: "Capture and maintain attention with the Video Banner - block. Add anywhere to your store as many times as needed.",
            illustration: VideoBannerIllustration,
            target: `https://${domain}/admin/themes/current/editor?addAppBlockId=8594daf9c19b6d35cc6917358d5dd64d/videoBanner&target=newAppsSection`
        },
        {
            title: "Shoppable Video Slider",
            description: "Setup shoppable Video Sliders by creating video feeds. Add to product pages, home page or anywhere else.",
            illustration: VideoSliderIllustration,
            target: `/video-feeds`
        }
    ]
    const [showSections, setShowSections] = useState(() => {
        // Initialize from sessionStorage, default to true if not set
        const stored = sessionStorage.getItem('showSections');
        return stored !== null ? JSON.parse(stored) : true;
    });

    // Update sessionStorage whenever showSections changes
    useEffect(() => {
        sessionStorage.setItem('showSections', JSON.stringify(showSections));
    }, [showSections]);


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "10px", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "25px" }}>
                    <Text variant="headingMd" as="h2">Video Sections</Text>
                    <Button icon={InfoIcon} variant="plain" onClick={() => navigate("/video-banner")}>Instructions</Button>
                </div>
                <Button icon={showSections ? HideIcon : ViewIcon} variant="secondary"  onClick={() => setShowSections(!showSections)}>{showSections ? "Hide Sections" : "Show Sections"}</Button>
            </div>
        {showSections && (
            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
                {sectionCards.map((card) => (
                    <SectionCard key={card.title} title={card.title} description={card.description} illustration={card.illustration} target={card.target} />
                ))}
            </div>
        )}
        </div>
    )
}