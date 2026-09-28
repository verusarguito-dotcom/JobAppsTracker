import { normalizeJobUrl } from './url.js';

export const APPLICATION_CSV_COLUMNS = [
  'company_name',
  'position_title',
  'status',
  'job_type',
  'location',
  'salary_min',
  'salary_max',
  'currency',
  'job_url',
  'source',
  'deadline_date',
  'applied_date',
  'follow_up_date',
  'recruiter_name',
  'recruiter_contact',
  'cv_version',
  'notes',
  'created_at',
  'updated_at',
] as const;

export const LOG_CSV_COLUMNS = [
  'id',
  'application_id',
  'company_name',
  'position_title',
  'old_status',
  'new_status',
  'note',
  'created_at',
] as const;

const VALID_STATUSES = new Set([
  'bookmarked',
  'applied',
  'screening',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'ghosted',
  'withdrawn',
]);

const VALID_JOB_TYPES = new Set(['remote', 'onsite', 'hybrid']);

export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportApplicationsToCsv(applications: Record<string, any>[]): string {
  const headerRow = APPLICATION_CSV_COLUMNS.join(',');
  const rows = applications.map((app) =>
    APPLICATION_CSV_COLUMNS.map((col) => {
      let val = app[col];
      if (col === 'salary_min' || col === 'salary_max') {
        val = val !== null && val !== undefined && val !== '' ? Number(val) : '';
      }
      return escapeCsvValue(val);
    }).join(','),
  );

  return '\uFEFF' + [headerRow, ...rows].join('\r\n') + '\r\n';
}

export function exportLogsToCsv(logs: Record<string, any>[]): string {
  const headerRow = LOG_CSV_COLUMNS.join(',');
  const rows = logs.map((log) =>
    LOG_CSV_COLUMNS.map((col) => escapeCsvValue(log[col])).join(','),
  );

  return '\uFEFF' + [headerRow, ...rows].join('\r\n') + '\r\n';
}

export function parseCsv(text: string): string[][] {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < clean.length) {
    const char = clean[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < clean.length && clean[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      }
      if (char === '\r') {
        if (i + 1 < clean.length && clean[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      }
      if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      }
      currentField += char;
      i++;
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

const HEADER_MAP: Record<string, string> = {
  company_name: 'company_name',
  company: 'company_name',
  perusahaan: 'company_name',
  nama_perusahaan: 'company_name',
  position_title: 'position_title',
  position: 'position_title',
  posisi: 'position_title',
  job_title: 'position_title',
  title: 'position_title',
  jabatan: 'position_title',
  status: 'status',
  status_lamaran: 'status',
  job_type: 'job_type',
  tipe_kerja: 'job_type',
  tipe: 'job_type',
  work_type: 'job_type',
  location: 'location',
  lokasi: 'location',
  salary_min: 'salary_min',
  gaji_min: 'salary_min',
  min_salary: 'salary_min',
  gaji_minimum: 'salary_min',
  salary_max: 'salary_max',
  gaji_max: 'salary_max',
  max_salary: 'salary_max',
  gaji_maksimum: 'salary_max',
  currency: 'currency',
  mata_uang: 'currency',
  job_url: 'job_url',
  url: 'job_url',
  link: 'job_url',
  url_lowongan: 'job_url',
  link_lowongan: 'job_url',
  job_link: 'job_url',
  source: 'source',
  sumber: 'source',
  deadline_date: 'deadline_date',
  deadline: 'deadline_date',
  batas_akhir: 'deadline_date',
  applied_date: 'applied_date',
  tanggal_apply: 'applied_date',
  applied: 'applied_date',
  tanggal_lamar: 'applied_date',
  follow_up_date: 'follow_up_date',
  follow_up: 'follow_up_date',
  tanggal_follow_up: 'follow_up_date',
  recruiter_name: 'recruiter_name',
  recruiter: 'recruiter_name',
  nama_recruiter: 'recruiter_name',
  recruiter_contact: 'recruiter_contact',
  kontak_recruiter: 'recruiter_contact',
  cv_version: 'cv_version',
  cv: 'cv_version',
  versi_cv: 'cv_version',
  notes: 'notes',
  note: 'notes',
  catatan: 'notes',
  keterangan: 'notes',
};

export function normalizeHeader(h: string): string {
  const cleaned = h.trim().toLowerCase().replace(/[\s\-_/]+/g, '_');
  return HEADER_MAP[cleaned] || cleaned;
}

export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yStr, mStr, dStr] = dateStr.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function parseCsvToApplications(csvText: string): {
  data: Record<string, any>[];
  errors: string[];
} {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { data: [], errors: ['File CSV kosong atau tidak memiliki data.'] };
  }

  const rawHeaders = rows[0];
  const canonicalHeaders = rawHeaders.map(normalizeHeader);

  if (!canonicalHeaders.includes('company_name') || !canonicalHeaders.includes('position_title')) {
    return {
      data: [],
      errors: [
        'Header CSV harus menyertakan minimal kolom "company_name" (atau "perusahaan") dan "position_title" (atau "posisi").',
      ],
    };
  }

  const errors: string[] = [];
  const parsedRows: Record<string, any>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowObj: Record<string, any> = {};

    for (let c = 0; c < canonicalHeaders.length; c++) {
      const colName = canonicalHeaders[c];
      const val = row[c] !== undefined ? row[c].trim() : '';
      if (val !== '') {
        rowObj[colName] = val;
      }
    }

    const rowNum = r + 1; // 1-indexed row number in CSV file
    const company = rowObj.company_name?.trim();
    const position = rowObj.position_title?.trim();

    if (!company) {
      errors.push(`Baris ${rowNum}: Nama perusahaan wajib diisi.`);
      continue;
    }
    if (!position) {
      errors.push(`Baris ${rowNum}: Posisi / pekerjaan wajib diisi.`);
      continue;
    }

    // Status validation
    if (rowObj.status) {
      const normStatus = rowObj.status.toLowerCase();
      if (!VALID_STATUSES.has(normStatus)) {
        errors.push(`Baris ${rowNum}: Status "${rowObj.status}" tidak valid.`);
        continue;
      }
      rowObj.status = normStatus;
    } else if (canonicalHeaders.includes('status')) {
      rowObj.status = 'bookmarked';
    }

    // Job type validation
    if (rowObj.job_type) {
      const normJobType = rowObj.job_type.toLowerCase();
      if (!VALID_JOB_TYPES.has(normJobType)) {
        errors.push(
          `Baris ${rowNum}: Tipe kerja "${rowObj.job_type}" tidak valid (harus remote/onsite/hybrid).`,
        );
        continue;
      }
      rowObj.job_type = normJobType;
    }

    // Salary validation
    if (rowObj.salary_min !== undefined) {
      const minNum = Number(rowObj.salary_min);
      if (isNaN(minNum) || minNum < 0 || !Number.isInteger(minNum)) {
        errors.push(`Baris ${rowNum}: Gaji minimum harus berupa angka bulat positif.`);
        continue;
      }
      rowObj.salary_min = minNum;
    }

    if (rowObj.salary_max !== undefined) {
      const maxNum = Number(rowObj.salary_max);
      if (isNaN(maxNum) || maxNum < 0 || !Number.isInteger(maxNum)) {
        errors.push(`Baris ${rowNum}: Gaji maksimum harus berupa angka bulat positif.`);
        continue;
      }
      rowObj.salary_max = maxNum;
    }

    if (
      rowObj.salary_min !== undefined &&
      rowObj.salary_max !== undefined &&
      rowObj.salary_min > rowObj.salary_max
    ) {
      errors.push(
        `Baris ${rowNum}: Gaji minimum (${rowObj.salary_min}) tidak boleh lebih besar dari gaji maksimum (${rowObj.salary_max}).`,
      );
      continue;
    }

    // Date validations (YYYY-MM-DD)
    let dateError = false;
    for (const dateField of ['deadline_date', 'applied_date', 'follow_up_date']) {
      if (rowObj[dateField]) {
        let val = String(rowObj[dateField]).trim();
        // Allow ISO timestamp with time component by extracting the date part
        if (val.includes('T')) {
          val = val.split('T')[0].trim();
        } else if (/^\d{4}-\d{2}-\d{2}\s/.test(val)) {
          val = val.split(' ')[0].trim();
        }

        if (!isValidCalendarDate(val)) {
          errors.push(
            `Baris ${rowNum}: Format tanggal ${dateField} harus YYYY-MM-DD yang valid (ditemukan: "${rowObj[dateField]}").`,
          );
          dateError = true;
          break;
        }
        rowObj[dateField] = val;
      }
    }
    if (dateError) continue;

    // Currency
    if (rowObj.currency) {
      rowObj.currency = rowObj.currency.trim();
    }

    // Normalize job_url
    if (rowObj.job_url) {
      rowObj.job_url = normalizeJobUrl(rowObj.job_url);
    }

    parsedRows.push(rowObj);
  }

  return { data: parsedRows, errors };
}
