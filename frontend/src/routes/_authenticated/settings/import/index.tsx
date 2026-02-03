import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner'
import { useToast } from '@/components/ui/feedback/Toast'
import { useSocieties } from '@/hooks/useLookups'
import {
  uploadImportFile,
  getImportFields,
  executeImport,
  downloadTemplate,
} from '@/api/import'
import type {
  ImportEntityType,
  ImportMode,
  ImportFieldDefinition,
  ColumnMapping,
  FileUploadResponse,
  ImportResultResponse,
} from '@/types/import'

export const Route = createFileRoute('/_authenticated/settings/import/')({
  component: ImportPage,
})

type ImportStep = 'select' | 'upload' | 'mapping' | 'preview' | 'result'

function ImportPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()
  const { data: societies = [] } = useSocieties()

  // Wizard state
  const [step, setStep] = useState<ImportStep>('select')
  const [entityType, setEntityType] = useState<ImportEntityType | ''>('')
  const [socId, setSocId] = useState<string>('')
  const [importMode, setImportMode] = useState<ImportMode>('create_only')
  const [skipErrors, setSkipErrors] = useState(false)

  // File and fields state
  const [uploadedFile, setUploadedFile] = useState<FileUploadResponse | null>(null)
  const [availableFields, setAvailableFields] = useState<ImportFieldDefinition[]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])

  // Result state
  const [importResult, setImportResult] = useState<ImportResultResponse | null>(null)

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadImportFile,
    onSuccess: async (data) => {
      setUploadedFile(data)
      // Fetch fields for mapping
      if (entityType) {
        const fieldsResponse = await getImportFields(entityType as ImportEntityType)
        setAvailableFields(fieldsResponse.fields)
        // Auto-map columns by matching names
        const autoMappings: ColumnMapping[] = []
        const fieldNames = new Set(fieldsResponse.fields.map((f) => f.name))
        data.column_headers.forEach((header) => {
          if (fieldNames.has(header)) {
            autoMappings.push({ source_column: header, target_field: header })
          }
        })
        setColumnMappings(autoMappings)
      }
      setStep('mapping')
    },
    onError: () => {
      showError(t('import.uploadError'), t('import.uploadErrorDescription'))
    },
  })

  // Execute import mutation
  const importMutation = useMutation({
    mutationFn: () => {
      if (!uploadedFile || !entityType || !socId) {
        throw new Error('Missing required data')
      }
      return executeImport(
        uploadedFile.file_id,
        entityType as ImportEntityType,
        columnMappings,
        importMode,
        Number(socId),
        skipErrors,
        false
      )
    },
    onSuccess: (data) => {
      setImportResult(data)
      setStep('result')
      if (data.success) {
        success(t('import.importSuccess'), data.message)
      } else {
        showError(t('import.importError'), data.message)
      }
    },
    onError: () => {
      showError(t('import.importError'), t('import.importErrorDescription'))
    },
  })

  // Handle file drop
  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) {
        uploadMutation.mutate(file)
      } else {
        showError(t('import.invalidFile'), t('import.csvOnly'))
      }
    },
    [uploadMutation, showError, t]
  )

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        uploadMutation.mutate(file)
      }
    },
    [uploadMutation]
  )

  // Handle download template
  const handleDownloadTemplate = async () => {
    if (!entityType) return
    try {
      const blob = await downloadTemplate(entityType as ImportEntityType)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entityType}_import_template.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showError(t('import.downloadError'), t('import.downloadErrorDescription'))
    }
  }

  // Update column mapping
  const updateMapping = (sourceColumn: string, targetField: string) => {
    setColumnMappings((prev) => {
      const existing = prev.find((m) => m.source_column === sourceColumn)
      if (existing) {
        if (!targetField) {
          return prev.filter((m) => m.source_column !== sourceColumn)
        }
        return prev.map((m) =>
          m.source_column === sourceColumn ? { ...m, target_field: targetField } : m
        )
      }
      if (targetField) {
        return [...prev, { source_column: sourceColumn, target_field: targetField }]
      }
      return prev
    })
  }

  // Reset to start
  const handleReset = () => {
    setStep('select')
    setEntityType('')
    setSocId('')
    setUploadedFile(null)
    setAvailableFields([])
    setColumnMappings([])
    setImportResult(null)
  }

  // Entity type options
  const entityOptions = [
    { value: '', label: t('import.selectEntityType') },
    { value: 'product', label: t('import.entityTypes.product') },
    { value: 'client', label: t('import.entityTypes.client') },
    { value: 'supplier', label: t('import.entityTypes.supplier') },
    { value: 'brand', label: t('import.entityTypes.brand') },
  ]

  // Import mode options
  const modeOptions = [
    { value: 'create_only', label: t('import.modes.createOnly') },
    { value: 'update_only', label: t('import.modes.updateOnly') },
    { value: 'upsert', label: t('import.modes.upsert') },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={t('import.title')}
        description={t('import.description')}
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {['select', 'upload', 'mapping', 'result'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : ['select', 'upload', 'mapping', 'result'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && <div className="w-12 h-0.5 bg-border mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Entity Type and Settings */}
      {step === 'select' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader title={t('import.step1Title')} />
            <CardContent className="space-y-4">
              <FormSelect
                label={t('import.entityType')}
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as ImportEntityType)}
                options={entityOptions}
                required
              />
              <FormSelect
                label={t('import.society')}
                value={socId}
                onChange={(e) => setSocId(e.target.value)}
                options={[
                  { value: '', label: t('import.selectSociety') },
                  ...societies.map((s) => ({ value: s.key, label: s.value })),
                ]}
                required
              />
              <FormSelect
                label={t('import.importMode')}
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as ImportMode)}
                options={modeOptions}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipErrors"
                  checked={skipErrors}
                  onChange={(e) => setSkipErrors(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="skipErrors" className="text-sm">
                  {t('import.skipErrors')}
                </label>
              </div>

              <div className="flex justify-between pt-4">
                {entityType && (
                  <button
                    onClick={handleDownloadTemplate}
                    className="btn-secondary"
                  >
                    {t('import.downloadTemplate')}
                  </button>
                )}
                <button
                  onClick={() => setStep('upload')}
                  disabled={!entityType || !socId}
                  className="btn-primary ml-auto"
                >
                  {t('common.next')}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 'upload' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader title={t('import.step2Title')} />
            <CardContent>
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors"
              >
                {uploadMutation.isPending ? (
                  <div className="flex flex-col items-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted-foreground">{t('import.uploading')}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-4">📁</div>
                    <p className="text-lg font-medium mb-2">{t('import.dropFileHere')}</p>
                    <p className="text-sm text-muted-foreground mb-4">{t('import.orClickToSelect')}</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="btn-primary cursor-pointer">
                      {t('import.selectFile')}
                    </label>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep('select')} className="btn-secondary">
                  {t('common.back')}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {step === 'mapping' && uploadedFile && (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader
              title={t('import.step3Title')}
              action={
                <span className="text-sm text-muted-foreground">
                  {uploadedFile.row_count} {t('import.rowsFound')}
                </span>
              }
            />
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('import.mappingInstructions')}</p>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-medium">{t('import.csvColumn')}</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">{t('import.mapsTo')}</th>
                        <th className="text-left py-2 px-4 text-sm font-medium">{t('import.sampleValue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedFile.column_headers.map((header) => {
                        const mapping = columnMappings.find((m) => m.source_column === header)
                        const sampleValue = uploadedFile.sample_data[0]?.[header] || '-'

                        return (
                          <tr key={header} className="border-t">
                            <td className="py-2 px-4 font-mono text-sm">{header}</td>
                            <td className="py-2 px-4">
                              <select
                                value={mapping?.target_field || ''}
                                onChange={(e) => updateMapping(header, e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                              >
                                <option value="">{t('import.doNotImport')}</option>
                                {availableFields.map((field) => (
                                  <option key={field.name} value={field.name}>
                                    {field.label} {field.required && '*'}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-4 text-sm text-muted-foreground truncate max-w-[200px]">
                              {sampleValue}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Required fields warning */}
                {availableFields.filter((f) => f.required).some(
                  (f) => !columnMappings.find((m) => m.target_field === f.name)
                ) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                    {t('import.requiredFieldsWarning')}:
                    <ul className="list-disc list-inside mt-1">
                      {availableFields
                        .filter((f) => f.required && !columnMappings.find((m) => m.target_field === f.name))
                        .map((f) => (
                          <li key={f.name}>{f.label}</li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep('upload')} className="btn-secondary">
                    {t('common.back')}
                  </button>
                  <button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending || columnMappings.length === 0}
                    className="btn-primary"
                  >
                    {importMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      t('import.startImport')
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 'result' && importResult && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader
              title={t('import.step4Title')}
              action={
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    importResult.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : importResult.status === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {importResult.status}
                </span>
              }
            />
            <CardContent>
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{importResult.total_rows}</div>
                    <div className="text-sm text-muted-foreground">{t('import.totalRows')}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.created_count}</div>
                    <div className="text-sm text-green-600">{t('import.created')}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.updated_count}</div>
                    <div className="text-sm text-blue-600">{t('import.updated')}</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.error_count}</div>
                    <div className="text-sm text-red-600">{t('import.errors')}</div>
                  </div>
                </div>

                {/* Duration */}
                {importResult.duration_seconds && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t('import.duration')}: {importResult.duration_seconds}s
                  </p>
                )}

                {/* Error List */}
                {importResult.errors.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-red-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-red-800">{t('import.errorDetails')}</h4>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-4">{t('import.row')}</th>
                            <th className="text-left py-2 px-4">{t('import.errorMessage')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((err, i) => (
                            <tr key={i} className="border-t">
                              <td className="py-2 px-4 font-mono">{err.row_number}</td>
                              <td className="py-2 px-4 text-red-600">
                                {err.errors.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <button onClick={handleReset} className="btn-primary">
                    {t('import.startNewImport')}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
