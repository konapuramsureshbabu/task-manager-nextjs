import Link from 'next/link';

export default function ProductsList() {
  const products = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <div>
      <h1>All Products</h1>
      <ul>
        {products.map((id) => (
          <li key={id}>
            <Link href={`/products/${id}`}>Product #{id}</Link> 
            <Link href={`/products/${id}/reviews`}>Reviews</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
