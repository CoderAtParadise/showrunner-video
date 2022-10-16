//@ts-ignore
import { SMPTE } from "@coderatparadise/showrunner-time";

export type AmpMetadata = {
  ampid: string;
  duration: SMPTE;
};

export function extractId(ampid: string) {
  const [, name, meta] = ampid.split(/([A-Za-z0-9_,()'`!;{}$@%#+=. -]+)(?:\[(.*)\])?/);
  const id = stripSpaces(name.toLowerCase());
  return [id, name, meta];
}

export function extractMetadata(
  ampid: string,
  duration: SMPTE
): { id: string; name: string; out: SMPTE; in: SMPTE; metadata: AmpMetadata } {
  let out = duration;
  let cin = new SMPTE(0);
  const [id, name, meta] = extractId(ampid);
  const [_stest, _in] = extractInMetadata(meta);
  const [_etest, _out] = extractOutMetadata(meta);
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
function extractOutMetadata(metadata: string): [boolean, SMPTE?] {
  /*const time = metadata.match(
        /(?:out=((?:[012][0-9]):(?:[0-9]{2}):(?:[0-9]{2})(?::|;[0-9]{2})?))/
    );
    if (time !== null) return [true, new SMPTE(time[1])];*/
  return [false];
}

function extractInMetadata(metadata: string): [boolean, SMPTE?] {
  /*const time = metadata.match(
        /(?:in=((?:[012][0-9]):(?:[0-9]{2}):(?:[0-9]{2})(?::|;[0-9]{2})?))/
    );
    if (time !== null) return [true, new SMPTE(time[1])];*/
  return [false];
}

function stripSpaces(s: string): string {
  return s.replace(/\s+/g, "");
}
