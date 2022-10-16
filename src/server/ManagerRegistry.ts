import EventEmitter from "events";
import { VideoManager } from "./VideoManager";
//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import { loadChannels } from "./ChannelLoader";

let ManagerRegistry: Map<string, VideoManager>;

export const ManagerEvents: EventEmitter = new EventEmitter();

export function registerManager(manager: VideoManager) {
  if (!getRegistry().has(manager.id())) {
    getRegistry().set(manager.id(), manager);
    ManagerEvents.emit("manager.change");
  }
}

export async function listManagers(): Promise<VideoManager[]> {
  if (!ManagerRegistry) await loadChannels();
  return Array.from(getRegistry().values());
}

export async function getManager(
  id: string
): Promise<VideoManager | undefined> {
  return await AsyncUtils.typeReturn(getRegistry().get(id));
}

export function removeManager(id: string) {
  ManagerRegistry.delete(id);
  ManagerEvents.emit("manager.change");
}

export function getRegistry() {
  if (ManagerRegistry) return ManagerRegistry;
  ManagerRegistry = new Map<string, VideoManager>();
  return ManagerRegistry;
}
