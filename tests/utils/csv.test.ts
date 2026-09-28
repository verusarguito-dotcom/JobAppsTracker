import { describe, it, expect } from 'vitest';
import {
  escapeCsvValue,
  exportApplicationsToCsv,
  exportLogsToCsv,
  parseCsv,
  parseCsvToApplications,
  normalizeHeader,
  isValidCalendarDate,
} from '../../server/utils/csv.js';

describe('CSV Utilities (RFC 4180)', () => {
  describe('escapeCsvValue', () => {
    it('returns empty string for null and undefined', () => {
      expect(escapeCsvValue(null)).toBe('');
      expect(escapeCsvValue(undefined)).toBe('');
    });

    it('returns primitive strings and numbers unquoted when no special characters', () => {
      expect(escapeCsvValue('Simple')).toBe('Simple');
      expect(escapeCsvValue(12345)).toBe('12345');
    });

    it('quotes strings containing commas, quotes, or newlines and doubles quotes', () => {
      expect(escapeCsvValue('Hello, World')).toBe('"Hello, World"');
      expect(escapeCsvValue('He said "hello"')).toBe('"He said ""hello"""');
      expect(escapeCsvValue('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });
  });

  describe('exportApplicationsToCsv & exportLogsToCsv', () => {
    it('prepends UTF-8 BOM and exports valid RFC 4180 CSV for applications', () => {
      const apps = [
        {
          company_name: 'Alpha Corp, LLC',
          position_title: 'Fullstack Dev',
          status: 'applied',
          job_type: 'remote',
          location: 'Jakarta',
          salary_min: 15000000,
          salary_max: 20000000,
          currency: 'IDR',
          job_url: 'https://alpha.com',
          notes: 'Notes with "quotes" and, commas',
        },
      ];

      const csv = exportApplicationsToCsv(apps);
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
      expect(csv).toContain('"Alpha Corp, LLC",Fullstack Dev,applied,remote,Jakarta,15000000,20000000,IDR');
      expect(csv).toContain('"Notes with ""quotes"" and, commas"');
    });

    it('exports logs with UTF-8 BOM', () => {
      const logs = [
        {
          id: 1,
          application_id: 'app-123',
          company_name: 'Beta Co',
          position_title: 'Frontend Engineer',
          old_status: 'bookmarked',
          new_status: 'applied',
          note: 'Sent CV',
          created_at: '2026-09-28T12:00:00Z',
        },
      ];
      const csv = exportLogsToCsv(logs);
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
      expect(csv).toContain('Beta Co,Frontend Engineer,bookmarked,applied,Sent CV');
    });
  });

  describe('parseCsv (RFC 4180 Engine)', () => {
    it('parses regular rows', () => {
      const raw = 'col1,col2\r\nval1,val2\r\nval3,val4';
      const rows = parseCsv(raw);
      expect(rows).toEqual([
        ['col1', 'col2'],
        ['val1', 'val2'],
        ['val3', 'val4'],
      ]);
    });

    it('parses multiline quoted fields with quotes and commas', () => {
      const raw = 'name,desc\r\n"Acme, Inc.","Line 1\r\nLine 2 with ""quotes"""';
      const rows = parseCsv(raw);
      expect(rows.length).toBe(2);
      expect(rows[1][0]).toBe('Acme, Inc.');
      expect(rows[1][1]).toBe('Line 1\r\nLine 2 with "quotes"');
    });

    it('strips UTF-8 BOM if present at start', () => {
      const raw = '\uFEFFa,b\r\n1,2';
      const rows = parseCsv(raw);
      expect(rows).toEqual([
        ['a', 'b'],
        ['1', '2'],
      ]);
    });
  });

  describe('normalizeHeader', () => {
    it('normalizes Indonesian headers and variants', () => {
      expect(normalizeHeader('Perusahaan')).toBe('company_name');
      expect(normalizeHeader('Nama Perusahaan')).toBe('company_name');
      expect(normalizeHeader('Posisi')).toBe('position_title');
      expect(normalizeHeader('Job Title')).toBe('position_title');
      expect(normalizeHeader('Gaji Min')).toBe('salary_min');
      expect(normalizeHeader('URL Lowongan')).toBe('job_url');
      expect(normalizeHeader('Tanggal Apply')).toBe('applied_date');
    });
  });

  describe('parseCsvToApplications', () => {
    it('accepts Indonesian headers and parses correctly', () => {
      const csv =
        'Perusahaan,Posisi,Status,Tipe Kerja,Gaji Min,Gaji Max,URL Lowongan\r\n' +
        'Gojek,Dev,applied,remote,15000000,20000000,https://gojek.com/job/1';
      const result = parseCsvToApplications(csv);
      expect(result.errors).toEqual([]);
      expect(result.data.length).toBe(1);
      expect(result.data[0].company_name).toBe('Gojek');
      expect(result.data[0].position_title).toBe('Dev');
      expect(result.data[0].status).toBe('applied');
      expect(result.data[0].job_type).toBe('remote');
      expect(result.data[0].salary_min).toBe(15000000);
      expect(result.data[0].salary_max).toBe(20000000);
      expect(result.data[0].job_url).toBe('https://gojek.com/job/1');
    });

    it('validates required fields, date formats, and salary consistency', () => {
      const csv =
        'company_name,position_title,status,deadline_date,salary_min,salary_max\r\n' +
        ',Software Dev,applied,2026-10-01,1000,2000\r\n' +
        'Shopee,,applied,2026-10-01,1000,2000\r\n' +
        'Tokopedia,Engineer,invalid_status,2026-10-01,1000,2000\r\n' +
        'Bukalapak,Lead,applied,not-a-date,1000,2000\r\n' +
        'Blibli,Architect,applied,2026-10-01,3000,2000\r\n';

      const result = parseCsvToApplications(csv);
      expect(result.errors.length).toBe(5);
      expect(result.errors[0]).toContain('Nama perusahaan wajib diisi');
      expect(result.errors[1]).toContain('Posisi / pekerjaan wajib diisi');
      expect(result.errors[2]).toContain('Status "invalid_status" tidak valid');
      expect(result.errors[3]).toContain('Format tanggal deadline_date harus YYYY-MM-DD');
      expect(result.errors[4]).toContain('tidak boleh lebih besar');
    });

    it('rejects invalid calendar dates like 2026-02-31 and 2026-13-40', () => {
      const csv =
        'company_name,position_title,status,applied_date\r\n' +
        'Acme,Engineer,applied,2026-02-31\r\n' +
        'Beta,Engineer,applied,2026-13-40\r\n';

      const result = parseCsvToApplications(csv);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]).toContain('Format tanggal applied_date harus YYYY-MM-DD yang valid');
      expect(result.errors[1]).toContain('Format tanggal applied_date harus YYYY-MM-DD yang valid');
    });

    it('extracts date part from ISO timestamps with time component', () => {
      const csv =
        'company_name,position_title,status,applied_date,deadline_date\r\n' +
        'Acme,Engineer,applied,2026-09-28T08:30:00Z,2026-10-15 17:00:00\r\n';

      const result = parseCsvToApplications(csv);
      expect(result.errors).toEqual([]);
      expect(result.data.length).toBe(1);
      expect(result.data[0].applied_date).toBe('2026-09-28');
      expect(result.data[0].deadline_date).toBe('2026-10-15');
    });
  });

  describe('isValidCalendarDate', () => {
    it('validates standard dates and leap years correctly', () => {
      expect(isValidCalendarDate('2026-01-01')).toBe(true);
      expect(isValidCalendarDate('2026-12-31')).toBe(true);
      expect(isValidCalendarDate('2024-02-29')).toBe(true); // 2024 is leap year
      expect(isValidCalendarDate('2025-02-29')).toBe(false); // 2025 not leap year
      expect(isValidCalendarDate('2026-02-31')).toBe(false);
      expect(isValidCalendarDate('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidCalendarDate('2026-13-01')).toBe(false);
      expect(isValidCalendarDate('2026-00-10')).toBe(false);
      expect(isValidCalendarDate('not-a-date')).toBe(false);
    });
  });
});
