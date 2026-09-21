import { describe, it, expect } from 'vitest';
import { getNameByLongName, getLongNameByName, getAllCompanies, searchCompanies } from './Parser';

describe('getNameByLongName', () => {
  it('matches the long name case-insensitively and ignoring surrounding spaces', () => {
    expect(getNameByLongName('Coca-Cola')).toBe('KO');
    expect(getNameByLongName('  coca-cola ')).toBe('KO');
    expect(getNameByLongName('JOHNSON & JOHNSON')).toBe('JNJ');
  });

  it('returns undefined for unknown or empty names', () => {
    expect(getNameByLongName('Empresa Desconocida SA')).toBeUndefined();
    expect(getNameByLongName('')).toBeUndefined();
  });

  it('does not match partial names', () => {
    expect(getNameByLongName('Coca')).toBeUndefined();
  });
});

describe('getLongNameByName', () => {
  it('resolves a ticker to its long name', () => {
    expect(getLongNameByName('ko')).toBe('Coca-Cola');
    expect(getLongNameByName(' PEP ')).toBe('PepsiCo');
  });

  it('returns undefined for unknown or empty tickers', () => {
    expect(getLongNameByName('ZZZZ')).toBeUndefined();
    expect(getLongNameByName('')).toBeUndefined();
  });
});

describe('getAllCompanies', () => {
  it('returns a copy that callers can mutate safely', () => {
    const first = getAllCompanies();
    const before = first.length;
    first.pop();
    expect(getAllCompanies()).toHaveLength(before);
    expect(before).toBeGreaterThan(10);
  });
});

describe('searchCompanies', () => {
  it('matches tickers and long names partially', () => {
    const results = searchCompanies('cola');
    expect(results.map(c => c.name)).toContain('KO');
    expect(searchCompanies('jnj').map(c => c.long_name)).toEqual(['Johnson & Johnson']);
  });

  it('returns nothing for an empty term', () => {
    expect(searchCompanies('')).toEqual([]);
    expect(searchCompanies('   ')).toHaveLength(getAllCompanies().length);
  });
});
