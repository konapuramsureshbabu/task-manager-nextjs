import Link from 'next/link';

export default async function ReviewList({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {id} = await params;
  const reviews = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div>
      <h2>All Reviews for Product #{id}</h2>
      <ul>
        {reviews.map((reviewId) => (
          <li key={reviewId}>
            <Link href={`/products/${id}/reviews/${reviewId}`}>
              Review #{reviewId}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
