import { Fragment } from "react";
import { Linking } from "react-native";
import { ExternalLink } from "lucide-react-native";
import library from "@/content/library.json";
import { useApp } from "@/state/app";
import { Card, Kicker, Note, Row, Screen } from "@/components/trailsafe/ui";
export default function Resources() {
  const { run } = useApp();
  return (
    <Screen title="Resources" subtitle="Authoritative external sources" back>
      <Note>
        Internet required. These links open your browser; forecasts and
        conditions are not stored by TrailSafe.
      </Note>
      {["local", "conditions", "wildlife", "education"].map((cat) => (
        <Fragment key={cat}>
          <Kicker>{cat[0].toUpperCase() + cat.slice(1)}</Kicker>
          <Card>
            {library.RESOURCES.filter((r) => r.cat === cat).map((r) => (
              <Row
                key={r.url}
                title={r.name}
                subtitle={r.note}
                icon={ExternalLink}
                onPress={() => void run(() => Linking.openURL(r.url))}
              />
            ))}
          </Card>
        </Fragment>
      ))}
    </Screen>
  );
}
