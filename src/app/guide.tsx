import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { BookOpen, ExternalLink } from "lucide-react-native";
import { articles, topics } from "@/content";
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
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = topics.filter((t) =>
    [
      t.title,
      t.sub,
      t.keywords,
      JSON.stringify(articles[t.target]?.blocks || []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
  return (
    <Screen title="Safety Guide" subtitle="Short, offline reference articles">
      <T style={{ marginBottom: 18 }}>
        The things KCESAR volunteers wish people knew before they needed
        rescuing.
      </T>
      <Field
        label="Search safety topics"
        placeholder="Try “water”, “cold”, or “radio”"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      <Note>{results.length} topics · Available offline</Note>
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
