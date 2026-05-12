import React, { useState } from 'react'

export default function ExcelUpload() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setResult(null)
    setError(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) { setFile(dropped); setResult(null); setError(null) }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload-excel', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) setResult(data)
      else setError(data.message)
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-4 items-start">
        <div className="text-2xl">💡</div>
        <div>
          <h4 className="font-bold text-indigo-900 text-sm mb-1">How to Import Contacts</h4>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Upload an Excel (.xlsx / .xls) or CSV file with customer data. 
            Make sure columns include: <strong>Name, Phone, Address</strong>. 
            Duplicate phone numbers will be skipped automatically.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-5">Upload Customer Data</h3>

        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            dragging ? 'border-indigo-500 bg-indigo-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
          onClick={() => document.getElementById('fileInput').click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          {file ? (
            <>
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm font-bold text-emerald-700">{file.name}</p>
              <p className="text-xs text-emerald-600 mt-1">{(file.size / 1024).toFixed(1)} KB — Ready to upload</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">📁</div>
              <p className="text-sm font-semibold text-slate-700">Drag & drop your file here</p>
              <p className="text-xs text-slate-400 mt-1">or <span className="text-indigo-600 font-semibold">click to browse</span></p>
              <p className="text-xs text-slate-300 mt-3">Supports .xlsx, .xls, .csv</p>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          {file && (
            <button
              onClick={() => { setFile(null); setResult(null); setError(null) }}
              className="border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition ${
              !file || loading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20'
            }`}
          >
            {loading ? '⏳ Uploading...' : '📤 Upload & Import'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-3 items-start">
          <span className="text-lg">❌</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🎉</span>
            <h4 className="font-bold text-slate-900">Upload Successful!</h4>
          </div>
          <p className="text-sm text-slate-600 mb-5">{result.message}</p>
          {result.stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{result.stats.totalRows}</p>
                <p className="text-xs text-slate-500 mt-1">Total Rows</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{result.stats.imported}</p>
                <p className="text-xs text-slate-500 mt-1">Imported</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{result.stats.skipped}</p>
                <p className="text-xs text-slate-500 mt-1">Skipped</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
