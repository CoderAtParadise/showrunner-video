import EventEmitter from "events";
//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import { loadChannels } from "./ChannelLoader";
import { VideoManager } from "./VideoManager";
//@ts-ignore
import { ManagerIdentifier, ManagerLookup } from "@coderatparadise/showrunner-time";

let ManagerRegistry: Map<string,VideoManager >;

export const ManagerEvents: EventEmitter = new EventEmitter();

export function registerManager(manager: VideoManager) {
  if (!getRegistry().has(manager.identifier().toString())) {
    getRegistry().set(manager.identifier().toString(), manager);
    ManagerEvents.emit("manager.change");
  }
}

export async function listManagers(): Promise<
VideoManager[]
> {
  if (!ManagerRegistry) await loadChannels();
  return Array.from(getRegistry().values());
}

export async function getManager(
  id: ManagerIdentifier
): Promise<VideoManager | undefined> {
  return await AsyncUtils.typeReturn(getRegistry().get(id.toString()));
}

export function removeManager(id: string) {
  ManagerRegistry.delete(id);
  ManagerEvents.emit("manager.change");
}

export function getRegistry() {
  if (ManagerRegistry) return ManagerRegistry;
  ManagerRegistry = new Map<ManagerLookup, VideoManager>();
  return ManagerRegistry;
}
