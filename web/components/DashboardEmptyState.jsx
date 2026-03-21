import { Card, EmptyState, Icon } from '@shopify/polaris';
import Illustration from "../assets/Illustration.png"
import { PlusIcon } from '@shopify/polaris-icons'


const DashboardEmptyState = ({ navigate }) => {


  return (
    <Card sectioned>
      <EmptyState
        heading="You have no products with autoplay or hover videos"
        action={{ content: 'Add video', icon: <Icon source={PlusIcon} />, onAction: () => navigate("/add-video") }}
        image={Illustration}
      >
        <p>Add autoplay or hover videos to your product images on collections, to improve your conversion rate.</p>
      </EmptyState>
    </Card>
  );
}

export default DashboardEmptyState