//@ts-ignore
import { FrameRate } from "@coderatparadise/showrunner-time";
import fs from "fs/promises";
import { listManagers, registerManager } from "./ManagerRegistry";
import { VideoManager } from "./VideoManager";

export type Connection = {
  type: string;
  address: string;
  port: number;
  channel?: string;
  maxRetries: number;
  timeBetweenRetries: number[];
};

type ChannelInfo = {
  channel: string;
  name: string;
  frameRate: FrameRate;
  connections: Connection[];
};

export async function loadChannels(): Promise<void> {
  let fd;
  try {
    fd = await fs.open("./channels.json");
    const channels = JSON.parse((await fd.readFile()).toString());
    for (const channel of channels) {
      const info = channel as ChannelInfo;
      const manager = new VideoManager(info.channel, {
        name: info.name,
        frameRate: info.frameRate,
      });
      for (const connection of info.connections) {
        manager.addConnection(connection);
      }
      registerManager(manager);
      setInterval(() => {
        manager.update();
      }, 1000 / 30);
    }
  } finally {
    await fd?.close();
  }
}

export async function saveChannels(): Promise<void> {
  const buffer: ChannelInfo[] = [];
  for (const manager of await listManagers()) {
    const info: ChannelInfo = {
      channel: manager.id(),
      name: manager.name(),
      frameRate: manager.frameRate(),
      connections: manager.connections(),
    };
    buffer.push(info);
  }

  const file = fs.writeFile("./channels.json", JSON.stringify(buffer));
  await file;
}
