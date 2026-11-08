import { describe, expect, it } from 'vitest';
import sources from '../../src/data/sources.json';
import appointments from '../../src/data/appointments.json';

describe('mainland source coverage', () => {
  it('provides traceable mainland sources with publication dates and regional scope', () => {
    const domestic = sources.filter((s) => s.regionCode === 'CN');
    expect(domestic.length).toBeGreaterThanOrEqual(3);
    for (const source of domestic) {
      if (source.category === 'research') {
        expect(new URL(source.url).hostname).toBe('pmc.ncbi.nlm.nih.gov');
        expect(source.publisherLabel).toContain('原始研究');
      } else expect(new URL(source.url).hostname).toMatch(/\.gov\.cn$/);
      expect(source.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.region).toContain('中国大陆');
      expect(source.publisherLabel).toBeTruthy();
    }
  });
  it('links domestic check windows to the actual Chinese original', () => {
    for (const id of ['booking', 'nt-screening', 'anatomy-scan', 'ogtt']) {
      expect(appointments.find((a) => a.id === id)?.sourceIds).toContain('cn-beijing-care');
    }
    expect(appointments.find((a) => a.id === 'nt-screening')?.when).toContain('11');
    expect(appointments.find((a) => a.id === 'anatomy-scan')?.when).toContain('20～24');
    expect(appointments.find((a) => a.id === 'ogtt')?.when).toContain('24～28');
  });
});
