import { Redirect } from "expo-router";
/** Preserve existing home links while making preparation the landing screen. */
export default function Index() {
  return <Redirect href="/prepare" />;
}
