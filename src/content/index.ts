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
