import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { OpenAIProvider } from '../providers/openai.provider';

type StreamEvent =
  | { type: 'status'; provider: string; status: 'typing'|'streaming'|'complete'|'error'; error?: string }
  | { type: 'delta'; provider: string; text: string }
  | { type: 'done'; provider: string; usage?: { prompt: number; completion: number }; costUsd?: number; latencyMs?: number };

@Injectable()
export class StreamService {
  constructor(private prisma: PrismaService) {}

  streamSession(sessionId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      // run the async flow but do not make the executor async
      (async () => {
        const session = await this.prisma.session.findUnique({
          where: { id: sessionId },
          // we need prompt on the session (see section B)
          select: { id: true, createdAt: true, prompt: true },
        });

        const emit = (e: StreamEvent) => subscriber.next({ data: e });

        if (!session) {
          emit({ type: 'status', provider: 'system', status: 'error', error: 'session not found' });
          return subscriber.complete();
        }

        const providers = [
          new OpenAIProvider('gpt-4o-mini'),
          new OpenAIProvider('gpt-4o'),
        ];

        try {
          await Promise.all(
            providers.map(async (p) => {
              emit({ type: 'status', provider: p.model, status: 'typing' });

              let acc = '';
              const result = await p.stream(session.prompt, (delta) => {
                acc += delta;
                emit({ type: 'delta', provider: p.model, text: delta });
              });

              await this.prisma.modelRun.create({
                data: {
                  sessionId: session.id,
                  model: p.model,
                  prompt: session.prompt,      // required by your current Prisma types
                  output: acc,
                  tokens: (result.usage?.prompt ?? 0) + (result.usage?.completion ?? 0),
                  cost: result.costUsd,
                },
              });

              emit({ type: 'status', provider: p.model, status: 'complete' });
              emit({ type: 'done', provider: p.model, ...result });
            })
          );
        } catch (err: any) {
          emit({ type: 'status', provider: 'system', status: 'error', error: err?.message ?? String(err) });
        } finally {
          subscriber.complete();
        }
      })();
    });
  }
}
