import { Page, Layout, Text, BlockStack } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import { useMantle } from '@heymantle/react';
import { PlanCardStack, PlanCardType } from '@heymantle/polaris';

export default function () {

  const navigate = useNavigate();

  const { customer, plans, subscribe } = useMantle();

  var isSubscribed = false

  if (customer && customer.subscription) {
    isSubscribed = true
  }

  return (
    <Page
      title="Select your plan"
      backAction={{
        content: "Shop Information",
        onAction: () => navigate("/"),
      }}
    >      
      <Layout>
        <Layout.Section>
        <div style={{marginBottom: '2em'}}>
          <BlockStack gap='300'>
            <BlockStack inlineAlign='center'>
              <div style={{ width: '40%' }}>
                {!isSubscribed && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2em' }}>
                      <Text as="h1" variant="headingXl">Activate 14 day trial ⭐️</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2em' }}>
                      <Text as="h2" alignment='center' variant="bodyLg">Select a plan to activate video hovers in your theme. Don't worry you won't be charged anything yet.</Text>
                    </div>
                  </div>
                )}
                <PlanCardStack
                  cardType={PlanCardType.Highlighted}
                  customer={customer}
                  plans={plans}
                  keyForRecommended={"Recommended"}
                  onSelectPlan={async ({ plan, discount }) => {
                    const subscription = await subscribe({ planId: plan.id, discountId: discount?.id, returnUrl: '/' });
                    if (subscription.error) {
                      console.error('Unable to subscribe: ', subscription.error);
                    } else {
                      open(subscription.confirmationUrl, "_top");
                    }
                  }}
                />
              </div>
            </BlockStack>
            </BlockStack>
          </div>
            </Layout.Section>
          </Layout>
        </Page>
        );
}