import { EpochParserV2Service } from './epoch-parser-v2.service';

describe('EpochParserV2Service', () => {
  let service: EpochParserV2Service;

  beforeEach(() => {
    service = new EpochParserV2Service();
  });

  describe('tryParse (via parseSingle)', () => {
    // --- Real epoch lines (should parse) ---

    it('parses a standard epoch line with flag 0 and PRN list', () => {
      const line = ' 24 10 16 13 30  0.0000000  0 12G01G03G05G07G08G09G10G13G15G21G26G31';
      const result = service.parseSingle(line);
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2024);
      expect(result!.month).toBe(10);
      expect(result!.day).toBe(16);
      expect(result!.hour).toBe(13);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBeCloseTo(0.0, 7);
      expect(result!.epochFlag).toBe(0);
      expect(result!.numSats).toBe(12);
      expect(result!.prns).toHaveLength(12);
      expect(result!.prns[0]).toBe('G01');
    });

    it('parses an epoch line with epoch flag 1 and PRN list', () => {
      const line = ' 25 06 15 08 00  0.0000000  1  8G02G04G06G11G14G18G22G28';
      const result = service.parseSingle(line);
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2025);
      expect(result!.epochFlag).toBe(1);
      expect(result!.numSats).toBe(8);
    });

    it('parses an epoch line without epoch flag (implicit 0) with PRN list', () => {
      // "5E01..." means 5 satellites; epoch flag is omitted (implicit 0)
      const line = ' 23 01 10 00 00  0.0000000  5E01E02E03E04E05';
      const result = service.parseSingle(line);
      expect(result).not.toBeNull();
      expect(result!.epochFlag).toBe(0);
      expect(result!.numSats).toBe(5);
    });

    it('parses 2-digit year 00 → 2000', () => {
      const line = ' 00 01 01 00 00  0.0000000  0  3G01G02G03';
      const result = service.parseSingle(line);
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2000);
    });

    it('parses 2-digit year 99 → 1999', () => {
      const line = ' 99 12 31 23 59 30.0000000  0  6G01G02G03G04G05G06';
      const result = service.parseSingle(line);
      expect(result).not.toBeNull();
      expect(result!.year).toBe(1999);
    });

    it('parses 2-digit year 95 → 1995', () => {
      const line = ' 95 06 01 12 00  0.0000000  0  4R01R02R03R04';
      const result = service.parseSingle(line);
      expect(result).not.toBeNull();
      expect(result!.year).toBe(1995);
    });

    it('parses a minimal epoch line with 7 parts (no PRN list)', () => {
      const line = ' 24 03 15 10 30  0.0000000  0';
      const result = service.parseSingle(line);
      expect(result).not.toBeNull();
      expect(result!.numSats).toBe(0);
      expect(result!.prns).toHaveLength(0);
    });

    // --- Observation lines (should reject) ---

    it('rejects an observation line with decimal values like SNR', () => {
      const line = ' 45.000 12.000  3.000 56.000 33.000 21.000  8.000';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects an observation line with small integer-like values', () => {
      const line = '  1.000  2.000  3.000  4.000  5.000  6.000  7.000';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects an observation line where sixth part is a decimal', () => {
      // parts[6] = "8.000" which is not a valid epoch flag, PRN prefix, or numSats
      const line = '23536451.819 45.000 12.000  3.000 56.000 33.000  8.000';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects an observation line with negative values', () => {
      const line = ' 24 10 16 13 30 -1.000  0 12G01G03';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    // --- Header / non-epoch lines (should reject) ---

    it('rejects a RINEX header line', () => {
      const line = '     2.11           OBSERVATION DATA    G (GPS)             RINEX VERSION / TYPE';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects an END OF HEADER line', () => {
      const line = '                                                    END OF HEADER';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects a comment line', () => {
      const line = ' SOME COMMENT TEXT                                        COMMENT';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects a V3 epoch line (starts with >)', () => {
      const line = '> 2024 10 16 13 30  0.0000000  0 12';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    // --- Edge cases ---

    it('rejects a line with fewer than 7 parts', () => {
      const line = ' 24 10 16 13 30  0.0000';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects a line with out-of-range month', () => {
      const line = ' 24 13 01 00 00  0.0000000  0  3G01G02G03';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects a line with out-of-range hour', () => {
      const line = ' 24 06 01 25 00  0.0000000  0  3G01G02G03';
      const result = service.parseSingle(line);
      expect(result).toBeNull();
    });

    it('rejects an empty line', () => {
      const result = service.parseSingle('');
      expect(result).toBeNull();
    });
  });

  describe('parse()', () => {
    it('finds all epoch lines in a mixed content array', () => {
      const lines = [
        '     2.11           OBSERVATION DATA    G (GPS)             RINEX VERSION / TYPE',
        '                                                    END OF HEADER',
        ' 24 10 16 13 30  0.0000000  0 12G01G03G05G07G08G09G10G13G15G21G26G31',
        ' 45.000 12.000  3.000 56.000 33.000 21.000  8.000',
        ' 24 10 16 13 35  0.0000000  0 12G01G03G05G07G08G09G10G13G15G21G26G31',
        ' 46.000 13.000  4.000 57.000 34.000 22.000  9.000',
        ' 24 10 16 13 40  0.0000000  0 12G01G03G05G07G08G09G10G13G15G21G26G31',
        ' 47.000 14.000  5.000 58.000 35.000 23.000 10.000',
      ];

      const epochs: any[] = [];
      let idx = 0;
      while (idx < lines.length) {
        const { epoch, nextIdx } = service.parse(lines, idx);
        if (!epoch) break;
        epochs.push(epoch);
        idx = nextIdx;
      }

      expect(epochs).toHaveLength(3); // 3 real epochs, not counting obs lines
      expect(epochs[0].minute).toBe(30);
      expect(epochs[1].minute).toBe(35);
      expect(epochs[2].minute).toBe(40);
    });
  });
});
