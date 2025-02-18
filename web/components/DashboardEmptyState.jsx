import { Card, EmptyState, Icon } from '@shopify/polaris';
import Illustration from "../assets/Illustration.png"
import { PlusIcon } from '@shopify/polaris-icons'


const DashboardEmptyState = ({ navigate }) => {


  return (
    <Card sectioned>
      <EmptyState
        heading="You have no products with hover videos"
        action={{ content: 'Add video', icon: <Icon source={PlusIcon} />, onAction: () => navigate("/add-video") }}
        image={Illustration}
      >
        <p>Add hoverable videos to your product images on collection pages, to improve your themes click-through rate.</p>
      </EmptyState>
    </Card>
  );
}

export default DashboardEmptyState