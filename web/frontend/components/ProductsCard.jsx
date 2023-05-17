import { useState } from "react";
import {
  Card,
  Heading,
  TextContainer,
  DisplayText,
  TextStyle,
  Button,
  TextField,
} from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function ProductsCard() {
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(true);
  const [toastProps, setToastProps] = useState(emptyToastProps);


  const [userid, setUserID] = useState("");

  const updateUserID = e => {
    setUserID(e);
  };

  const fetch = useAuthenticatedFetch();

  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
    isRefetching: isRefetchingCount,
  } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  });

  const toastMarkup = toastProps.content && !isRefetchingCount && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const handlePopulate = async () => {
    setIsLoading(true);
    const response = await fetch("/api/products/sync");

    if (response.ok) {
      await refetchProductCount();
      setToastProps({ content: "Products were sent successfully" });
    } else {
      setIsLoading(false);
      setToastProps({
        content: "There was an error sending products",
        error: true,
      });
    }
  };

  return (
    <>
      {toastMarkup}
      <Card
        title="Sync with Lokal"
        sectioned
        primaryFooterAction={{
          content: "Link your Store",
          onAction: handlePopulate,
          loading: isLoading,
        }}
      >
        <TextContainer spacing="loose">
          <p>
          By linking your store to Lokal, you agree to share your store's products with us for the purposes of showing your products on our platform, making sales, and marketing. We will not modify or alter any of your product data without your consent. We respect your privacy and will only use your product data for the purposes of our mutual business arrangement.
          </p>
          <Heading>
              <DisplayText size="medium">
                <TextStyle variation="strong">
                  <TextField label="User ID goes here" value={userid} onChange={updateUserID} />
                </TextStyle>
              </DisplayText>
            </Heading>
          <Heading element="h5">
            TOTAL PRODUCTS
            <DisplayText size="medium">
              <TextStyle variation="strong">
                {isLoadingCount ? "-" : data.count}
              </TextStyle>
            </DisplayText>
          </Heading>
        </TextContainer>
        <Button className="my-button">Sync Products Manually</Button>
      </Card>
    </>
  );
}
