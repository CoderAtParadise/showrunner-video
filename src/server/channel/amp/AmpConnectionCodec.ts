import {
  Codec,
  serializeTypes,
  //@ts-ignore
} from "@coderatparadise/showrunner-network/codec";
import { VideoManager } from "../VideoManager";
import { AmpChannelService, AmpConnection } from "./AmpChannelService";

export const AmpConnectionCodec: Codec<AmpChannelService> = {
  serialize(obj: AmpChannelService): serializeTypes {
    return obj.config();
  },
  deserialize(
    json: serializeTypes,
    _obj,
    additional?: object
  ): AmpChannelService {
    const connection = json as AmpConnection;
    const manager = additional as VideoManager;
    const index =
      (additional as VideoManager).connections(connection.type)?.length || 0;
    const id = `${connection.type}:${manager.identifier().session}_${index}`;
    return new AmpChannelService(id, manager, connection);
  },
};
