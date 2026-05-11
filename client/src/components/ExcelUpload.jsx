import React, { useState } from 'react'

export default function ExcelUpload() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setResult(null)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setResult(data)
      } else {
        setError(data.message)
      }
    } catch (err) {
      console.error('Error uploading file:', err)
      setError('Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-slate-900 mb-6">📤 Upload Excel Data</h3>

      <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-sky-500 transition cursor-pointer"
           onClick={() => document.getElementById('fileInput').click()}>
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
        />
        <div className="text-4xl mb-2">📁</div>
        {file ? (
          <p className="text-sm font-semibold text-slate-900">{file.name}</p>
        ) : (
          <p className="text-sm text-slate-500">Drag & drop your file here or <span className="text-sky-500 font-semibold">Browse</span></p>
        )}
        <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv</p>
      </div>

      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className={`px-6 py-2 rounded-lg font-semibold text-sm transition ${!file || loading ? 'bg-gray-100 text-slate-400 cursor-not-allowed' : 'bg-sky-500 text-white hover:bg-sky-600'}`}
        >
          {loading ? '⏳ Uploading...' : 'Upload File'}
        </button>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 text-red-700 p-4 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-50 text-green-700 p-4 rounded-lg text-sm">
          <p className="font-semibold mb-2">✅ Upload Complete!</p>
          <p>{result.message}</p>
          {result.stats && (
            <div className="mt-2 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-2 rounded-lg border border-green-100">
                <p className="text-xs text-slate-500">Total Rows</p>
                <p className="text-lg font-bold text-slate-900">{result.stats.totalRows}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-green-100">
                <p className="text-xs text-slate-500">Imported</p>
                <p className="text-lg font-bold text-green-600">{result.stats.imported}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-green-100">
                <p className="text-xs text-slate-500">Skipped</p>
                <p className="text-lg font-bold text-yellow-600">{result.stats.skipped}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
