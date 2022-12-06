import {
  Codec,
  serializeTypes,
  //@ts-ignore
} from "@coderatparadise/showrunner-network/codec";
//@ts-ignore
import { ClockIdentifier } from "@coderatparadise/showrunner-time";

export const CodecDataCurrent: Codec<{
  currentId: ClockIdentifier;
  owner?: ClockIdentifier;
}> = {
  serialize(obj: {
    currentId: ClockIdentifier;
    owner?: ClockIdentifier;
  }): serializeTypes {
    return obj;
  },
  deserialize(json: serializeTypes): {
    currentId: ClockIdentifier;
    owner?: ClockIdentifier;
  } {
    return json as {
      currentId: ClockIdentifier;
      owner?: ClockIdentifier;
    };
  },
};
