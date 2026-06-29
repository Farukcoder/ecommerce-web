"use client"

import { useEffect, useState } from "react"
import { Star, MessageSquare, PlusCircle, Check, Package, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useProductImageSrc } from "@/lib/product-image-context"
import { getProductImageSrc } from "@/lib/product-image"
import {
  fetchCustomerReviews,
  fetchPendingReviews,
  submitProductReview,
  type BackendReview,
  type PendingReview,
  type PaginatedReviews,
} from "@/lib/customer-reviews"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useTranslation } from "@/lib/i18n"

export default function ReviewsPage() {
  const { t } = useTranslation()
  const [reviewsData, setReviewsData] = useState<PaginatedReviews | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingReview[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isLoadingPending, setIsLoadingPending] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isOpen, setIsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<PendingReview | null>(null)
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")

  const defaultProductImage = useProductImageSrc(null)

  const loadReviews = async (page = 1) => {
    setIsLoadingReviews(true)
    try {
      const data = await fetchCustomerReviews(page)
      setReviewsData(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load reviews.")
    } finally {
      setIsLoadingReviews(false)
    }
  }

  const loadPendingReviews = async () => {
    setIsLoadingPending(true)
    try {
      const data = await fetchPendingReviews()
      setPendingItems(data)
    } catch (err: any) {
      console.error("Failed to load pending reviews:", err)
    } finally {
      setIsLoadingPending(false)
    }
  }

  useEffect(() => {
    loadReviews(1)
    loadPendingReviews()
  }, [])

  const handlePageChange = (page: number) => { loadReviews(page) }

  const openReviewModal = (product: PendingReview) => {
    setSelectedProduct(product)
    setRating(5)
    setComment("")
    setIsOpen(true)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    setIsSubmitting(true)
    try {
      const response = await submitProductReview(selectedProduct.product_id, rating, comment.trim() || null)
      toast.success(response.message || "Review submitted successfully!", {
        icon: <Check className="h-4 w-4 text-green-500" />,
      })
      setPendingItems((prev) => prev.filter((item) => item.product_id !== selectedProduct.product_id))
      loadReviews(1)
      setIsOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateStr))
    } catch { return dateStr }
  }

  const writtenReviewsCount = reviewsData?.total ?? 0

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("my_reviews_title")}</h2>
      </div>

      <Tabs defaultValue="written">
        <TabsList className="mb-6">
          <TabsTrigger value="written" className="cursor-pointer">
            {t("written_reviews_tab")} ({writtenReviewsCount})
          </TabsTrigger>
          <TabsTrigger value="pending" className="cursor-pointer">
            {t("pending_reviews_tab")} ({pendingItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="written">
          {isLoadingReviews ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !reviewsData || reviewsData.data.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-muted-foreground text-sm">{t("no_reviews_yet")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("reviews_appear_here")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviewsData.data.map((rev) => {
                const imgUrl = getProductImageSrc(rev.product?.thumbnail, defaultProductImage)
                return (
                  <div key={rev.id} className="border border-border/60 rounded-xl p-5 bg-muted/10 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-start gap-4">
                      {imgUrl && (
                        <div className="relative h-16 w-16 overflow-hidden rounded bg-muted shrink-0 border border-border">
                          <Image src={imgUrl} alt={rev.product?.name || "Product"} fill className="object-cover" sizes="64px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm sm:text-base line-clamp-1">{rev.product?.name || "Product"}</h4>
                          <span className="text-xs text-muted-foreground shrink-0">{formatDate(rev.created_at)}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-4 w-4 ${s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        {rev.comment && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{rev.comment}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}

              {reviewsData.last_page > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    {reviewsData.current_page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(reviewsData.current_page - 1) }} />
                      </PaginationItem>
                    )}
                    {Array.from({ length: reviewsData.last_page }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink href="#" isActive={page === reviewsData.current_page} onClick={(e) => { e.preventDefault(); handlePageChange(page) }}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {reviewsData.current_page < reviewsData.last_page && (
                      <PaginationItem>
                        <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(reviewsData.current_page + 1) }} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {isLoadingPending ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-muted-foreground text-sm">{t("all_caught_up")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("all_reviewed")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map((item) => {
                const imgUrl = getProductImageSrc(item.thumbnail, defaultProductImage)
                return (
                  <div key={item.product_id} className="border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-4">
                      {imgUrl && (
                        <div className="relative h-14 w-14 overflow-hidden rounded bg-muted shrink-0 border border-border">
                          <Image src={imgUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-foreground line-clamp-1">{item.name}</h4>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Package className="h-3 w-3" /> {t("order_prefix")} {item.order_number}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openReviewModal(item)} className="flex items-center gap-1.5 self-start sm:self-center cursor-pointer">
                      <PlusCircle className="h-4 w-4" /> {t("write_review_btn")}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("write_review_title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4 py-2">
            {selectedProduct && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                {getProductImageSrc(selectedProduct.thumbnail, defaultProductImage) && (
                  <div className="relative h-12 w-12 overflow-hidden rounded bg-muted shrink-0 border border-border">
                    <Image src={getProductImageSrc(selectedProduct.thumbnail, defaultProductImage)} alt={selectedProduct.name} fill className="object-cover" sizes="48px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs text-foreground truncate">{selectedProduct.name}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{t("order_prefix")} {selectedProduct.order_number}</p>
                </div>
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">{t("rate_this_product")}</p>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoveredRating !== null ? hoveredRating : rating) >= star
                  return (
                    <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(null)} className="transition-transform active:scale-95 cursor-pointer" disabled={isSubmitting}>
                      <Star className={`h-8 w-8 ${isActive ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="reviewComment">{t("review_comment_label")}</Label>
              <Textarea id="reviewComment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("review_comment_placeholder")} rows={4} required disabled={isSubmitting} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>{t("cancel")}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("submitting_ellipsis")}</>
                ) : t("submit_review_btn")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
