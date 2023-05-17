import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Stack,
  Link,
  Heading,
  TextField,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { logo } from "../assets";

import { ProductsCard } from "../components";

export default function HomePage() {
  return (
    <Page narrowWidth>
      <TitleBar title="Lokal Partner App" primaryAction={null} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
               <Stack.Item>
                <div style={{ padding: "0 20px" }}>
                  <Image
                    source={logo}
                    alt="LOKAL"
                    width={150}
                  />
                </div>
              </Stack.Item>
              <Stack.Item fill>
                  <Heading>Welcome to Lokal Partners App</Heading>
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <ProductsCard/>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
