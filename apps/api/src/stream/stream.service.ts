import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { PrismaService } from "../prisma.service";
import { OpenAIProvider } from "../providers/openai.provider";

@Injectable()
export class StreamService {
  constructor(private prisma: PrismaService) {}

  streamSession(sessionId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>(async (subscriber) => {
      const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) {
        subscriber.next({ data: { type: "status", status: "error", provider: "system", error: "session not found" } });
        return subscriber.complete();
      }

      // for now: two OpenAI models; you can swap one later for Anthropic
      const providers = [
        new OpenAIProvider("gpt-4o-mini"),
        new OpenAIProvider("gpt-4o")
      ];

      await Promise.all(providers.map(async (p) => {
        subscriber.next({ data: { type:"status", provider:p.name+":"+p.model, status:"typing" } });

        let acc = "";
        try {
          const result = await p.stream(session.prompt, (delta) => {
            acc += delta;
            subscriber.next({ data: { type:"delta", provider:p.name+":"+p.model, text: delta } });
          });

          // persist minimal run row (optional: expand columns per your schema)
          await this.prisma.modelRun.create({
            data: {
              sessionId,
              provider: p.name,
              model: p.model,
              prompt: session.prompt,
              output: acc,
              tokens: result.usage.prompt + result.usage.completion,
              cost: result.costUsd
            }
          });

          subscriber.next({ data: { type:"status", provider:p.name+":"+p.model, status:"complete" } });
          subscriber.next({ data: { type:"done", provider:p.name+":"+p.model, ...result } });
        } catch (e:any) {
          subscriber.next({ data: { type:"status", provider:p.name+":"+p.model, status:"error", error: e?.message ?? String(e) } });
        }
      }));

      subscriber.complete();
    });
  }
}
