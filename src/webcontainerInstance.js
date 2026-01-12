import { WebContainer } from '@webcontainer/api';

export let webcontainer = null;

export async function initWebContainer() {
  if (webcontainer) return webcontainer; // prevent double boot
  webcontainer = await WebContainer.boot();
  return webcontainer;
}

