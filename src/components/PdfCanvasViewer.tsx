import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  Download
} from 'lucide-react';

// Configure the worker URL for pdfjs-dist
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

/**
 * Safely verify whether a Uint8Array has a valid, non-detached underlying ArrayBuffer.
 */
function isBufferUsable(bytes: Uint8Array | undefined | null): boolean {
  if (!bytes) return false;
  if (bytes.byteLength === 0) return false;
  if (!bytes.buffer || bytes.buffer.byteLength === 0) return false;
  try {
    if ('detached' in bytes.buffer && (bytes.buffer as any).detached) return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * Creates an independent Uint8Array with its own newly-allocated ArrayBuffer.
 * This guarantees that transferring the clone's buffer to a Web Worker will never
 * detach or corrupt the source buffer.
 */
function cloneBytesForWorker(source: Uint8Array): Uint8Array {
  if (!isBufferUsable(source)) {
    throw new Error('Source byte buffer is empty or detached.');
  }
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy;
}

/**
 * Custom PDFDataRangeTransport implementation for Supabase Storage signed URLs.
 * Bypasses browser CORS restrictions on 'Accept-Ranges' and 'Content-Range' response headers
 * by requesting exact byte chunks via standard fetch(url, { headers: { Range } })
 * and supplying them directly to PDF.js via this.onDataRange(begin, chunk).
 */
class SupabaseRangeTransport extends pdfjsLib.PDFDataRangeTransport {
  private fileUrl: string;
  private signal: AbortSignal;
  private onRangeReceived?: (bytesCount: number) => void;

  constructor(
    length: number,
    initialData: Uint8Array,
    fileUrl: string,
    signal: AbortSignal,
    onRangeReceived?: (bytesCount: number) => void
  ) {
    super(length, initialData);
    this.fileUrl = fileUrl;
    this.signal = signal;
    this.onRangeReceived = onRangeReceived;
  }

  requestDataRange(begin: number, end: number) {
    if (this.signal.aborted) return;

    fetch(this.fileUrl, {
      headers: { Range: `bytes=${begin}-${end - 1}` },
      signal: this.signal,
    })
      .then(async (res) => {
        if (!res.ok && res.status !== 206) {
          throw new Error(`Range request failed (HTTP ${res.status} ${res.statusText})`);
        }
        const buf = await res.arrayBuffer();
        if (this.signal.aborted) return;
        this.onRangeReceived?.(buf.byteLength);
        this.onDataRange(begin, new Uint8Array(buf));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('[PdfCanvasViewer] Range request error:', err);
        }
      });
  }

  abort() {
    // Range transport abort
  }
}

// In-session byte cache to prevent duplicate network downloads across viewer sessions.
// The cached Uint8Array is NEVER passed directly to getDocument() to ensure its buffer
// is never transferred or detached by PDF.js worker transport.
const pdfBytesCache = new Map<string, Uint8Array>();

interface PdfCanvasViewerProps {
  url: string;
  title: string;
  materialId?: string;
  filePath?: string;
  urlResolutionTimeMs?: number | null;
  onRefreshSignedUrl?: () => void;
  onDownload?: () => void;
  className?: string;
}

type LoadingState = 
  | 'resolving-url'
  | 'loading-first-page'
  | 'rendering-pages'
  | 'ready'
  | 'error';

interface ActiveTaskInfo {
  pageNumber: number;
  task: any;
  promise: Promise<void>;
  canvas: HTMLCanvasElement;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  url,
  title,
  materialId,
  filePath,
  urlResolutionTimeMs,
  onRefreshSignedUrl,
  onDownload,
  className = '',
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  
  // Accurate loading & status states
  const [loadingState, setLoadingState] = useState<LoadingState>('loading-first-page');
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing document...');
  const [error, setError] = useState<string | null>(null);

  // Aspect ratio estimate (height / width)
  const [aspectRatio, setAspectRatio] = useState<number>(1.414);

  // DOM & PDF references
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const activeRenderTasksRef = useRef<Map<number, ActiveTaskInfo>>(new Map());
  const canvasRenderTasksRef = useRef<WeakMap<HTMLCanvasElement, ActiveTaskInfo>>(new WeakMap());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const renderedPageScalesRef = useRef<Map<number, number>>(new Map());
  const inProgressPageScalesRef = useRef<Map<number, number>>(new Map());
  const pageRenderOpIdsRef = useRef<Map<number, number>>(new Map());
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Load attempt lifecycle tracker to prevent race conditions or stale callbacks from corrupting state
  const loadAttemptIdRef = useRef<number>(0);

  // Timing tracking
  const loadStartTimeRef = useRef<number>(0);

  // Compute a stable cache key for this document
  const getCacheKey = useCallback(() => {
    if (materialId) return `mat:${materialId}`;
    if (filePath) return `path:${filePath}`;
    try {
      const parsed = new URL(url);
      return `url:${parsed.origin}${parsed.pathname}`;
    } catch {
      return `url:${url.split('?')[0]}`;
    }
  }, [materialId, filePath, url]);

  // Cancel any active render tasks and return a promise settling when all tasks have settled
  const cancelActiveRenderTasks = useCallback(() => {
    const settlePromises: Promise<any>[] = [];
    activeRenderTasksRef.current.forEach(({ task, promise }) => {
      try {
        task.cancel();
      } catch {
        // ignore cancellation error
      }
      settlePromises.push(promise.catch(() => {}));
    });
    activeRenderTasksRef.current.clear();
    inProgressPageScalesRef.current.clear();
    return Promise.all(settlePromises);
  }, []);

  // Render a specific page onto its associated canvas safely without race conditions
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      const doc = pdfDocRef.current;
      if (!doc || !isMountedRef.current || !canvas) return;

      // 1. Skip if already successfully rendered for the exact current scale
      if (
        renderedPagesRef.current.has(pageNumber) &&
        renderedPageScalesRef.current.get(pageNumber) === scale
      ) {
        return;
      }

      // 2. Prevent duplicate concurrent render calls for the exact same page & scale
      if (inProgressPageScalesRef.current.get(pageNumber) === scale) {
        return;
      }

      // Increment render operation ID for this page to detect superseded operations
      const renderOpId = (pageRenderOpIdsRef.current.get(pageNumber) || 0) + 1;
      pageRenderOpIdsRef.current.set(pageNumber, renderOpId);
      inProgressPageScalesRef.current.set(pageNumber, scale);

      // 3. Before starting a new render on a canvas, cancel the previous active render task
      // on THIS canvas and safely wait for its promise to settle before reusing that canvas.
      const existingCanvasTask = canvasRenderTasksRef.current.get(canvas);
      if (existingCanvasTask) {
        try {
          existingCanvasTask.task.cancel();
        } catch {}
        try {
          await existingCanvasTask.promise;
        } catch {}
      }

      // Also cancel any previous task for this pageNumber that was running on another canvas
      const existingPageTask = activeRenderTasksRef.current.get(pageNumber);
      if (existingPageTask && existingPageTask.canvas !== canvas) {
        try {
          existingPageTask.task.cancel();
        } catch {}
        try {
          await existingPageTask.promise;
        } catch {}
      }

      // 4. In React effect cleanup / lifecycle checks: prevent stale asynchronous operations from updating state
      if (
        !isMountedRef.current ||
        pdfDocRef.current !== doc ||
        pageRenderOpIdsRef.current.get(pageNumber) !== renderOpId
      ) {
        return;
      }

      let renderTask: any = null;

      try {
        const page = await doc.getPage(pageNumber);
        if (
          !isMountedRef.current ||
          pdfDocRef.current !== doc ||
          pageRenderOpIdsRef.current.get(pageNumber) !== renderOpId
        ) {
          inProgressPageScalesRef.current.delete(pageNumber);
          return;
        }

        const containerWidth = containerRef.current?.clientWidth || 800;
        
        // Calculate responsive scale based on container width
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        let fitScale = (containerWidth - 48) / unscaledViewport.width;
        if (fitScale <= 0 || isNaN(fitScale)) fitScale = 1.0;
        fitScale = Math.min(fitScale, 1.4);

        const effectiveScale = fitScale * scale;
        const viewport = page.getViewport({ scale: effectiveScale });

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          inProgressPageScalesRef.current.delete(pageNumber);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        // Double-check canvas immediately before page.render()
        const lateCanvasTask = canvasRenderTasksRef.current.get(canvas);
        if (lateCanvasTask) {
          try {
            lateCanvasTask.task.cancel();
          } catch {}
          try {
            await lateCanvasTask.promise;
          } catch {}
          if (
            !isMountedRef.current ||
            pdfDocRef.current !== doc ||
            pageRenderOpIdsRef.current.get(pageNumber) !== renderOpId
          ) {
            inProgressPageScalesRef.current.delete(pageNumber);
            return;
          }
        }

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        const taskInfo: ActiveTaskInfo = {
          pageNumber,
          task: renderTask,
          promise: renderTask.promise,
          canvas,
        };

        activeRenderTasksRef.current.set(pageNumber, taskInfo);
        canvasRenderTasksRef.current.set(canvas, taskInfo);

        await renderTask.promise;

        if (
          !isMountedRef.current ||
          pdfDocRef.current !== doc ||
          pageRenderOpIdsRef.current.get(pageNumber) !== renderOpId
        ) {
          return;
        }

        renderedPagesRef.current.add(pageNumber);
        renderedPageScalesRef.current.set(pageNumber, scale);

        if (pageNumber === 1) {
          const totalFirstPage = performance.now() - loadStartTimeRef.current;
          console.log(
            `%c[PdfTiming] [4/4] First page rendered on canvas in ${totalFirstPage.toFixed(1)}ms`,
            'color: #16a34a; font-weight: bold; background-color: #f0fdf4; padding: 2px 6px; border-radius: 4px;'
          );
          if (isMountedRef.current) {
            setLoadingState('ready');
          }
        }
      } catch (err: any) {
        // Differentiate cancellation errors from genuine rendering errors
        const isCancelled =
          err?.name === 'RenderingCancelledException' ||
          err?.name === 'AbortException' ||
          err?.name === 'AbortError' ||
          err?.message?.includes('Rendering cancelled') ||
          err?.message?.includes('cancelled');

        if (!isCancelled && isMountedRef.current && pdfDocRef.current === doc) {
          console.error(`[PdfCanvasViewer] Render error on page ${pageNumber}:`, err);
        }
      } finally {
        if (renderTask) {
          if (activeRenderTasksRef.current.get(pageNumber)?.task === renderTask) {
            activeRenderTasksRef.current.delete(pageNumber);
          }
          if (canvasRenderTasksRef.current.get(canvas)?.task === renderTask) {
            canvasRenderTasksRef.current.delete(canvas);
          }
        }
        if (pageRenderOpIdsRef.current.get(pageNumber) === renderOpId) {
          inProgressPageScalesRef.current.delete(pageNumber);
        }
      }
    },
    [scale]
  );

  // Initialize and load the document reliably
  const loadDocument = useCallback(
    async (bypassCache = false) => {
      if (!url) {
        setError('No document URL provided.');
        setLoadingState('error');
        return;
      }

      // Increment attempt ID for this specific task lifecycle
      const attemptId = ++loadAttemptIdRef.current;
      loadStartTimeRef.current = performance.now();
      const cacheKey = getCacheKey();

      if (urlResolutionTimeMs != null) {
        console.log(
          `%c[PdfTiming] [1/4] Time to resolve signed URL: ${urlResolutionTimeMs.toFixed(1)}ms`,
          'color: #0284c7; font-weight: bold; background-color: #f0f9ff; padding: 2px 6px; border-radius: 4px;'
        );
      }

      // 1. Abort previous in-flight fetch safely
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 2. Cancel active render tasks
      cancelActiveRenderTasks();

      // 3. Clean up previous loading task and doc safely
      const prevTask = loadingTaskRef.current;
      loadingTaskRef.current = null;
      if (prevTask) {
        try {
          prevTask.destroy().catch(() => {});
        } catch {
          // ignore
        }
      }

      const prevDoc = pdfDocRef.current;
      pdfDocRef.current = null;
      if (prevDoc) {
        try {
          prevDoc.cleanup();
        } catch {
          // ignore
        }
      }

      // Reset viewer state
      setError(null);
      setNumPages(0);
      setCurrentPage(1);
      renderedPagesRef.current.clear();
      renderedPageScalesRef.current.clear();
      inProgressPageScalesRef.current.clear();
      pageRenderOpIdsRef.current.clear();

      try {
        const cMapUrl = import.meta.env.DEV
          ? '/node_modules/pdfjs-dist/cmaps/'
          : `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`;

        const standardFontDataUrl = import.meta.env.DEV
          ? '/node_modules/pdfjs-dist/standard_fonts/'
          : `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`;

        let loadingTask: any;

        // Check in-memory cache first to avoid re-fetching within session
        const cached = pdfBytesCache.get(cacheKey);
        if (!bypassCache && cached && isBufferUsable(cached)) {
          console.log(`[PdfCanvasViewer] In-memory cache hit for ${cacheKey}`);
          setLoadingState('loading-first-page');
          setLoadingMessage('Loading from fast in-memory cache...');

          const workerBytes = cloneBytesForWorker(cached);
          loadingTask = pdfjsLib.getDocument({
            data: workerBytes,
            cMapUrl,
            cMapPacked: true,
            standardFontDataUrl,
            enableXfa: false,
          });
        } else {
          // Discard stale cache entry
          if (pdfBytesCache.has(cacheKey)) {
            pdfBytesCache.delete(cacheKey);
          }

          setLoadingState('loading-first-page');
          setLoadingMessage('Loading first page...');

          // Step 1: Probe HTTP Range Request support on the Supabase signed URL
          const tProbeStart = performance.now();
          let probeRes: Response;
          try {
            probeRes = await fetch(url, {
              headers: { Range: 'bytes=0-65535' },
              signal: abortController.signal,
            });
          } catch (fetchErr: any) {
            if (attemptId !== loadAttemptIdRef.current || abortController.signal.aborted) {
              return;
            }
            throw fetchErr;
          }

          const firstBytesMs = performance.now() - tProbeStart;
          console.log(
            `%c[PdfTiming] [2/4] Time until first response bytes: ${firstBytesMs.toFixed(1)}ms (HTTP ${probeRes.status})`,
            'color: #0284c7; font-weight: bold; background-color: #f0f9ff; padding: 2px 6px; border-radius: 4px;'
          );

          if (attemptId !== loadAttemptIdRef.current || abortController.signal.aborted) {
            return;
          }

          if (probeRes.status === 206) {
            // Range requests VERIFIED and supported by Supabase Storage!
            const initialBuf = await probeRes.arrayBuffer();
            if (attemptId !== loadAttemptIdRef.current || abortController.signal.aborted) {
              return;
            }
            const initialData = new Uint8Array(initialBuf);

            // Determine total document length
            let totalLength = 0;
            const contentRange = probeRes.headers.get('content-range');
            if (contentRange) {
              const match = /bytes \d+-\d+\/(\d+)/.exec(contentRange);
              if (match && match[1]) {
                totalLength = parseInt(match[1], 10);
              }
            }

            if (!totalLength) {
              try {
                const headRes = await fetch(url, { method: 'HEAD', signal: abortController.signal });
                const cl = headRes.headers.get('content-length');
                if (cl) totalLength = parseInt(cl, 10);
              } catch {
                // ignore
              }
            }

            if (!totalLength || isNaN(totalLength)) {
              totalLength = initialData.byteLength;
            }

            const docMb = (totalLength / (1024 * 1024)).toFixed(1);
            setLoadingMessage(`Streaming first page via HTTP Range Requests (${docMb} MB doc)...`);

            const transport = new SupabaseRangeTransport(
              totalLength,
              initialData,
              url,
              abortController.signal
            );

            loadingTask = pdfjsLib.getDocument({
              range: transport,
              disableAutoFetch: true,
              cMapUrl,
              cMapPacked: true,
              standardFontDataUrl,
              enableXfa: false,
            });
          } else {
            // Server did not return 206 (Range requests unsupported on this URL)
            console.warn(`[PdfCanvasViewer] HTTP Range not supported (Status ${probeRes.status}). Downloading full file.`);
            setLoadingMessage('Downloading document...');

            let pdfBytes: Uint8Array;
            if (probeRes.status === 200 && probeRes.body && typeof probeRes.body.getReader === 'function') {
              const contentLengthHeader = probeRes.headers.get('content-length');
              const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
              const reader = probeRes.body.getReader();
              const chunks: Uint8Array[] = [];
              let loadedBytes = 0;

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  if (attemptId !== loadAttemptIdRef.current || abortController.signal.aborted) {
                    try { reader.cancel(); } catch {}
                    return;
                  }
                  chunks.push(value);
                  loadedBytes += value.length;
                  if (isMountedRef.current && attemptId === loadAttemptIdRef.current && totalBytes > 0) {
                    const loadedMb = (loadedBytes / (1024 * 1024)).toFixed(1);
                    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
                    const percent = Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
                    setLoadingMessage(`Downloading document: ${loadedMb} / ${totalMb} MB (${percent}%)...`);
                  }
                }
              }

              const combined = new Uint8Array(loadedBytes);
              let offset = 0;
              for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
              }
              pdfBytes = combined;
            } else {
              const fullRes = await fetch(url, { signal: abortController.signal });
              const ab = await fullRes.arrayBuffer();
              pdfBytes = new Uint8Array(ab);
            }

            if (attemptId !== loadAttemptIdRef.current || abortController.signal.aborted) {
              return;
            }

            // Cache pristine copy
            const pristine = cloneBytesForWorker(pdfBytes);
            pdfBytesCache.set(cacheKey, pristine);

            loadingTask = pdfjsLib.getDocument({
              data: cloneBytesForWorker(pdfBytes),
              cMapUrl,
              cMapPacked: true,
              standardFontDataUrl,
              enableXfa: false,
            });
          }
        }

        if (attemptId !== loadAttemptIdRef.current || !isMountedRef.current) {
          try {
            loadingTask.destroy().catch(() => {});
          } catch {}
          return;
        }
        loadingTaskRef.current = loadingTask;

        const doc = await loadingTask.promise;

        if (attemptId !== loadAttemptIdRef.current || !isMountedRef.current) {
          try {
            doc.cleanup();
            loadingTask.destroy().catch(() => {});
          } catch {}
          return;
        }

        const totalDocTime = performance.now() - loadStartTimeRef.current;
        console.log(
          `%c[PdfTiming] [3/4] Document structure parsed in ${totalDocTime.toFixed(1)}ms (${doc.numPages} total pages)`,
          'color: #0284c7; font-weight: bold; background-color: #f0f9ff; padding: 2px 6px; border-radius: 4px;'
        );

        pdfDocRef.current = doc;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoadingState('rendering-pages');
        setLoadingMessage('Rendering first page on canvas...');

        // Pre-fetch page 1 aspect ratio to size placeholders accurately
        try {
          const page1 = await doc.getPage(1);
          if (attemptId === loadAttemptIdRef.current && isMountedRef.current) {
            const unscaledViewport = page1.getViewport({ scale: 1.0 });
            if (unscaledViewport.width > 0) {
              setAspectRatio(unscaledViewport.height / unscaledViewport.width);
            }
          }
        } catch {
          // fallback to standard aspect ratio
        }

        // Fast fallback to ensure 'ready' state if canvas doesn't trigger immediately
        setTimeout(() => {
          if (attemptId === loadAttemptIdRef.current && isMountedRef.current) {
            setLoadingState((prev) => (prev === 'rendering-pages' ? 'ready' : prev));
          }
        }, 1200);

      } catch (err: any) {
        // Do not display an error banner if the load was cancelled/aborted due to unmount, remount, or superseded attempt
        if (
          attemptId !== loadAttemptIdRef.current ||
          !isMountedRef.current ||
          err?.name === 'AbortError' || 
          err?.name === 'AbortException' || 
          err?.message === 'Loading aborted'
        ) {
          return;
        }

        console.error('[PdfCanvasViewer] Error loading document:', err);
        setError(err?.message || 'Failed to load PDF document.');
        setLoadingState('error');
      }
    },
    [url, getCacheKey, cancelActiveRenderTasks, urlResolutionTimeMs]
  );

  // Mount effect with comprehensive lifecycle cleanup
  useEffect(() => {
    isMountedRef.current = true;
    loadDocument(false);

    return () => {
      isMountedRef.current = false;
      loadAttemptIdRef.current += 1; // Invalidate any in-flight attempt
      cancelActiveRenderTasks();
      renderedPagesRef.current.clear();
      renderedPageScalesRef.current.clear();
      inProgressPageScalesRef.current.clear();
      pageRenderOpIdsRef.current.clear();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy().catch(() => {});
        } catch {
          // ignore
        }
        loadingTaskRef.current = null;
      }
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.cleanup();
        } catch {
          // ignore
        }
        pdfDocRef.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [loadDocument, cancelActiveRenderTasks]);

  // Progressive Rendering via IntersectionObserver for Continuous Scroll ('all' mode)
  useEffect(() => {
    if (!pdfDoc || viewMode !== 'all') return;

    const container = containerRef.current;
    if (!container) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page'));
            if (
              pageNum &&
              (!renderedPagesRef.current.has(pageNum) ||
                renderedPageScalesRef.current.get(pageNum) !== scale)
            ) {
              const canvas = canvasRefs.current.get(pageNum);
              if (canvas) {
                renderPage(pageNum, canvas);
              }
            }
          }
        });
      },
      {
        root: container,
        rootMargin: '600px 0px', // Lookahead buffer: loads pages right before user scrolls to them
        threshold: 0.01,
      }
    );

    observerRef.current = observer;

    // Observe all page placeholder elements
    const pageContainers = container.querySelectorAll('[data-page]');
    pageContainers.forEach((el) => observer.observe(el));

    // Force immediate render of page 1 if not already triggered
    const page1Canvas = canvasRefs.current.get(1);
    if (
      page1Canvas &&
      (!renderedPagesRef.current.has(1) || renderedPageScalesRef.current.get(1) !== scale)
    ) {
      renderPage(1, page1Canvas);
    }

    return () => {
      observer.disconnect();
      if (observerRef.current === observer) {
        observerRef.current = null;
      }
    };
  }, [pdfDoc, viewMode, scale, renderPage]);

  // Single page render effect
  useEffect(() => {
    if (!pdfDoc || viewMode !== 'single') return;

    const canvas = canvasRefs.current.get(currentPage);
    if (canvas) {
      renderPage(currentPage, canvas);
    }

    return () => {
      // In single page mode, cancel active render task on current page during page transition
      const currentTask = activeRenderTasksRef.current.get(currentPage);
      if (currentTask) {
        try {
          currentTask.task.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, viewMode, currentPage, scale, renderPage]);

  // Handle Zoom / Scale changes
  const handleScaleChange = useCallback(
    (newScale: number) => {
      cancelActiveRenderTasks();
      renderedPagesRef.current.clear();
      renderedPageScalesRef.current.clear();
      inProgressPageScalesRef.current.clear();
      setScale(newScale);
    },
    [cancelActiveRenderTasks]
  );

  const handleZoomIn = () => handleScaleChange(Math.min(2.5, +(scale + 0.2).toFixed(1)));
  const handleZoomOut = () => handleScaleChange(Math.max(0.6, +(scale - 0.2).toFixed(1)));
  const handleResetZoom = () => handleScaleChange(1.1);

  // Scroll listener to update toolbar page number smoothly
  const handleContainerScroll = useCallback(() => {
    if (viewMode !== 'all' || !containerRef.current) return;

    const container = containerRef.current;
    const centerY = container.scrollTop + container.clientHeight / 2;

    for (let p = 1; p <= numPages; p++) {
      const el = document.getElementById(`pdf-page-container-${p}`);
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (centerY >= top && centerY <= bottom) {
          if (currentPage !== p) {
            setCurrentPage(p);
          }
          break;
        }
      }
    }
  }, [viewMode, numPages, currentPage]);

  // Pagination handlers
  const handlePrevPage = () => {
    const next = Math.max(1, currentPage - 1);
    setCurrentPage(next);
    if (viewMode === 'all') {
      const target = document.getElementById(`pdf-page-container-${next}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNextPage = () => {
    const next = Math.min(numPages, currentPage + 1);
    setCurrentPage(next);
    if (viewMode === 'all') {
      const target = document.getElementById(`pdf-page-container-${next}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrevPage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, currentPage, scale]);

  // Safe retry handler: evicts cache, calls refresh callback, and starts a fresh load lifecycle
  const handleRetry = useCallback(() => {
    const cacheKey = getCacheKey();
    pdfBytesCache.delete(cacheKey);
    setError(null);
    cancelActiveRenderTasks();
    renderedPagesRef.current.clear();
    renderedPageScalesRef.current.clear();
    inProgressPageScalesRef.current.clear();
    pageRenderOpIdsRef.current.clear();
    if (onRefreshSignedUrl) {
      onRefreshSignedUrl();
    }
    loadDocument(true);
  }, [getCacheKey, onRefreshSignedUrl, loadDocument, cancelActiveRenderTasks]);

  return (
    <div className={`flex flex-col h-full w-full bg-[#1F2428] text-white relative select-none ${className}`}>
      {/* Viewer Toolbar */}
      <div className="bg-[#2D333B] border-b border-[#444C56] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 z-10 text-xs shadow-xs">
        {/* Page navigation controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="pdf-toolbar-prev-btn"
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || (loadingState !== 'ready' && loadingState !== 'rendering-pages') || !!error}
            className="p-1 sm:px-2 sm:py-1 rounded-md bg-[#22272E] hover:bg-[#373E47] disabled:opacity-40 disabled:hover:bg-[#22272E] border border-[#444C56] transition-colors cursor-pointer flex items-center gap-1"
            title="Previous Page (←)"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#E6EDF3]" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <span className="font-mono text-[11px] sm:text-xs text-[#ADBAC7] px-1.5 py-0.5 rounded bg-[#22272E] border border-[#444C56]">
            {loadingState !== 'ready' && loadingState !== 'rendering-pages' ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-[#FED7AA]" />
                <span>Loading...</span>
              </span>
            ) : (
              <>
                Page <span className="text-white font-bold">{currentPage}</span> / {numPages || 1}
              </>
            )}
          </span>

          <button
            id="pdf-toolbar-next-btn"
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= numPages || (loadingState !== 'ready' && loadingState !== 'rendering-pages') || !!error}
            className="p-1 sm:px-2 sm:py-1 rounded-md bg-[#22272E] hover:bg-[#373E47] disabled:opacity-40 disabled:hover:bg-[#22272E] border border-[#444C56] transition-colors cursor-pointer flex items-center gap-1"
            title="Next Page (→)"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#E6EDF3]" />
          </button>
        </div>

        {/* View Mode Toggle: Continuous Scroll / Single Page */}
        <div className="hidden md:flex items-center gap-1 bg-[#22272E] p-0.5 rounded-lg border border-[#444C56]">
          <button
            id="pdf-mode-all-btn"
            type="button"
            onClick={() => {
              cancelActiveRenderTasks();
              renderedPagesRef.current.clear();
              renderedPageScalesRef.current.clear();
              inProgressPageScalesRef.current.clear();
              setViewMode('all');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              viewMode === 'all' ? 'bg-[#C2410C] text-white' : 'text-[#ADBAC7] hover:text-white'
            }`}
          >
            Continuous Scroll
          </button>
          <button
            id="pdf-mode-single-btn"
            type="button"
            onClick={() => {
              cancelActiveRenderTasks();
              renderedPagesRef.current.clear();
              renderedPageScalesRef.current.clear();
              inProgressPageScalesRef.current.clear();
              setViewMode('single');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              viewMode === 'single' ? 'bg-[#C2410C] text-white' : 'text-[#ADBAC7] hover:text-white'
            }`}
          >
            Single Page
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            id="pdf-zoom-out-btn"
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.6 || (loadingState !== 'ready' && loadingState !== 'rendering-pages')}
            className="p-1 rounded bg-[#22272E] hover:bg-[#373E47] disabled:opacity-40 border border-[#444C56] transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5 text-[#E6EDF3]" />
          </button>

          <button
            id="pdf-zoom-reset-btn"
            type="button"
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 font-mono text-[11px] rounded bg-[#22272E] hover:bg-[#373E47] border border-[#444C56] text-[#ADBAC7] hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            id="pdf-zoom-in-btn"
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 2.5 || (loadingState !== 'ready' && loadingState !== 'rendering-pages')}
            className="p-1 rounded bg-[#22272E] hover:bg-[#373E47] disabled:opacity-40 border border-[#444C56] transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5 text-[#E6EDF3]" />
          </button>
        </div>
      </div>

      {/* Main Canvas Document Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6 flex flex-col items-center bg-[#1C2128]"
        tabIndex={0}
      >
        {/* Loading Spinner & Accurate Status Display */}
        {loadingState !== 'ready' && loadingState !== 'rendering-pages' && !error ? (
          <div className="my-auto text-center p-8 max-w-md w-full bg-[#22272E]/90 rounded-2xl border border-[#444C56] shadow-xl">
            <Loader2 className="w-10 h-10 animate-spin text-[#FED7AA] mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1.5">
              {loadingState === 'resolving-url'
                ? 'Resolving Secure URL'
                : loadingState === 'loading-first-page'
                ? 'Loading First Page'
                : 'Rendering Pages'}
            </p>
            <p className="text-xs text-[#ADBAC7] leading-relaxed">{loadingMessage}</p>
          </div>
        ) : error ? (
          /* Error & Retry Display */
          <div className="my-auto text-center p-8 max-w-md bg-[#22272E] rounded-xl border border-[#F85149]/40 shadow-lg">
            <AlertCircle className="w-10 h-10 text-[#F85149] mx-auto mb-3" />
            <p className="text-sm font-bold text-white mb-1">Unable to Load PDF</p>
            <p className="text-xs text-[#ADBAC7] mb-4 leading-relaxed">{error}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                id="pdf-retry-btn"
                type="button"
                onClick={handleRetry}
                className="px-3.5 py-1.5 rounded-lg bg-[#373E47] hover:bg-[#444C56] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              {onDownload && (
                <button
                  id="pdf-download-fallback-btn"
                  type="button"
                  onClick={onDownload}
                  className="px-3.5 py-1.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'all' ? (
          /* Continuous Scroll: Progressive Rendering via IntersectionObserver */
          <div className="space-y-6 flex flex-col items-center w-full">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={`page-container-${pageNum}`}
                id={`pdf-page-container-${pageNum}`}
                data-page={pageNum}
                className="flex flex-col items-center relative group"
              >
                {/* Page Number Label */}
                <div className="text-[10px] font-mono font-semibold text-[#768390] mb-1.5 px-2 py-0.5 rounded bg-[#22272E] border border-[#444C56]">
                  Page {pageNum} of {numPages}
                </div>

                {/* Canvas Container with calculated aspect-ratio minHeight to prevent layout shift */}
                <div 
                  className="bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden border border-[#444C56]/50 flex items-center justify-center min-w-[280px]"
                  style={{
                    minHeight: `min(700px, calc((100vw - 48px) * ${aspectRatio}))`,
                  }}
                >
                  <canvas
                    id={`pdf-canvas-page-${pageNum}`}
                    ref={(el) => {
                      if (el) {
                        canvasRefs.current.set(pageNum, el);
                        if (
                          pageNum === 1 &&
                          pdfDocRef.current &&
                          !renderedPagesRef.current.has(1) &&
                          !inProgressPageScalesRef.current.has(1)
                        ) {
                          renderPage(1, el);
                        }
                      } else {
                        canvasRefs.current.delete(pageNum);
                      }
                    }}
                    className="block"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single Page Mode */
          <div className="my-auto flex flex-col items-center">
            <div className="text-[10px] font-mono font-semibold text-[#768390] mb-1.5 px-2 py-0.5 rounded bg-[#22272E] border border-[#444C56]">
              Page {currentPage} of {numPages}
            </div>

            <div className="bg-white rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden border border-[#444C56]/50">
              <canvas
                key={`pdf-canvas-single-${currentPage}`}
                id={`pdf-canvas-single-${currentPage}`}
                ref={(el) => {
                  if (el) {
                    canvasRefs.current.set(currentPage, el);
                  } else {
                    canvasRefs.current.delete(currentPage);
                  }
                }}
                className="block"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
