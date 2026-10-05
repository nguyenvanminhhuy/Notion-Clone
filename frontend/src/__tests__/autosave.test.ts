import { afterEach, describe, expect, it, vi } from 'vitest';
import { Autosave } from '../features/editor/autosave';

afterEach(() => vi.useRealTimers());
describe('Editor autosave', () => {
  it('debounces edits and awaits persistence before clearing Saving', async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    const save = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const saving = vi.fn();
    const autosave = new Autosave(save, saving, vi.fn());
    autosave.schedule('first'); autosave.schedule('latest');
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('latest');
    expect(saving).not.toHaveBeenCalledWith(false);
    finish(); await autosave.flush();
    expect(saving).toHaveBeenLastCalledWith(false);
  });

  it('serializes writes while edits arrive during a slow save', async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    const save = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }))
      .mockResolvedValue(undefined);
    const autosave = new Autosave(save, vi.fn(), vi.fn());
    autosave.schedule('first'); await vi.advanceTimersByTimeAsync(1000);
    autosave.schedule('second'); await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
    finish(); await autosave.flush();
    expect(save.mock.calls.map(([content]) => content)).toEqual(['first', 'second']);
  });

  it('flushes pending navigation saves and handles rejection', async () => {
    vi.useFakeTimers();
    const error = new Error('offline');
    const failed = vi.fn();
    const save = vi.fn().mockRejectedValue(error);
    const autosave = new Autosave(save, vi.fn(), failed);
    autosave.schedule('pending'); await autosave.dispose();
    expect(save).toHaveBeenCalledWith('pending');
    expect(failed).toHaveBeenCalledWith(error);
    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('blocks history restoration if pending content could not be saved', async () => {
    const error = new Error('offline');
    const autosave = new Autosave(vi.fn().mockRejectedValue(error), vi.fn(), vi.fn());
    autosave.schedule('unsaved');
    await expect(autosave.settle()).rejects.toBe(error);
    await autosave.dispose();
  });
});
