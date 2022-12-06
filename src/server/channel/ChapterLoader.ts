import fs from "fs/promises";
import {
  ChapterClock,
  IClockManager,
  IClockSource,
  SMPTE,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";

export async function loadChapters(
  clock: IClockSource<any>,
  manager: IClockManager
): Promise<boolean> {
  let fd;
  try {
    fd = await fs.open(
      `./data/${clock.identifier().session()}/chapters/${clock
        .identifier()
        .id()}.json`
    );
    const chapters = JSON.parse((await fd.readFile()).toString()) as {
      id: string;
      settings: { name: string; time: string };
    }[];
    for (const cdata of chapters) {
      const settings = {
        name: cdata.settings.name,
        time: new SMPTE(cdata.settings.time),
      };
      const chapter = new ChapterClock(
        manager,
        clock.identifier(),
        settings,
        cdata.id
      );
      manager.add(chapter);
      await clock.addChapter(chapter.identifier());
    }
    return await AsyncUtils.booleanReturn(true);
  } catch (err) {
    return await AsyncUtils.booleanReturn(false);
  } finally {
    await fd?.close();
  }
}

export async function saveChapters(
  clock: IClockSource<any>,
  manager: IClockManager
): Promise<void> {
  const buffer: {
    id: string;
    settings: { name: string; time: SMPTE };
  }[] = [];

  for (const cid of await clock.chapters()) {
    const chapter = (await manager.request(cid)) as unknown as ChapterClock;
    if (chapter) buffer.push({ id: cid.id(), settings: chapter.config() });
  }
  await fs.mkdir(`./data/${clock.identifier().session()}/chapters`, {
    recursive: true,
  });
  const file = fs.writeFile(
    `./data/${clock.identifier().session()}/chapters/${clock
      .identifier()
      .id()}.json`,
    JSON.stringify(buffer)
  );
  await file;
}
