# Third party notices

## Fonts

Satoshi (weights 400, 500 and 700), self hosted from `public/fonts`.

- Designer: Indian Type Foundry, distributed through Fontshare.
- Licence: Fontshare publishes Satoshi under the ITF Free Font License, which as published allows free personal and commercial use, including embedding on websites. The font files must not be sold or passed on as a standalone font.
- Status of this check: the licence text could not be opened from the environment these versions were built in. Please read the current licence on the Fontshare website before you rely on it.

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

Both are served from this site, not from a CDN. To update one, replace the file, change its name to the new version and update `public/index.html`.

## Design

The visual design follows the Nova design template (colours, type scale, radii, spacing, button and navigation behaviour). No text, images, logos or code from the template are included.
