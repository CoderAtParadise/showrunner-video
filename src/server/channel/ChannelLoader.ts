import {
  NetworkConnection,
  Service,
  //@ts-ignore
} from "@coderatparadise/showrunner-network";
//@ts-ignore
import { getCodec } from "@coderatparadise/showrunner-network/codec";
//@ts-ignore
import { FrameRate } from "@coderatparadise/showrunner-time";
import fs from "fs/promises";
import { listManagers, registerManager } from "./ManagerRegistry";
import { VideoManager } from "./VideoManager";

type ChannelInfo = {
  channel: string;
  name: string;
  frameRate: FrameRate;
  connections: NetworkConnection[];
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
      for (const cinfo of info.connections) {
        const type = cinfo.type;
        const connection = getCodec(`connection:${type}`).deserialize(
          cinfo,
          undefined,
          manager
        ) as Service<unknown, NetworkConnection>;
        manager.addConnection(type, connection);
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
    const connections: NetworkConnection[] = [];
    manager.connectionTypes().forEach((value: string) => {
      connections.push(
        ...manager
          .connections(value)!
          .map<NetworkConnection>(
            (value: Service<unknown, NetworkConnection>) =>
              getCodec(`connection:${value}`).serialize(
                value
              ) as NetworkConnection
          )
      );
    });
    buffer.push({
      channel: manager.id(),
      name: manager.name(),
      frameRate: manager.frameRate(),
      connections: connections,
    });
  }

  const file = fs.writeFile("./channels.json", JSON.stringify(buffer));
  await file;
}
