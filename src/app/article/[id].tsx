import { View, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Clock, Users, ExternalLink } from "lucide-react-native";
import { articles } from "@/content";
import { ArticleBody } from "@/components/trailsafe/article-body";
import { EmergencyActions } from "@/components/trailsafe/emergency-actions";
import {
  Button,
  Card,
  Kicker,
  Note,
  Row,
  Screen,
  T,
} from "@/components/trailsafe/ui";
import { useApp } from "@/state/app";
export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = articles[id];
  const { run } = useApp();
  if (id === "g-missing-split")
    return (
      <Screen title="Missing or Overdue" back>
        <T style={{ marginBottom: 16 }}>Which describes your situation?</T>
        <Row
          title="They were with me and now are separated or missing"
          icon={Users}
          onPress={() =>
            router.push({
              pathname: "/article/[id]",
              params: { id: "g-party-missing" },
            })
          }
        />
        <Row
          title="They were expected back and didn’t return"
          icon={Clock}
          onPress={() =>
            router.push({
              pathname: "/article/[id]",
              params: { id: "g-overdue" },
            })
          }
        />
      </Screen>
    );
  if (!article)
    return (
      <Screen title="Guide not found" back>
        <Button
          label="Open Safety Guide"
          onPress={() => router.replace("/guide")}
        />
      </Screen>
    );
  return (
    <Screen title={article.title} subtitle={article.subtitle || undefined} back>
      <View style={{ marginBottom: 18 }}>
        <EmergencyActions compact situation={article.title} />
      </View>
      {id === "g-overdue" && (
        <Note>
          The location in a text draft is your phone’s location, not the missing
          person’s. Give 911 the person’s last known location and trip plan.
        </Note>
      )}
      <ArticleBody blocks={article.blocks} />
      <Kicker>Content & sources</Kicker>
      <Card>
        <Note>
          Bundled content · {article.contentVersion}
          {"\n"}
          {article.reviewStatus}. Follow dispatcher or rescuer instructions over
          this app.
        </Note>
        {article.sources.map((url) => (
          <Row
            key={url}
            title={new URL(url).hostname.replace("www.", "")}
            subtitle="Source reference · Internet required"
            icon={ExternalLink}
            onPress={() => void run(() => Linking.openURL(url))}
          />
        ))}
      </Card>
    </Screen>
  );
}
