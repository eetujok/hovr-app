import {
  Layout,
  Page,
  Spinner,
  Text,
} from "@shopify/polaris";
import ProductResourceList from "../components/ProductResourceList.jsx"
import { useNavigate } from "react-router-dom";


export default function () {

  const navigate = useNavigate();


  return (
    <Page
      title="Add video"
      subtitle="Select the product you want to add a hover video for. Products seen here don't have a hover video. Contact support for batch upload."
      backAction={{ content: 'Dashboard', onAction: () => navigate("/") }}
    >
      <Layout>
        <Layout.Section>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth : '60vh'}}>
            <ProductResourceList />
        </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}