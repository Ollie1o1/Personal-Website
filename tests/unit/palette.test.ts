import { describe, it, expect } from 'vitest';
import { filterCommands, type Command } from '../../src/lib/palette';

const cmds: Command[] = [
  { id: 'work', label: 'Selected work', hint: 'Section', href: '/#work' },
  { id: 'nes', label: 'NES Emulator', hint: 'Case study', href: '/work/nes-emulator/' },
  { id: 'resume', label: 'Resume (PDF)', hint: 'Download', href: '/resume.pdf' },
  { id: 'theme', label: 'Toggle theme', hint: 'Action', action: 'theme' },
];

describe('filterCommands', () => {
  it('returns all for an empty query', () => {
    expect(filterCommands(cmds, '  ')).toHaveLength(4);
  });
  it('matches case-insensitive subsequences', () => {
    expect(filterCommands(cmds, 'nes')[0].id).toBe('nes');
    expect(filterCommands(cmds, 'rsm').map((c) => c.id)).toContain('resume');
  });
  it('ranks prefix matches first', () => {
    expect(filterCommands(cmds, 't')[0].id).toBe('theme');
  });
  it('searches hints too', () => {
    expect(filterCommands(cmds, 'case').map((c) => c.id)).toEqual(['nes']);
  });
  it('returns empty for no match', () => {
    expect(filterCommands(cmds, 'zzz')).toEqual([]);
  });
});
