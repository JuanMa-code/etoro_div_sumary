import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { useKeyboardShortcuts, getKeyboardShortcutsHelp } from './useKeyboardShortcuts';

const press = (key: string, modifiers: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(document, { key, ...modifiers });

describe('useKeyboardShortcuts', () => {
  it('runs the action whose key and modifiers match', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: '1', altKey: true, action, description: 'uno' }]));

    press('1', { altKey: true });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('ignores the key when the modifiers differ', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: '1', altKey: true, action, description: 'uno' }]));

    press('1');
    press('1', { ctrlKey: true });
    press('1', { altKey: true, shiftKey: true });
    expect(action).not.toHaveBeenCalled();
  });

  it('compares keys case-insensitively and prevents the default action', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'K', ctrlKey: true, action, description: 'k' }]));

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    document.dispatchEvent(event);
    expect(action).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('removes the listener on unmount', () => {
    const action = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([{ key: '2', altKey: true, action, description: 'dos' }])
    );
    unmount();

    press('2', { altKey: true });
    expect(action).not.toHaveBeenCalled();
  });

  it('uses the latest shortcuts after a rerender', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ action }) => useKeyboardShortcuts([{ key: '3', altKey: true, action, description: 'tres' }]),
      { initialProps: { action: first } }
    );
    rerender({ action: second });

    press('3', { altKey: true });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('getKeyboardShortcutsHelp', () => {
  it('lists every shortcut with its modifiers, one per line', () => {
    const help = getKeyboardShortcutsHelp([
      { key: '1', altKey: true, action: () => {}, description: 'Dashboard' },
      { key: 's', ctrlKey: true, shiftKey: true, action: () => {}, description: 'Guardar' },
    ]);
    expect(help).toBe('Alt + 1: Dashboard\nCtrl + Shift + S: Guardar');
  });
});
