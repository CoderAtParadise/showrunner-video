//@ts-ignore
import { SMPTE } from "@coderatparadise/showrunner-time";
import { VideoManager } from "../VideoManager";

export type AmpMetadata = {
  ampid: string;
  duration: SMPTE;
};

export function extractId(ampid: string) {
  const [, name, meta] = ampid.split(
    /([A-Za-z0-9_,()'`!;{}$@%#+=. -]+)(?:\[(.*)\])?/
  );
  const id = cleanId(name.toLowerCase());
  return [id, name, meta];
}

export function extractMetadata(
  ampid: string,
  duration: SMPTE,
  manager: VideoManager
): { id: string; name: string; out: SMPTE; in: SMPTE; metadata: AmpMetadata } {
  let out = duration;
  let cin = new SMPTE(0);
  const [id, name, meta] = extractId(ampid);
  const [_stest, _in] = extractInMetadata(meta,manager);
  const [_etest, _out] = extractOutMetadata(meta,manager);
  if (_etest) out = _out || new SMPTE();
  if (_stest) cin = _in || new SMPTE();
  return {
    id: id,
    name: name,
    in: cin,
    out: out,
    metadata: { ampid: ampid, duration: duration },
  };
}
/*eslint-disable no-unused-vars*/
function extractOutMetadata(metadata: string | undefined,
  manager: VideoManager): [boolean, SMPTE?] {
  if (metadata) {
    const time = metadata.match(
      /(?:out-((?:[012][0-9]).(?:[0-9]{2}).(?:[0-9]{2})(?:\.|,)(?:[0-9]{2})?))/
    );
    console.log(time);
    if (time !== null) {
      console.log(time);
      let fixed = time[1].split(/[.]/);
      fixed = fixed.join(":").split(/[,]/);
      console.log(fixed);
      return [true, new SMPTE(fixed.join(),manager.frameRate())];
    }
  }
  return [false];
}

function extractInMetadata(
  metadata: string | undefined,
  manager: VideoManager
): [boolean, SMPTE?] {
  if (metadata) {
    const time = metadata.match(
      /(?:in-((?:[012][0-9]).(?:[0-9]{2}).(?:[0-9]{2})(?:\.|,)(?:[0-9]{2})?))/
    );
    if (time !== null) {
      const fixed = time[1].split(/[.]/).join(":").split(/[,]/).join(";");
      return [true, new SMPTE(fixed, manager.frameRate())];
    }
  }
  return [false];
}

function cleanId(s: string): string {
  return s.replace(/[ ,'-.]+/g, "");
}
