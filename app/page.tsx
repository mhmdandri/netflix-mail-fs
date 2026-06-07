"use client";

import { NetflixEmail } from "@/types/netflix-email";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [emails, setEmails] = useState<NetflixEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchEmails = async (mountedRef?: { current: boolean }) => {
    try {
      setLoading(true);

      const res = await fetch("/api/netflix");

      if (!res.ok) {
        throw new Error("Failed to fetch emails");
      }

      const data: NetflixEmail[] = await res.json();

      if (!mountedRef || mountedRef.current) {
        setEmails(data);
        setCurrentPage(1);
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!mountedRef || mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const mounted = { current: true };

    void Promise.resolve().then(() => fetchEmails(mounted));

    return () => {
      mounted.current = false;
    };
  }, []);

  const totalPages = Math.ceil(emails.length / ITEMS_PER_PAGE);

  const paginatedEmails = emails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">Netflix Emails</h1>
            <p className="text-xs text-muted-foreground">
              {emails.length} email ditemukan
            </p>
          </div>

          <button
            onClick={() => void fetchEmails()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </button>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {loading && (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Mengambil email...</p>
          </div>
        )}

        {!loading && emails.length === 0 && (
          <div className="rounded-2xl border p-6 text-center">
            <Mail className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tidak ada email ditemukan
            </p>
          </div>
        )}

        {!loading &&
          paginatedEmails.map((email, index) => {
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;

            return (
              <div
                key={`${email.subject}-${globalIndex}`}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <button
                  onClick={() =>
                    setSelectedEmail(
                      selectedEmail === globalIndex ? null : globalIndex,
                    )
                  }
                  className="w-full p-4 text-left"
                >
                  <div className="flex gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                      <Mail className="size-5 text-red-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-sm font-semibold">
                        {email.subject}
                      </h2>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {email.from}
                      </p>

                      {email.date && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(email.date).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {selectedEmail === globalIndex && (
                  <div className="border-t bg-muted/30 p-4">
                    {email.html ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: email.html,
                        }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap warp-break-words text-xs">
                        {email.text}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && totalPages > 1 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                Prev
              </button>

              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentPage(index + 1);
                    setSelectedEmail(null);
                  }}
                  className={`size-9 rounded-lg border text-sm transition ${
                    currentPage === index + 1
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
