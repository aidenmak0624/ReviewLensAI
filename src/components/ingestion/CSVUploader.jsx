import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { cn } from "../../lib/utils";

export default function CSVUploader({ onParsed }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a .csv file");
        return;
      }
      setError(null);
      setFileName(file.name);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            setError("CSV file is empty or has no valid rows");
            setFileName(null);
            return;
          }
          // Convert parsed CSV rows to a single text block for OpenAI extraction
          const csvText = Papa.unparse(results.data);
          onParsed(csvText, results.data.length);
        },
        error: (err) => {
          setError(`CSV parse error: ${err.message}`);
          setFileName(null);
        },
      });
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleClear = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onParsed(null, 0);
  };

  return (
    <div>
      {fileName ? (
        <div className="border border-border rounded-lg p-4 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                File loaded — ready for extraction
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-muted rounded"
            aria-label="Remove file"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50"
          )}
        >
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">
            Drop your CSV file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports any column format — AI will map columns automatically
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
