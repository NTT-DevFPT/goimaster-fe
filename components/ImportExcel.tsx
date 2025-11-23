import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { ExcelRow } from '../types';

interface ImportExcelProps {
  onImport: (data: ExcelRow[]) => void;
}

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
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

      // Simple validation
      if (jsonData.length === 0) {
        throw new Error("File is empty");
      }
      
      const firstRow = jsonData[0];
      if (!('kanji' in firstRow) || !('meaning' in firstRow)) {
        throw new Error("Missing required columns: kanji, meaning (optional: hanViet, furigana)");
      }

      onImport(jsonData);
      setSuccess(`Successfully parsed ${jsonData.length} words.`);
    } catch (err: any) {
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
      <p className="text-sm text-gray-500 mt-1">Columns: kanji, hanViet, furigana, meaning</p>
      
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
    </div>
  );
};
