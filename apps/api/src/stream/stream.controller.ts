import { Controller, Param, Sse, MessageEvent } from "@nestjs/common";
import { Observable } from "rxjs";
import { StreamService } from "./stream.service";

@Controller("stream")
export class StreamController {
  constructor(private svc: StreamService) {}

  @Sse(":sessionId")
  sse(@Param("sessionId") sessionId: string): Observable<MessageEvent> {
    return this.svc.streamSession(sessionId);
  }
}
