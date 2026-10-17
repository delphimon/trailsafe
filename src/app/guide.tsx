import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BookOpen, ExternalLink } from "lucide-react-native";
import { topicGroups } from "@/content";
import { searchGuideTopics } from "@/lib/search-indexing";
import {
  Card,
  Field,
  Kicker,
  Note,
  Row,
  Screen,
  T,
} from "@/components/trailsafe/ui";
export default function Guide() {
  const params = useLocalSearchParams<{ search?: string; q?: string }>();
  const deepLinkQuery =
    (typeof params.search === "string"
      ? params.search
      : typeof params.q === "string"
        ? params.q
        : "") || "";
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const query = userQuery ?? deepLinkQuery;

  const results = searchGuideTopics(query);
  return (
    <Screen title="Safety Guide" subtitle="Short, offline reference articles">
      <T style={{ marginBottom: 18 }}>
        The things search-and-rescue volunteers wish people knew before they
        needed rescuing.
      </T>
      <Field
        label="Search safety topics"
        placeholder="Try “water”, “cold”, or “radio”"
        value={query}
        onChangeText={setUserQuery}
        autoCorrect={false}
      />
      <Note>{results.length} topics · Available offline</Note>
      {!query ? (
        topicGroups.map((group) => (
          <View key={group.label}>
            <Kicker>{group.label}</Kicker>
            <Card style={{ paddingVertical: 0 }}>
              {group.topics.map((t) => (
                <Row
                  key={t.target}
                  title={t.title}
                  subtitle={t.sub}
                  icon={BookOpen}
                  onPress={() =>
                    router.push({
                      pathname: "/article/[id]",
                      params: { id: t.target },
                    })
                  }
                />
              ))}
            </Card>
          </View>
        ))
      ) : (
        <Card style={{ marginTop: 14, paddingVertical: 0 }}>
          {results.map((t) => (
            <Row
              key={t.target}
              title={t.title}
              subtitle={t.sub}
              icon={BookOpen}
              onPress={() =>
                router.push({
                  pathname: "/article/[id]",
                  params: { id: t.target },
                })
              }
            />
          ))}
        </Card>
      )}
      {!results.length && (
        <View style={{ padding: 24 }}>
          <T>No topics match that search. Try “lost”, “phone”, or “winter”.</T>
        </View>
      )}
      <Kicker>Resources</Kicker>
      <Row
        title="Authoritative external resources"
        subtitle="WTA, NWS, NWAC, WDFW, WSDOT, and more"
        icon={ExternalLink}
        onPress={() => router.push("/resources")}
      />
    </Screen>
  );
}
