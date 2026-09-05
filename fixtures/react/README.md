# React fixture

This Vite fixture renders the deliberately broken gallery at `/` and the
repaired state at `/?repaired`. Browser contracts build and scan both states,
asserting deterministic `image-alt`, `label`, `color-contrast`, `heading-order`,
and `landmark-one-main` findings before repair.

The production core reports stable DOM evidence. Mapping minified nodes through
source maps to the responsible React or Next.js component remains explicitly
future work; skills must treat source location as best effort until that API is
available.
