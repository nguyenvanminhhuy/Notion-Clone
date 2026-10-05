/** Debounces edits and serializes writes so a slow request cannot overwrite a later edit. */
export class Autosave {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: string | null = null;
  private queue: Promise<void> = Promise.resolve();
  private disposed = false;
  private revision = 0;
  private error: unknown = null;

  constructor(
    private save: (content: string) => Promise<void>,
    private saving: (value: boolean) => void,
    private failed: (error: unknown) => void,
    private delay = 1000,
  ) {}

  schedule(content: string) {
    if (this.disposed) return;
    this.pending = content;
    this.revision++;
    this.saving(true);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush(); }, this.delay);
  }

  flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.pending === null) return this.queue;
    const content = this.pending;
    const revision = this.revision;
    this.pending = null;
    this.queue = this.queue.then(async () => {
      try { await this.save(content); this.error = null; }
      catch (error) { this.error = error; this.failed(error); }
      finally {
        if (!this.disposed && revision === this.revision && this.pending === null) this.saving(false);
      }
    });
    return this.queue;
  }

  dispose(): Promise<void> {
    this.disposed = true;
    return this.flush();
  }

  async settle(): Promise<void> {
    await this.flush();
    if (this.error) throw this.error;
  }
}
