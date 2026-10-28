import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  LoadingPanel,
  Modal,
  PageHeader,
  RatingInput,
  RatingStars,
  Spinner,
  textareaClass,
} from '../components/ui.tsx';
import { reviewsApi } from '../lib/api.ts';
import { buttonClass } from '../lib/buttonClass.ts';
import { formatDate } from '../lib/format.ts';
import { getApiErrorMessage } from '../lib/http.ts';
import type { Review } from '../types/api.ts';

export function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setReviews(await reviewsApi.mine());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  function openEdit(review: Review): void {
    setEditing(review);
    setRating(review.rating);
    setComment(review.comment ?? '');
    setModalError(null);
  }

  function closeEdit(): void {
    setEditing(null);
    setModalError(null);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editing) return;

    setIsSaving(true);
    setModalError(null);
    setNotice(null);

    try {
      await reviewsApi.update(editing.id, {
        rating,
        comment: comment.trim() || null,
      });
      closeEdit();
      setNotice('Review berhasil diperbarui.');
      await load();
    } catch (updateError) {
      setModalError(getApiErrorMessage(updateError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleting) return;

    setIsSaving(true);
    setModalError(null);
    setNotice(null);

    try {
      await reviewsApi.remove(deleting.id);
      setDeleting(null);
      setNotice('Review berhasil dihapus.');
      await load();
    } catch (deleteError) {
      setModalError(getApiErrorMessage(deleteError));
    } finally {
      setIsSaving(false);
    }
  }

  const hasLoadError = !isLoading && error !== null && reviews.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow="Kontribusiku"
        title="Review Saya"
        description="Kelola review yang sudah kamu tulis. Rating warung akan diperbarui otomatis."
      />

      {error && !hasLoadError ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}

      {isLoading ? (
        <LoadingPanel message="Memuat review kamu..." />
      ) : hasLoadError ? (
        <EmptyState
          icon={MessageSquare}
          title="Review belum bisa dimuat"
          message={error ?? 'Periksa koneksimu lalu coba lagi.'}
          action={
            <Button variant="secondary" onClick={() => void load()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Coba Lagi
            </Button>
          }
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Belum ada review"
          message="Buka warung yang pernah kamu coba, lalu tulis review pertamamu."
          action={
            <Link to="/" className={buttonClass('primary')}>
              Jelajahi warung
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {reviews.map((review) => {
            const wasEdited =
              review.updatedAt !== null && review.updatedAt !== review.createdAt;

            return (
              <Card key={review.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/stalls/${review.stallId}`}
                      className="text-sm font-bold hover:text-primary"
                    >
                      {review.stallName}
                    </Link>
                    <p className="mb-0 mt-0.5 text-[11px] text-text-muted">
                      {wasEdited
                        ? `Diperbarui ${formatDate(review.updatedAt)}`
                        : formatDate(review.createdAt)}
                    </p>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                <p className="mb-3 mt-3 whitespace-pre-line text-sm text-text-muted">
                  {review.comment || 'Tanpa komentar.'}
                </p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-text-muted">{review.likeCount} suka</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" className="h-8 px-2" onClick={() => openEdit(review)}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 text-danger hover:bg-danger-bg"
                      onClick={() => {
                        setDeleting(review);
                        setModalError(null);
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing ? (
        <Modal
          title="Edit review"
          onClose={closeEdit}
          footer={
            <>
              <Button variant="secondary" onClick={closeEdit} disabled={isSaving}>
                Batal
              </Button>
              <Button type="submit" form="edit-review-form" disabled={isSaving}>
                {isSaving ? <Spinner /> : null}
                Simpan
              </Button>
            </>
          }
        >
          <form
            id="edit-review-form"
            className="space-y-4"
            onSubmit={(event) => void handleUpdate(event)}
          >
            <p className="m-0 text-sm text-text-muted">{editing.stallName}</p>
            {modalError ? <Alert tone="error">{modalError}</Alert> : null}
            <RatingInput value={rating} onChange={setRating} />
            <Field label="Komentar" htmlFor="edit-comment" hint="Opsional, maksimal 1000 karakter.">
              <textarea
                id="edit-comment"
                className={textareaClass}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1000}
              />
            </Field>
          </form>
        </Modal>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Hapus review?"
          message={`Review untuk "${deleting.stallName}" akan dihapus permanen.`}
          error={modalError}
          isBusy={isSaving}
          onClose={() => {
            setDeleting(null);
            setModalError(null);
          }}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}
