"use server";
import { getHeaders } from "@/api/api";
import { getKafkaCluster } from "@/api/kafka/actions";
import {
  describeTopicsQuery,
  NewConfigMap,
  Topic,
  TopicCreateResponse,
  TopicCreateResponseSchema,
  TopicMutateError,
  TopicMutateResponseErrorSchema,
  TopicResponse,
  TopicsResponse,
  TopicsResponseSchema,
  TopicStatus,
} from "@/api/topics/schema";
import { filterUndefinedFromObj } from "@/utils/filterUndefinedFromObj";
import { logger } from "@/utils/logger";
import { getSession, setSession } from "@/utils/session";

const log = logger.child({ module: "topics-api" });

export async function getTopics(
  kafkaId: string,
  params: {
    name?: string;
    id?: string;
    fields?: string;
    status?: TopicStatus[];
    pageSize?: number;
    pageCursor?: string;
    sort?: string;
    sortDir?: string;
    includeHidden?: boolean;
  },
): Promise<TopicsResponse> {
  const sp = new URLSearchParams(
    filterUndefinedFromObj({
      "fields[topics]":
        params.fields ??
        "name,status,visibility,numPartitions,totalLeaderLogBytes,consumerGroups",
      "filter[id]": params.id ? `eq,${params.id}` : undefined,
      "filter[name]": params.name ? `like,*${params.name}*` : undefined,
      "filter[status]":
        params.status && params.status.length > 0
          ? `in,${params.status.join(",")}`
          : undefined,
      "filter[visibility]": params.includeHidden
        ? "in,external,internal"
        : "eq,external",
      "page[size]": params.pageSize,
      "page[after]": params.pageCursor?.startsWith("after:")
        ? params.pageCursor.slice(6)
        : undefined,
      "page[before]": params.pageCursor?.startsWith("before:")
        ? params.pageCursor.slice(7)
        : undefined,
      sort: params.sort
        ? (params.sortDir !== "asc" ? "-" : "") + params.sort
        : undefined,
    }),
  );
  const topicsQuery = sp.toString();
  const url = `${process.env.BACKEND_URL}/api/kafkas/${kafkaId}/topics?${topicsQuery}&`;
  const res = await fetch(url, {
    headers: await getHeaders(),
    next: {
      tags: ["topics"],
    },
  });
  log.debug({ url }, "getTopics");
  const rawData = await res.json();
  log.trace({ url, rawData }, "getTopics response");
  return TopicsResponseSchema.parse(rawData);
}

export async function getTopic(
  kafkaId: string,
  topicId: string,
): Promise<Topic | null> {
  const url = `${process.env.BACKEND_URL}/api/kafkas/${kafkaId}/topics/${topicId}?${describeTopicsQuery}`;
  const res = await fetch(url, {
    headers: await getHeaders(),
    next: {
      tags: [`topic-${topicId}`],
    },
  });
  const rawData = await res.json();
  log.trace(rawData, "getTopic");
  try {
    return TopicResponse.parse(rawData).data;
  } catch {
    return null;
  }
}

export async function createTopic(
  kafkaId: string,
  name: string,
  numPartitions: number,
  replicationFactor: number,
  configs: NewConfigMap,
  validateOnly = false,
): Promise<TopicCreateResponse> {
  const url = `${process.env.BACKEND_URL}/api/kafkas/${kafkaId}/topics`;
  const body = {
    meta: {
      validateOnly,
    },
    data: {
      type: "topics",
      attributes: {
        name,
        numPartitions,
        replicationFactor,
        configs: filterUndefinedFromObj(configs),
      },
    },
  };
  log.debug({ url, body }, "calling createTopic");
  const res = await fetch(url, {
    headers: await getHeaders(),
    method: "POST",
    body: JSON.stringify(body),
  });
  const rawData = await res.json();
  log.debug({ url, rawData }, "createTopic response");
  const response = TopicCreateResponseSchema.parse(rawData);
  log.debug(response, "createTopic response parsed");
  return response;
}

export async function updateTopic(
  kafkaId: string,
  topicId: string,
  numPartitions?: number,
  replicationFactor?: number,
  configs?: NewConfigMap,
): Promise<boolean | TopicMutateError> {
  const url = `${process.env.BACKEND_URL}/api/kafkas/${kafkaId}/topics/${topicId}`;
  const body = {
    data: {
      type: "topics",
      id: topicId,
      attributes: {
        numPartitions,
        replicationFactor,
        configs: filterUndefinedFromObj(configs || {}),
      },
    },
  };
  log.debug({ url, body }, "calling updateTopic");
  const res = await fetch(url, {
    headers: await getHeaders(),
    method: "PATCH",
    body: JSON.stringify(body),
  });
  log.debug({ status: res.status }, "updateTopic response");
  try {
    if (res.status === 204) {
      return true;
    } else {
      const rawData = await res.json();
      return TopicMutateResponseErrorSchema.parse(rawData);
    }
  } catch (e) {
    log.error(e, "updateTopic unknown error");
  }
  return false;
}

export async function deleteTopic(
  kafkaId: string,
  topicId: string,
): Promise<boolean> {
  const url = `${process.env.BACKEND_URL}/api/kafkas/${kafkaId}/topics/${topicId}`;
  log.debug({ url }, "calling deleteTopic");
  const res = await fetch(url, {
    headers: await getHeaders(),
    method: "DELETE",
  });
  try {
    const success = res.status === 204;
    if (success) {
      log.debug({ url }, "deleteTopic success");
    }
    return success;
  } catch (e) {
    log.error({ err: e, url }, "deleteTopic unknown error");
  }
  return false;
}

type ViewedTopicsSession = { viewedTopics: ViewedTopic[] | undefined };
export type ViewedTopic = {
  kafkaId: string;
  kafkaName: string;
  topicId: string;
  topicName: string;
};

export async function getViewedTopics(): Promise<ViewedTopic[]> {
  log.debug("getViewedTopics");
  const recentTopicsSession =
    await getSession<ViewedTopicsSession>("recent-topics");
  log.trace(recentTopicsSession, "getViewedTopics session");
  return recentTopicsSession.viewedTopics || [];
}

export async function setTopicAsViewed(kafkaId: string, topicId: string) {
  log.debug({ kafkaId, topicId }, "setTopicAsViewed");
  const cluster = await getKafkaCluster(kafkaId);
  const topic = await getTopic(kafkaId, topicId);
  const viewedTopics = await getViewedTopics();
  if (cluster && topic) {
    const viewedTopic: ViewedTopic = {
      kafkaId,
      kafkaName: cluster.attributes.name,
      topicId,
      // name is included in the `fields[topics]` param list so we are sure it is present
      topicName: topic.attributes.name!,
    };
    if (viewedTopics.find((t) => t.topicId === viewedTopic.topicId)) {
      log.trace(
        { kafkaId, topicId },
        "setTopicAsViewed: topic was already in the list, ignoring",
      );
      return viewedTopics;
    }
    log.trace(
      { kafkaId, topicId },
      "setTopicAsViewed: adding topic to the list",
    );
    const updatedViewedTopics = [viewedTopic, ...viewedTopics].slice(0, 5);
    await setSession<ViewedTopicsSession>("recent-topics", {
      viewedTopics: updatedViewedTopics,
    });
    log.trace(updatedViewedTopics, "setTopicAsViewed: updated list");
    return updatedViewedTopics;
  } else {
    log.trace({ topic, cluster }, "setTopicAsViewed: invalid topic/cluster");
    return viewedTopics;
  }
}
