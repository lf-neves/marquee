-- CreateTable
CREATE TABLE "watchlist_items" (
    "viewer_id" UUID NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "added_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("viewer_id","movie_id")
);

-- CreateIndex
CREATE INDEX "watchlist_items_viewer_id_added_at_idx" ON "watchlist_items"("viewer_id", "added_at" DESC);
