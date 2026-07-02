import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { Observable, Subject } from 'rxjs';

export interface ProgressEvent {
  step: string;
  percent: number;
  message: string;
}

@Injectable()
export class SseService {
  private readonly sessions = new Map<string, Subject<ProgressEvent>>();
  private readonly abortControllers = new Map<string, AbortController>();

  createSession(sessionId: string): Subject<ProgressEvent> {
    const subject = new Subject<ProgressEvent>();
    this.sessions.set(sessionId, subject);
    this.abortControllers.set(sessionId, new AbortController());
    return subject;
  }

  sendProgress(sessionId: string, event: ProgressEvent) {
    const subject = this.sessions.get(sessionId);
    if (subject) {
      subject.next(event);
    }
  }

  completeSession(sessionId: string) {
    const subject = this.sessions.get(sessionId);
    if (subject) {
      subject.complete();
    }
    this.cleanup(sessionId);
  }

  failSession(sessionId: string, error: string) {
    const subject = this.sessions.get(sessionId);
    if (subject) {
      subject.error(new Error(error));
    }
    this.cleanup(sessionId);
  }

  isCancelled(sessionId: string): boolean {
    const controller = this.abortControllers.get(sessionId);
    return controller?.signal.aborted || false;
  }

  cancel(sessionId: string) {
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
    }
    this.failSession(sessionId, 'Análisis cancelado por el usuario');
  }

  getSubject(sessionId: string): Subject<ProgressEvent> | undefined {
    return this.sessions.get(sessionId);
  }

  private cleanup(sessionId: string) {
    this.sessions.delete(sessionId);
    this.abortControllers.delete(sessionId);
  }
}
