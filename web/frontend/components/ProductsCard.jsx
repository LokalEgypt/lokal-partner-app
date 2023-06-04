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
  const [isHook, setIsHook] = useState(false);



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


  const {
    hooks,
    refetch: refetchHooks,
    isLoading: isLoadingHooks,
    isRefetching: isRefetchingHooks,
  } = useAppQuery({
    url: "/api/products/hook",
    reactQueryOptions: {
      onSuccess: () => {
        setIsLoading(false);
        setIsHook(hooks);
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
      setToastProps({ content: "Store was linked successfully" });
    } else {
      setIsLoading(false);
      setToastProps({
        content: "There was an error linking your store.",
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
          content: hooks ? "Store Already Linked" : "Link your Store",
          onAction: handlePopulate,
          loading: isLoadingHooks,
          disabled: hooks
        }}
      >
        <TextContainer spacing="loose">
          <p>
          Welcome to our Shopify app! Seamlessly connect your store with LOKAL, our platform for showcasing local fashion brands. Effortlessly sync your products, images, and stock with a single click. Updates to your products automatically reflect on both your store and LOKAL, eliminating the need for manual management. Enjoy real-time stock management, ensuring accurate inventory across platforms. Expand your reach and tap into a global customer base while retaining control over your brand. Join LOKAL and unlock new growth opportunities. Install now to experience the convenience and efficiency our app brings to your business.
          </p>
          <Heading element="h5">
            TOTAL PRODUCTS
            <DisplayText size="medium">
              <TextStyle variation="strong">
                {isLoadingCount ? "-" : data.count}
              </TextStyle>
            </DisplayText>
          </Heading>
        </TextContainer>
      </Card>
    </>
  );
}
