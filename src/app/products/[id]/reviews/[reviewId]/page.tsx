// src/app/products/[id]/reviews/[reviewId]/page.tsx
'use client';

import React from "react";


export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string; reviewId: string }>;
}) {
  const { id, reviewId } = React.use(params); // Use React's `use` hook to resolve the Promise

  return (
    <div>
      <h2>
        Review #{reviewId} for Product #{id}
      </h2>
      <p>This is the detailed review content.</p>
    </div>
  );
}