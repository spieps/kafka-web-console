import { getTopic } from "@/api/topics/actions";
import { KafkaTopicParams } from "@/app/[locale]/(authorized)/kafka/[kafkaId]/topics/kafkaTopic.params";
import { AppHeader } from "@/components/AppHeader";
import { Number } from "@/components/Format/Number";
import { ManagedTopicLabel } from "@/components/ManagedTopicLabel";
import { NavItemLink } from "@/components/Navigation/NavItemLink";
import {
  Label,
  Nav,
  NavList,
  PageNavigation,
  Spinner,
} from "@/libs/patternfly/react-core";
import { Skeleton } from "@patternfly/react-core";
import { ReactNode, Suspense } from "react";

export type TopicHeaderProps = {
  params: KafkaTopicParams;
  showRefresh?: boolean;
};

export function TopicHeader({
  params: { kafkaId, topicId },
  showRefresh,
}: TopicHeaderProps) {
  const portal = <div key={"topic-header-portal"} id={"topic-header-portal"} />;
  return (
    <Suspense
      fallback={
        <AppHeader
          title={<Skeleton width="35%" />}
          showRefresh={showRefresh}
          navigation={
            <PageNavigation>
              <Nav aria-label="Group section navigation" variant="tertiary">
                <NavList>
                  <NavItemLink
                    url={`/kafka/${kafkaId}/topics/${topicId}/messages`}
                  >
                    Messages&nbsp;
                    <Label isCompact={true}>
                      <Spinner size="sm" />
                    </Label>
                  </NavItemLink>
                  <NavItemLink
                    url={`/kafka/${kafkaId}/topics/${topicId}/partitions`}
                  >
                    Partitions&nbsp;
                    <Label isCompact={true}>
                      <Spinner size="sm" />
                    </Label>
                  </NavItemLink>
                  <NavItemLink
                    url={`/kafka/${kafkaId}/topics/${topicId}/consumer-groups`}
                  >
                    Consumer groups&nbsp;
                    <Label isCompact={true}>
                      <Spinner size="sm" />
                    </Label>
                  </NavItemLink>
                  {/*
                  <NavItemLink
                    url={`/kafka/${kafkaId}/topics/${topicId}/schema-registry`}
                  >
                    Schema
                  </NavItemLink>
*/}
                  <NavItemLink
                    url={`/kafka/${kafkaId}/topics/${topicId}/configuration`}
                  >
                    Configuration
                  </NavItemLink>
                </NavList>
              </Nav>
            </PageNavigation>
          }
          actions={[portal]}
        />
      }
    >
      <ConnectedTopicHeader
        params={{ kafkaId, topicId }}
        portal={portal}
        showRefresh={showRefresh}
      />
    </Suspense>
  );
}

async function ConnectedTopicHeader({
  params: { kafkaId, topicId },
  showRefresh,
  portal,
}: {
  params: KafkaTopicParams;
  showRefresh?: boolean;
  portal: ReactNode;
}) {
  const response = await getTopic(kafkaId, topicId);

  if (response.errors) {
    return <AppHeader title={ `Topic ${topicId}` } />;
  }

  const topic = response.payload;

  return (
    <AppHeader
      title={
        <>
          {topic?.attributes.name}
          {topic?.meta?.managed === true && <ManagedTopicLabel />}
        </>
      }
      showRefresh={showRefresh}
      navigation={
        <PageNavigation>
          <Nav aria-label="Group section navigation" variant="tertiary">
            <NavList>
              <NavItemLink url={`/kafka/${kafkaId}/topics/${topicId}/messages`}>
                Messages&nbsp;
              </NavItemLink>
              <NavItemLink
                url={`/kafka/${kafkaId}/topics/${topicId}/partitions`}
              >
                Partitions&nbsp;
                <Label isCompact={true}>
                  <Suspense fallback={<Spinner size="sm" />}>
                    <Number value={topic?.attributes.numPartitions} />
                  </Suspense>
                </Label>
              </NavItemLink>
              <NavItemLink
                url={`/kafka/${kafkaId}/topics/${topicId}/consumer-groups`}
              >
                Consumer groups&nbsp;
                <Label isCompact={true}>
                  <Number
                    value={topic?.relationships.consumerGroups?.data.length ?? 0}
                  />
                </Label>
              </NavItemLink>
              {/*
              <NavItemLink
                url={`/kafka/${kafkaId}/topics/${topicId}/schema-registry`}
              >
                Schema
              </NavItemLink>
              */}
              <NavItemLink
                url={`/kafka/${kafkaId}/topics/${topicId}/configuration`}
              >
                Configuration
              </NavItemLink>
            </NavList>
          </Nav>
        </PageNavigation>
      }
      actions={[portal]}
    />
  );
}
