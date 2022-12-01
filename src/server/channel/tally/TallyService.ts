// import {
//   NetworkConnection,
//   Service,
//   ServiceIdentifier,
//   //@ts-ignore
// } from "@coderatparadise/showrunner-network";
// import { VideoManager } from "../VideoManager";

// export type TallyConnection = NetworkConnection & {
//   device: string;
// };

// export class TallyService implements Service {
//   constructor(id: string, manager: VideoManager, connection: TallyConnection) {
//     this.m_id = id;
//     this.m_manager = manager;
//     this.m_connectionInfo = connection;
//   }

//   identifier(): ServiceIdentifier {
//     return `tally:${this.m_id}`;
//   }
//   retry(): { maxRetries: number; timeBetweenRetries: number[] } {
//     return {
//       maxRetries: this.m_connectionInfo.maxRetries,
//       timeBetweenRetries: this.m_connectionInfo.timeBetweenRetries,
//     };
//   }

//   open(retryHandler: (tryCounter:number) => Promise<boolean>): Promise<boolean>
//   {
//     return false;
//   }
//   isOpen: () => boolean;
//   close: () => Promise<boolean>;
//   restart: () => Promise<boolean>;
//   get: () => unknown;
//   config: (newSettings?: unknown) => unknown;
//   data: (id: string, dataid?: string | undefined) => unknown;
//   update: () => void;

//   private m_id: string;
//   private m_manager: VideoManager;
//   //   private m_source;
//   private m_connectionInfo: TallyConnection;
// }
