import { Card, Text, Button, Icon } from "@shopify/polaris";
import { useMantle } from '@heymantle/react';
import { PlusIcon } from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";

export default function SectionCard({ title, description, illustration, target}) {

              
  const { customer } = useMantle();
  const navigate = useNavigate();

  var isSubscribed = false

  if (customer && customer.subscription) {
    isSubscribed = true
  }



  return (
    <div style={{ maxWidth: "300px" }}>
    <Card padding="600" borderRadius="300" borderColor="border-brand" >
        <img 
          src={illustration} 
          alt={title}
          style={{ 
            maxWidth: '150px', 
            height: 'auto', 
            marginBottom: '16px',
            borderRadius: '8px'
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Text as="h2" variant="headingMd">{title}</Text>
                <Text as="p" variant="bodyMd">{description}</Text>
            </div>
            <Button 
                variant="primary" 
                icon={<Icon source={PlusIcon} />} 
                onClick={() => {
                    if (isSubscribed) {
                        if (target.includes("https")) {
                            window.open(target, "_blank")
                        } else {
                            navigate(target)
                        }
                    } else {
                        navigate("/plans")
                    }
                }}
            >
                Add To Theme
            </Button>
        </div>

    </Card>
    </div>
  )
}