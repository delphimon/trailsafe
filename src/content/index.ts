import library from "./library.json";
export type Block = {
  type: string;
  text?: string;
  title?: string;
  critical?: boolean;
  items?: string[];
  url?: string;
};
export type Article = {
  id: string;
  title: string;
  subtitle: string;
  blocks: Block[];
  contentVersion: string;
  reviewStatus: string;
  sources: string[];
};
export const articles = library.ARTICLES as Record<string, Article>;
export const topics = [
  ...library.GUIDE_TOPICS,
  {
    title: "Injured or sick",
    sub: "When someone can’t safely self-rescue",
    kind: "screen",
    target: "g-injured",
    keywords: "injury injured first aid sick illness medical",
  },
  {
    title: "Other emergency",
    sub: "A simple place to start",
    kind: "screen",
    target: "g-other",
    keywords: "other emergency help",
  },
];

export type TopicGroup = {
  label: string;
  topics: typeof topics;
};

export const topicGroups: TopicGroup[] = [
  {
    label: "🚨 Emergency Response",
    topics: topics.filter(t => ["g-lost", "g-injured", "g-stranded", "g-missing-split", "g-other", "g-waiting"].includes(t.target)),
  },
  {
    label: "📞 Getting Help",
    topics: topics.filter(t => ["calling-help", "signaling", "satellite-plb", "backcountry-radio"].includes(t.target)),
  },
  {
    label: "🌡️ Environmental Hazards",
    topics: topics.filter(t => ["cold-hypothermia", "heat", "winter-safety", "wildlife", "river-crossings"].includes(t.target)),
  },
  {
    label: "🎒 Preparation",
    topics: topics.filter(t => ["ten-essentials", "clothing-layering", "phone-smart", "unexpected-overnight", "children-family", "lessons-learned"].includes(t.target)),
  },
];
