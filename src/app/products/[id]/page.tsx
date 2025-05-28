
import Link from 'next/link';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const {id} = await params;
  
  const reviews = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div>
      <h1>Product #{id}</h1>
      <p>This is the detail page for product {id}</p>

      <h2>Reviews</h2>
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
