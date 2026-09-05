const productImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' fill='%23e8eef8'/%3E%3Cpath d='M65 40h50v110H65z' fill='%232255aa'/%3E%3Cpath d='M75 25h30v25H75z' fill='%23163066'/%3E%3C/svg%3E";

function BrokenGallery() {
  return (
    <div className="shell">
      <a className="skip-link" href="#missing-main">
        Skip to products
      </a>
      <header>
        <h1>Product gallery</h1>
      </header>
      <div className="gallery">
        <section className="card">
          <h4>Insulated bottle</h4>
          <img src={productImage} />
          <input id="quantity-broken" type="number" defaultValue="1" />
          <button className="low-contrast" type="button">
            Add to cart
          </button>
        </section>
      </div>
    </div>
  );
}

function RepairedGallery() {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to products
      </a>
      <header>
        <h1>Product gallery</h1>
      </header>
      <main id="main" className="gallery" tabIndex={-1}>
        <section className="card">
          <h2>Insulated bottle</h2>
          <img src={productImage} alt="Blue insulated bottle" />
          <label htmlFor="quantity-repaired">Quantity</label>
          <input id="quantity-repaired" type="number" defaultValue="1" />
          <button type="button">Add to cart</button>
        </section>
      </main>
    </div>
  );
}

export function GalleryFixture() {
  const repaired = new URLSearchParams(globalThis.location.search).has(
    "repaired"
  );
  return repaired ? <RepairedGallery /> : <BrokenGallery />;
}
