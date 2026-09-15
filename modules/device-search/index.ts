import { requireOptionalNativeModule } from "expo-modules-core";

export type SearchIndexItem = {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  url?: string;
};

interface NativeDeviceSearchModule {
  isAvailable(): Promise<boolean>;
  indexItems(items: SearchIndexItem[]): Promise<void>;
  clearItems(): Promise<void>;
}

const NativeDeviceSearch =
  requireOptionalNativeModule<NativeDeviceSearchModule>("DeviceSearch");

export async function isAvailable(): Promise<boolean> {
  if (NativeDeviceSearch?.isAvailable) {
    try {
      return await NativeDeviceSearch.isAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

export async function indexItems(items: SearchIndexItem[]): Promise<void> {
  if (NativeDeviceSearch?.indexItems) {
    try {
      await NativeDeviceSearch.indexItems(items);
    } catch {
      // Non-fatal if device indexing fails or is unavailable on this platform
    }
  }
}

export async function clearItems(): Promise<void> {
  if (NativeDeviceSearch?.clearItems) {
    try {
      await NativeDeviceSearch.clearItems();
    } catch {
      // Non-fatal
    }
  }
}
