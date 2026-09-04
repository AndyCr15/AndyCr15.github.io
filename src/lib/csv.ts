/**
 * CSV Utilities for Character Arc
 * Provides RFC 4180-compliant CSV generation, file download, and robust multi-line parsing.
 */

import { Character } from '../types';
import { getCharacterSeries } from './grouping';

export interface CsvCharacterRow {
  name: string;
  role?: string;
  books: string[];
  series: string[];
  description: string;
  spoilers?: string;
}

/**
 * Escapes a single value for standard RFC 4180 CSV output.
 */
function escapeCsvCell(value: string | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  // If string contains quotes, commas, newlines, or carriage returns, wrap in quotes and double internal quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates a formatted CSV string from a list of Character records.
 */
export function generateCharactersCsv(
  characters: Character[],
  bookSeriesMap?: Record<string, string[]>
): string {
  const headers = ['Name', 'Role', 'Books', 'Series', 'Description', 'Spoilers'];
  const headerRow = headers.map(escapeCsvCell).join(',');

  const rows = characters.map((c) => {
    const booksStr = Array.isArray(c.books) && c.books.length > 0 
      ? c.books.join('; ') 
      : (c.book || '');
    
    // Combine explicit series on the character with series linked via bookSeriesMap
    const seriesSet = new Set<string>();
    if (Array.isArray(c.series)) {
      c.series.forEach((s) => {
        if (s && s.trim()) seriesSet.add(s.trim());
      });
    }
    if (bookSeriesMap) {
      const derived = getCharacterSeries(c, bookSeriesMap);
      derived.forEach((s) => {
        if (s && s.trim()) seriesSet.add(s.trim());
      });
    }
    const seriesStr = Array.from(seriesSet).join('; ');
    
    return [
      escapeCsvCell(c.name || ''),
      escapeCsvCell(c.role || ''),
      escapeCsvCell(booksStr),
      escapeCsvCell(seriesStr),
      escapeCsvCell(c.description || ''),
      escapeCsvCell(c.spoilers || ''),
    ].join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

/**
 * Triggers a browser download of the CSV content.
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Robust RFC 4180 CSV parser that supports multiline fields within quotes.
 */
export function parseRawCsvMatrix(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  let i = 0;

  // Normalize line breaks
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        // Only push non-empty rows
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  // Push last trailing cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses multi-item delimited string (e.g. "Dune; Dune Messiah" or "Dune, Dune Messiah").
 */
function parseDelimitedList(text?: string): string[] {
  if (!text || !text.trim()) return [];
  const delimiter = text.includes(';') ? ';' : (text.includes('|') ? '|' : ',');
  return text
    .split(delimiter)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Parses CSV text into structured CsvCharacterRow objects.
 */
export function parseCharactersCsv(csvText: string): {
  rows: CsvCharacterRow[];
  errors: string[];
} {
  const matrix = parseRawCsvMatrix(csvText);
  const errors: string[] = [];

  if (matrix.length === 0) {
    return { rows: [], errors: ['The selected CSV file is empty.'] };
  }

  const headerRow = matrix[0].map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
  
  // Find column indices
  let nameIdx = headerRow.findIndex((h) => h === 'name' || h === 'character' || h === 'charactername');
  let roleIdx = headerRow.findIndex((h) => h === 'role' || h === 'type' || h === 'characterrole');
  let booksIdx = headerRow.findIndex((h) => h === 'books' || h === 'book' || h === 'booktitle' || h === 'booktitles');
  let seriesIdx = headerRow.findIndex((h) => h === 'series' || h === 'bookseries' || h === 'saga');
  let descIdx = headerRow.findIndex((h) => h === 'description' || h === 'desc' || h === 'notes' || h === 'bio' || h === 'details');
  let spoilersIdx = headerRow.findIndex((h) => h === 'spoilers' || h === 'spoiler' || h === 'spoilernotes' || h === 'secrets');

  // Fallback positional indexing if headers are missing standard labels
  let startIndex = 1;
  if (nameIdx === -1) {
    // If first row looks like data rather than header
    if (matrix[0].length >= 2) {
      nameIdx = 0;
      roleIdx = matrix[0].length > 1 ? 1 : -1;
      booksIdx = matrix[0].length > 2 ? 2 : -1;
      seriesIdx = matrix[0].length > 3 ? 3 : -1;
      descIdx = matrix[0].length > 4 ? 4 : -1;
      spoilersIdx = matrix[0].length > 5 ? 5 : -1;
      startIndex = 0; // Header row was actually data
    } else {
      return {
        rows: [],
        errors: ['Could not find a "Name" column in the CSV file headers.'],
      };
    }
  }

  const parsedRows: CsvCharacterRow[] = [];

  for (let i = startIndex; i < matrix.length; i++) {
    const rawRow = matrix[i];
    const nameVal = nameIdx !== -1 ? rawRow[nameIdx] : '';

    if (!nameVal || !nameVal.trim()) {
      continue; // Skip blank names
    }

    const roleVal = roleIdx !== -1 ? rawRow[roleIdx] : '';
    const booksVal = booksIdx !== -1 ? rawRow[booksIdx] : '';
    const seriesVal = seriesIdx !== -1 ? rawRow[seriesIdx] : '';
    const descVal = descIdx !== -1 ? rawRow[descIdx] : '';
    const spoilersVal = spoilersIdx !== -1 ? rawRow[spoilersIdx] : '';

    parsedRows.push({
      name: nameVal.trim(),
      role: roleVal ? roleVal.trim() : 'Character',
      books: parseDelimitedList(booksVal),
      series: parseDelimitedList(seriesVal),
      description: descVal ? descVal.trim() : `Character in ${booksVal || 'the library'}`,
      spoilers: spoilersVal ? spoilersVal.trim() : '',
    });
  }

  if (parsedRows.length === 0) {
    errors.push('No valid character records with names were found in the file.');
  }

  return { rows: parsedRows, errors };
}
