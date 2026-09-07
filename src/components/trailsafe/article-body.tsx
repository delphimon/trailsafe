import { Linking, View } from "react-native";
import { ExternalLink } from "lucide-react-native";
import { Block } from "@/content";
import { useApp } from "@/state/app";
import { Callout, C, fonts, Kicker, Note, Row, T } from "./ui";
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  const { run } = useApp();
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "callout")
          return (
            <Callout key={i} title={b.title} critical={b.critical}>
              {b.text}
            </Callout>
          );
        if (b.type === "heading") return <Kicker key={i}>{b.text}</Kicker>;
        if (b.type === "note")
          return (
            <View key={i} style={{ marginBottom: 16 }}>
              <Note>{b.text}</Note>
            </View>
          );
        if (b.type === "link")
          return (
            <Row
              key={i}
              title={b.text || "Source"}
              icon={ExternalLink}
              onPress={() => void run(() => Linking.openURL(b.url!))}
            />
          );
        if (b.type === "steps" || b.type === "list")
          return (
            <View key={i} style={{ marginBottom: 16 }}>
              {b.items?.map((item, j) => (
                <View
                  key={j}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    paddingVertical: 11,
                    borderBottomWidth: 1,
                    borderBottomColor: C.line,
                  }}
                >
                  {b.type === "steps" ? (
                    <View
                      style={{
                        width: 25,
                        height: 25,
                        backgroundColor: C.forest,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <T
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 12,
                          color: "white",
                        }}
                      >
                        {j + 1}
                      </T>
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 4,
                        backgroundColor: C.green,
                        marginTop: 9,
                        marginLeft: 3,
                      }}
                    />
                  )}
                  <T style={{ flex: 1, fontSize: 14.5, lineHeight: 23 }}>
                    {item}
                  </T>
                </View>
              ))}
            </View>
          );
        return (
          <T key={i} style={{ marginBottom: 16 }}>
            {b.text}
          </T>
        );
      })}
    </>
  );
}
