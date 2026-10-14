import { requireOptionalNativeModule } from "expo";

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

export async function indexItems(items: SearchIndexItem[]): Promise<boolean> {
  if (!NativeDeviceSearch?.indexItems || !(await isAvailable())) return false;
  try {
    await NativeDeviceSearch.indexItems(items);
    return true;
  } catch {
    return false;
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
