import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { ExcelRow } from '../types';

interface ImportExcelProps {
  onImport: (data: ExcelRow[]) => void;
}

// Map Excel row to standard format
const mapExcelRow = (row: any): ExcelRow | null => {
  const result: any = {
    kanji: '',
    hanViet: '',
    furigana: '',
    meaning: '',
  };

  // Get all column names from the row
  const columnNames = Object.keys(row);

  // Map each column based on name
  for (const colName of columnNames) {
    const value = String(row[colName] || '').trim();
    if (!value) continue;

    const colLower = colName.toLowerCase().trim();
    const colOriginal = colName.trim();

    // Map Kanji (漢字)
    if (colOriginal === '漢字' || colLower === 'kanji' || colLower.includes('kanji')) {
      result.kanji = value;
    }
    // Map Furigana (読み方)
    else if (colOriginal === '読み方' || colLower === 'furigana' || colLower.includes('furigana') || colLower.includes('yomikata')) {
      result.furigana = value;
    }
    // Map Hán Việt
    else if (colOriginal === 'Hán Việt' || colLower === 'hanviet' || colLower === 'han_viet' || colLower.includes('han viet')) {
      result.hanViet = value;
    }
    // Map Meaning (意味)
    else if (colOriginal === '意味' || colLower === 'meaning' || colLower.includes('meaning') || colLower.includes('imi')) {
      result.meaning = value;
    }
  }


  // Validate required fields - Kanji and Meaning are required
  // HanViet and Furigana can be empty strings
  if (!result.kanji || !result.meaning) {
    return null; // Skip invalid rows
  }

  // Ensure hanViet and furigana are strings (not undefined)
  result.hanViet = result.hanViet || '';
  result.furigana = result.furigana || '';

  return result as ExcelRow;
};

export const ImportExcel: React.FC<ImportExcelProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Parse with header row
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
        defval: '', // Default value for empty cells
        raw: false, // Convert numbers to strings
      });

      // Validation
      if (jsonData.length === 0) {
        throw new Error("File is empty or has no data rows");
      }

      // Show detected columns for debugging
      const firstRow = jsonData[0];
      const detectedColumns = Object.keys(firstRow);
      console.log('Detected columns:', detectedColumns);

      // Map and validate rows
      const mappedData: ExcelRow[] = [];
      const skippedRows: number[] = [];

      jsonData.forEach((row, index) => {
        const mapped = mapExcelRow(row);
        if (mapped) {
          mappedData.push(mapped);
        } else {
          skippedRows.push(index + 2); // +2 because Excel rows start at 1, and we have header
        }
      });

      if (mappedData.length === 0) {
        throw new Error(
          `No valid rows found. ` +
          `Detected columns: ${detectedColumns.join(', ')}. ` +
          `Expected columns: 漢字 , 読み方 , Hán Việt, 意味 . ` +
          `Note: Kanji and Meaning are required.`
        );
      }

      onImport(mappedData);

      const skippedMsg = skippedRows.length > 0
        ? ` ${skippedRows.length} row(s) skipped (rows: ${skippedRows.slice(0, 5).join(', ')}${skippedRows.length > 5 ? '...' : ''}).`
        : '';
      setSuccess(`Successfully imported ${mappedData.length} word(s).${skippedMsg}`);
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || "Failed to parse Excel file");
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-white hover:border-brand-300 transition-colors cursor-pointer group"
      onClick={() => fileInputRef.current?.click()}>
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {loading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-2"></div>
      ) : success ? (
        <CheckCircle className="text-green-500 w-10 h-10 mb-2" />
      ) : error ? (
        <AlertCircle className="text-red-500 w-10 h-10 mb-2" />
      ) : (
        <FileSpreadsheet className="text-gray-400 group-hover:text-brand-500 w-10 h-10 mb-2 transition-colors" />
      )}

      <h3 className="font-medium text-gray-700">Import Excel File</h3>
      <div className="text-sm text-gray-500 mt-1 space-y-1 w-full">
        <p>Supported columns:</p>
        <p className="font-jp">
          <span className="font-semibold">漢字</span> (Kanji) •
          <span className="font-semibold"> 読み方</span> (Furigana) •
          Hán Việt •
          <span className="font-semibold"> 意味</span> (Meaning)
        </p>
        <p className="text-xs text-gray-400">
          Kanji and Meaning are required
        </p>
        <div className="mt-3 w-full text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ví dụ bảng Excel</p>
          <div className="border border-gray-200 rounded-lg text-xs">
            <div className="grid grid-cols-4 bg-gray-100 font-medium text-gray-700 px-3 py-2 rounded-t-lg">
              <span className="font-jp">漢字</span>
              <span>Hán Việt</span>
              <span className="font-jp">読み方</span>
              <span className="font-jp">意味</span>
            </div>
            <div className="grid grid-cols-4 px-3 py-2 text-gray-600">
              <span className="font-jp">感謝</span>
              <span>Cảm tạ</span>
              <span className="font-jp">かんしゃ</span>
              <span>biết ơn / gratitude</span>
            </div>
            <div className="grid grid-cols-4 px-3 py-2 text-gray-600 border-t border-gray-100 rounded-b-lg">
              <span className="font-jp">挑戦</span>
              <span>Thách chiến</span>
              <span className="font-jp">ちょうせん</span>
              <span>challenge</span>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mt-2 max-w-md px-2">{error}</p>}
      {success && <p className="text-sm text-green-500 mt-2 px-2">{success}</p>}
    </div>
  );
};
