import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/layout/Card'
import { useToast } from '@/components/ui/feedback/Toast'
import apiClient from '@/api/client'

type PdfUtilityMode = 'pdf-viewer' | 'pdf-download'

interface PdfUtilityPageProps {
  mode: PdfUtilityMode
  source: string
  title?: string
  filename?: string
}

const ALLOWED_SOURCE_PATTERNS: RegExp[] = [
  /^\/quotes\/\d+\/pdf$/,
  /^\/orders\/\d+\/pdf$/,
  /^\/invoices\/\d+\/pdf$/,
  /^\/invoices\/\d+\/inspection-form-pdf$/,
  /^\/deliveries\/\d+\/pdf$/,
  /^\/products\/\d+\/technical-sheet-pdf$/,
  /^\/accounting\/clients\/\d+\/statement\/export\/pdf(\?.*)?$/,
  /^\/accounting\/clients\/\d+\/statement\/export\/bl-pdf(\?.*)?$/,
]

function isAllowedPdfSource(source: string): boolean {
  return ALLOWED_SOURCE_PATTERNS.some((pattern) => pattern.test(source))
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}

export function PdfUtilityPage({ mode, source, title, filename }: PdfUtilityPageProps) {
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasDownloadTriggered, setHasDownloadTriggered] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const computedFilename = useMemo(() => {
    if (filename) return filename
    return `document-${new Date().toISOString().slice(0, 10)}.pdf`
  }, [filename])

  const normalizedTitle = title || 'PDF Document'

  useEffect(() => {
    let currentUrl: string | null = null
    let cancelled = false

    async function loadPdf() {
      if (!isAllowedPdfSource(source)) {
        setErrorMessage('Invalid PDF source.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await apiClient.get<Blob>(source, { responseType: 'blob' })
        const blob = new Blob([response.data], { type: 'application/pdf' })
        currentUrl = URL.createObjectURL(blob)
        if (!cancelled) {
          setPdfUrl(currentUrl)
          setErrorMessage(null)
        }
      } catch {
        if (!cancelled) {
          setErrorMessage('Failed to load PDF document.')
          showError('PDF Error', 'Unable to load PDF.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      cancelled = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [showError, source])

  useEffect(() => {
    if (mode !== 'pdf-download') return
    if (!pdfUrl || hasDownloadTriggered) return
    triggerDownload(pdfUrl, computedFilename)
    setHasDownloadTriggered(true)
  }, [mode, pdfUrl, hasDownloadTriggered, computedFilename])

  const actions = (
    <>
      <button
        className="btn-secondary"
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back()
            return
          }
          navigate({ to: '/dashboard' as any })
        }}
      >
        Back
      </button>
      {pdfUrl && (
        <button
          className="btn-primary"
          onClick={() => triggerDownload(pdfUrl, computedFilename)}
        >
          Download PDF
        </button>
      )}
    </>
  )

  return (
    <PageContainer>
      <PageHeader
        title={mode === 'pdf-download' ? 'PDF Download' : 'PDF Viewer'}
        description={normalizedTitle}
        actions={actions}
      />

      {isLoading && (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading PDF document...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && errorMessage && (
        <Card>
          <CardContent>
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !errorMessage && pdfUrl && (
        <Card>
          <CardContent className="p-2">
            {mode === 'pdf-download' && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Download started. You can also preview the PDF below.
              </div>
            )}
            <iframe
              src={pdfUrl}
              title={normalizedTitle}
              className="w-full h-[75vh] rounded-lg border border-border bg-muted/10"
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}
