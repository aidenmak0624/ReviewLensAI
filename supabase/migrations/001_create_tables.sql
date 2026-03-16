-- products table
create table products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  platform            text,           -- amazon | g2 | google_maps | yelp | capterra
  source_url          text,
  total_reviews       int     default 0,
  average_rating      numeric(3,2) default 0,
  rating_distribution jsonb   default '{"1":0,"2":0,"3":0,"4":0,"5":0}',
  status              text    default 'ingesting', -- ingesting | ready | error
  ingestion_method    text,           -- url_scrape | csv_upload | paste
  pinecone_namespace  text,           -- 'product-{id}'
  created_at          timestamptz default now()
);

-- reviews table
create table reviews (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid references products(id) on delete cascade,
  reviewer_name      text,
  rating             smallint check (rating between 1 and 5),
  review_text        text not null,
  review_date        date,
  verified           boolean default false,
  helpful_count      int default 0,
  pinecone_vector_id text,            -- 'review-{id}'
  created_at         timestamptz default now()
);

-- Index for fast review lookups by product
create index idx_reviews_product_id on reviews(product_id);
