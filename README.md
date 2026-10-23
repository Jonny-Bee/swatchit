# Swatch it

A client-side colour palette playground built with React, Vite, and Tailwind CSS. It has no application backend: the current palette and saved collection live in browser local storage, and a share link contains the palette colours and generation method in its query string.

## Run locally

```sh
npm install
npm run dev
```

Use the generation selector to create complementary, split complementary, analogous, triadic, tetradic, monochromatic, or random palettes. Set an anchor colour, edit hex values or use the native colour picker, add or remove colours (2–12), and drag swatches to reorder them. Save palettes to the local collection, copy a share link, or export the current palette as CSS custom properties.

Saved palettes are specific to the browser and device where they were created. A shared link carries the palette directly, so the recipient does not need an account or backend service.
