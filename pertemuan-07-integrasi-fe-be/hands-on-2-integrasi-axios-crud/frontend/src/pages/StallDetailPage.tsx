import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Flag as FlagIcon,
  Heart,
  MapPin,
  MessageSquare,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingPanel,
  Modal,
  RatingInput,
  RatingStars,
  Spinner,
  textareaClass,
} from '../components/ui.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { menuApi, flagsApi, reviewsApi, stallsApi } from '../lib/api.ts';
import { formatCurrency, formatDate, formatRating } from '../lib/format.ts';
import { getApiErrorMessage } from '../lib/http.ts';
import type { MenuItem, Review, Stall } from '../types/api.ts';

export function StallDetailPage() {
  const { id } = useParams();
  const stallId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stall, setStall] = useState<Stall | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [flaggingReview, setFlaggingReview] = useState<Review | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isInteger(stallId) || stallId <= 0) {
      setError('Warung yang kamu cari tidak ditemukan.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [stallData, menuData, reviewData] = await Promise.all([
        stallsApi.get(stallId),
        menuApi.list({ stallId }),
        reviewsApi.byStall(stallId),
      ]);
      setStall(stallData);
      setMenus(menuData);
      setReviews(reviewData);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [stallId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const isCustomer = user?.role === 'customer';
  const hasReviewed = Boolean(user && reviews.some((review) => review.userId === user.id));

  async function handleCreateReview(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmittingReview(true);
    setError(null);
    setNotice(null);

    try {
      await reviewsApi.create(stallId, {
        rating,
        comment: comment.trim() || null,
      });
      setComment('');
      setRating(5);
      setNotice('Review berhasil dikirim.');
      await load();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleLike(review: Review): Promise<void> {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/stalls/${stallId}`)}`);
      return;
    }

    if (!isCustomer) {
      setError('Hanya pelanggan yang dapat menyukai review.');
      return;
    }

    setError(null);

    try {
      const state = review.likedByMe
        ? await reviewsApi.unlike(review.id)
        : await reviewsApi.like(review.id);

      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? { ...item, likedByMe: state.liked, likeCount: state.likeCount }
            : item,
        ),
      );
    } catch (likeError) {
      setError(getApiErrorMessage(likeError));
    }
  }

  async function handleFlag(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!flaggingReview) return;

    setIsSubmittingFlag(true);
    setModalError(null);

    try {
      await flagsApi.create(flaggingReview.id, {
        reason: flagReason.trim() || null,
      });
      setFlaggingReview(null);
      setFlagReason('');
      setNotice('Laporan berhasil dikirim. Admin akan meninjaunya.');
    } catch (flagError) {
      setModalError(getApiErrorMessage(flagError));
    } finally {
      setIsSubmittingFlag(false);
    }
  }

  function closeFlagModal(): void {
    setFlaggingReview(null);
    setFlagReason('');
    setModalError(null);
  }

  if (isLoading) {
    return <LoadingPanel message="Memuat detail warung..." />;
  }

  if (!stall) {
    return (
      <EmptyState
        icon={Store}
        title="Warung tidak dapat dibuka"
        message={error ?? 'Data warung tidak ditemukan.'}
        action={
          <Button variant="secondary" onClick={() => void load()}>
            Coba Lagi
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke daftar warung
      </Link>

      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {stall.category ? <Badge tone="primary">{stall.category}</Badge> : null}
              {stall.isPopular ? <Badge tone="warning">Populer</Badge> : null}
              <Badge>{stall.reviewCount} review</Badge>
            </div>
            <h1 className="mb-1 text-3xl font-extrabold">{stall.name}</h1>
            <p className="mb-4 text-sm text-text-muted">Dikelola oleh {stall.ownerName}</p>
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-text-muted">
              {stall.description || 'Pemilik warung belum menambahkan deskripsi.'}
            </p>
            <p className="m-0 inline-flex items-center gap-1.5 text-sm text-text-muted">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              {stall.location || 'Lokasi belum diisi'}
            </p>
          </div>

          <div className="flex min-w-40 flex-col items-center rounded-control bg-surface-muted px-5 py-4">
            <span className="font-heading text-4xl font-extrabold text-primary-dark">
              {formatRating(stall.avgRating)}
            </span>
            <RatingStars rating={stall.avgRating} className="my-1" />
            <span className="text-xs font-semibold text-text-muted">
              dari {stall.reviewCount} review
            </span>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section aria-labelledby="menu-heading">
          <div className="mb-3 flex items-center gap-2">
            <UtensilsCrossed className="size-5 text-primary" aria-hidden="true" />
            <h2 id="menu-heading" className="m-0 text-xl font-bold">
              Menu
            </h2>
          </div>

          {menus.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="Belum ada menu"
              message="Pemilik warung belum menambahkan menu."
            />
          ) : (
            <div className="space-y-2">
              {menus.map((menu) => (
                <Card key={menu.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="mb-1 text-sm font-bold">{menu.name}</p>
                    <Badge tone={menu.isAvailable ? 'success' : 'danger'}>
                      {menu.isAvailable ? 'Tersedia' : 'Sedang habis'}
                    </Badge>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-primary-dark">
                    {formatCurrency(menu.price)}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="review-heading">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" aria-hidden="true" />
            <h2 id="review-heading" className="m-0 text-xl font-bold">
              Review
            </h2>
          </div>

          {isCustomer && !hasReviewed ? (
            <Card className="mb-4 p-4">
              <form onSubmit={(event) => void handleCreateReview(event)} className="space-y-4">
                <RatingInput value={rating} onChange={setRating} />
                <Field
                  label="Komentar"
                  htmlFor="review-comment"
                  hint="Opsional, maksimal 1000 karakter."
                >
                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={1000}
                    className={textareaClass}
                    placeholder="Ceritakan pengalamanmu..."
                  />
                </Field>
                <Button type="submit" disabled={isSubmittingReview}>
                  {isSubmittingReview ? <Spinner /> : null}
                  Kirim Review
                </Button>
              </form>
            </Card>
          ) : null}

          {!user ? (
            <Card className="mb-4 p-4 text-sm text-text-muted">
              <Link
                to={`/login?redirect=${encodeURIComponent(`/stalls/${stallId}`)}`}
                className="font-bold text-primary hover:text-primary-dark"
              >
                Masuk
              </Link>{' '}
              untuk menulis review, menyukai, atau melaporkan review.
            </Card>
          ) : null}

          {isCustomer && hasReviewed ? (
            <div className="mb-4">
              <Alert tone="info">
                Kamu sudah memberi review untuk warung ini. Kelola review di halaman{' '}
                <Link to="/reviews" className="font-bold underline">
                  Review Saya
                </Link>
                .
              </Alert>
            </div>
          ) : null}

          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Belum ada review"
              message="Jadilah yang pertama membagikan pengalaman."
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => {
                const wasEdited =
                  review.updatedAt !== null && review.updatedAt !== review.createdAt;

                return (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-0.5 text-sm font-bold">{review.userName}</p>
                        <p className="mb-0 text-[11px] text-text-muted">
                          {wasEdited
                            ? `Diperbarui ${formatDate(review.updatedAt)}`
                            : formatDate(review.createdAt)}
                        </p>
                      </div>
                      <RatingStars rating={review.rating} />
                    </div>
                    <p className="mb-3 mt-3 whitespace-pre-line text-sm leading-relaxed text-text-muted">
                      {review.comment || 'Tanpa komentar.'}
                    </p>
                    <div className="flex items-center gap-3 border-t border-border pt-3">
                      <button
                        type="button"
                        onClick={() => void handleLike(review)}
                        disabled={Boolean(user) && !isCustomer}
                        aria-pressed={review.likedByMe}
                        aria-label={
                          review.likedByMe
                            ? `Batalkan suka, saat ini ${review.likeCount} suka`
                            : `Sukai review, saat ini ${review.likeCount} suka`
                        }
                        title={
                          user && !isCustomer
                            ? 'Hanya pelanggan yang dapat menyukai review'
                            : undefined
                        }
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold disabled:cursor-default disabled:opacity-70 ${
                          review.likedByMe
                            ? 'text-danger'
                            : 'text-text-muted enabled:hover:text-text'
                        }`}
                      >
                        <Heart
                          className={`size-4 ${review.likedByMe ? 'fill-danger' : ''}`}
                          aria-hidden="true"
                        />
                        {review.likeCount}
                      </button>
                      {isCustomer && review.userId !== user?.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFlaggingReview(review);
                            setModalError(null);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-warning"
                        >
                          <FlagIcon className="size-3.5" aria-hidden="true" />
                          Laporkan
                        </button>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {flaggingReview ? (
        <Modal
          title="Laporkan review"
          onClose={closeFlagModal}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={closeFlagModal}
                disabled={isSubmittingFlag}
              >
                Batal
              </Button>
              <Button type="submit" form="flag-form" disabled={isSubmittingFlag}>
                {isSubmittingFlag ? <Spinner /> : null}
                Kirim Laporan
              </Button>
            </>
          }
        >
          <form id="flag-form" onSubmit={(event) => void handleFlag(event)}>
            <p className="mt-0 text-sm text-text-muted">
              Laporkan review dari <strong>{flaggingReview.userName}</strong> kepada admin.
            </p>
            {modalError ? (
              <div className="mb-4">
                <Alert tone="error">{modalError}</Alert>
              </div>
            ) : null}
            <Field label="Alasan" htmlFor="flag-reason" hint="Opsional, maksimal 255 karakter.">
              <textarea
                id="flag-reason"
                value={flagReason}
                onChange={(event) => setFlagReason(event.target.value)}
                maxLength={255}
                className={textareaClass}
                placeholder="Contoh: mengandung ujaran kebencian"
              />
            </Field>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
