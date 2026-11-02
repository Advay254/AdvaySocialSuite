# Third party notices

## Fonts

Inter, loaded from `public/fonts/inter-var.woff2` (variable font, weights 100 to 900).

- Designer: Rasmus Andersson and the Inter Project Authors, https://github.com/rsms/inter
- Licence: SIL Open Font License 1.1, https://openfontlicense.org. Copyright (c) 2016 The Inter Project Authors. The licence allows use, embedding and redistribution, including on websites, as long as the copyright notice and licence travel with the font.
- Status: the font file is not part of this package, because the environment these changes were made in could not download it. Add the file to `public/fonts` (and the OFL.txt that comes with it). Until then visitors see their system font.

## Icons (public/icons)

The five icon styles are generated from the `react-icons` package (MIT, build tool only), which republishes each set unchanged:

| Style | Project | Licence |
| --- | --- | --- |
| Lucide | Lucide contributors | ISC |
| Tabler | Tabler Icons, Pawel Kuna | MIT |
| Phosphor | Phosphor Icons | MIT |
| Heroicons | Tailwind Labs | MIT |
| Feather | Cole Bemis | MIT |

Brand glyphs in `public/icons/brands.json` come from Simple Icons (CC0 1.0, public domain dedication). LinkedIn was removed from the current Simple Icons release, its glyph is kept from an earlier release of the same set. Brand names and logos remain the property of their owners and are used only to link to those services.

MIT licence text for the MIT items above: permission is granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense and sell copies, provided the copyright notice and this permission notice are included. The software is provided as is, without warranty of any kind. ISC licence (Lucide): the same permission, with the same notice and no warranty. The full texts ship inside each package on npm.

## Libraries (public/vendor)

| File | Project | Licence |
| --- | --- | --- |
| `purify-3.4.0.min.js` | DOMPurify, Cure53 | Apache-2.0 or MPL-2.0 |
| `marked-18.0.2.umd.js` | marked | MIT |

Both are served from this site, not from a CDN. To update one, replace the file, change its name to the new version and update `views/app.html`.

## Design

The visual design is original to this project. Its colour themes and layout are described in `theme-preview.html` and README.md. No text, images, logos or code from other sites are included.
