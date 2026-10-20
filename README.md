# Interactive charts

> **THIS IS THE TEMPLATE FOR EVERY CHART ON THE WEB.** `<gwi-chart>` is the web version of the
> "Data viz templates" in `../Presentations/Presentation Template.html` (slides 16 to 27). Same marks, same colours,
> same rules. Do not restyle a chart with site CSS, swap its colours, or build charts with another
> library. Change the data, the title, the subtitle and the source. The only styling allowed is the `--gwi-*` variables (see "Styling with CSS variables"), and only when asked for. If a chart you need
> is missing, tell the design lead (Stavros) so it can be added here.

One JavaScript file, no dependencies. Drop the file on a page, then add one `<gwi-chart>` tag per chart.
It works in any HTML page or CMS, and its styles are sealed inside the tag so the site's CSS cannot break it.

## Files

| File | What it is |
|---|---|
| `Interactive charts template.html` | The gallery. One live example of every chart with copy and paste embed code. Open it first. |
| `gwi-chart.standalone.js` | **The file to put on a website.** Fonts are built in, so this one file is all a page needs. |
| `source/gwi-chart.js` | The same component without built in fonts, and the one we edit. Loads Ovo and Instrument Sans from `source/fonts/`. Not needed on a website. |
| `source/fonts/` | Instrument Sans and Ovo as woff2. Only needed with `source/gwi-chart.js` and for the build. |
| `source/build-standalone.py` | Rebuilds `gwi-chart.standalone.js` after `source/gwi-chart.js` changes. |

## Making a chart with Claude

For Claude, and for anyone using Claude to make a chart. One chart at a time, from the chart types in the gallery (`Interactive charts template.html`).

1. **Ask for the small print first.** If the person has not already given them, ask for the **Source**, the **Base** and the **question(s)** asked to get the data. For each question, ask for the **link** too (an https URL). Do not invent any of these. If something is missing, leave that attribute out rather than make it up, and say so.
2. **Use the gallery chart they name.** Take its embed code, keep its structure, and change only the data, title, subtitle, unit, source, base and questions.
3. **Hand back only the tag.** Give one code block with a single `<gwi-chart>` tag and its data script inside it. Do not add a script that loads the component. The website loads it once for every page, and adding it again breaks the charts.
4. **Do not restyle unless asked.** No custom CSS, colours or fonts by default. The rules below are built in. If the person asks for a styling change, set only the `--gwi-*` variables from "Styling with CSS variables" in the `style` attribute of the tag, and say which ones you set.

## Put a chart on a page

```html
<!-- Standalone pages only. In Webflow, leave this line out: the site already loads the component once for every page. -->
<script src="gwi-chart.standalone.js"></script>

<gwi-chart type="bar" unit="%"
  title="Short-form video leads weekly media use"
  subtitle="Share of online adults who use each every week"
  source="GWI Core, Q2 2026"
  base="Online adults 16 to 64"
  question="Q4. Which of the following do you use weekly?">
  <script type="application/json">
    { "categories": ["Short-form video", "Social networks", "Messaging"],
      "series": [{ "name": "Weekly use", "values": [82, 74, 69] }] }
  </script>
</gwi-chart>
```

**In Webflow,** the component is already loaded site-wide. Paste only the `<gwi-chart>` tag (with its data script inside it) into a Code Embed, and never add a second script that loads `gwi-chart.js` or `gwi-chart.standalone.js`. Loading it twice breaks the charts.

Load the script once per page, then use as many tags as you like. The chart fills the width of
whatever it sits in, redraws when the container changes size, and works from phone to wide desktop.
Wrap it in a `div` with a max width to control how wide it gets.

### Full bleed

Every chart is edge to edge: it takes 100% of the width of its container, with no padding, margin or max width of its own, and
the marks run to both edges (the title, subtitle and buttons sit flush left). For a CRM report, put the tag in a container
with no padding and the chart spans it. To inset a chart, add padding to the container, not the chart. The half donut
scales with the width too, so in a very wide container it gets very large. Use a narrower container for it. Column charts and
heatmaps keep a minimum width and scroll sideways inside the container on very narrow screens.

### Three ways to give a chart its data

1. **Inline JSON** in a `<script type="application/json">` inside the tag (above). Best for static reports.
2. **A URL** with `src="data/video.json"`. JSON or CSV (`.csv`). Best for data that changes without touching the page.
3. **JavaScript:** `document.querySelector('gwi-chart').data = { ... }`. Best inside an app. Setting `data` again redraws.

A `data='{...}'` attribute with the JSON as a string also works for tiny charts.

### Data formats

Most charts use categories and series:

```json
{ "categories": ["16 to 24", "25 to 34", "35 to 44"],
  "series": [ { "name": "Social media", "values": [38, 33, 26] },
              { "name": "Search",       "values": [17, 26, 32] } ] }
```

Treemap and half donut use items:

```json
{ "items": [ { "name": "Short-form video", "value": 38 }, { "name": "Streaming", "value": 21 } ],
  "seriesName": "Share of time" }
```

Sankey (alluvial) uses links between named nodes. Columns are worked out for you from the flows, and nodes are read from the links:

```json
{ "stages": ["Discover", "Research", "Buy"],
  "links": [ { "source": "Social media", "target": "Video platforms", "value": 18 },
             { "source": "Video platforms", "target": "In store", "value": 13 } ] }
```

Use a different name for the same thing at each stage, for example "Video platforms" in Research and "Video" in Buy, because a name is one node. Optional: `nodes` with a `column` number to force a column, and a `color` to set a colour. `stages` are small headings over the columns. JSON only, no CSV.

Big number uses a value, a label and optional tiles with a trend:

```json
{ "value": "82%", "label": "of online adults use short-form video every week",
  "tiles": [ { "label": "Daily use", "value": "47%", "delta": "+5 pts vs 2025", "trend": [33, 36, 40, 47] } ] }
```

Scatter uses points, with optional `xLabel`, `yLabel` and a `group` on each point:

```json
{ "xLabel": "Reach", "yLabel": "Impact",
  "points": [ { "name": "Broadcast TV", "x": 92, "y": 33 }, { "name": "Podcasts", "x": 61, "y": 11 } ] }
```

Dot plot and slope use the same categories and series format as bar.

A CSV for `src` has the categories in the first column, one column per series, and the series names in the first row.

## Layout, the same for every chart

Top to bottom: **title, subtitle, key (when there are two or more series, or a gradient for the heatmap), graph, and a row of buttons.**
The key is always under the subtitle. The bottom row has "View as table" and "Download data (CSV)" on the left, and two buttons
at the bottom right: **Sources** then **Download image** (Download image is the rightmost). These use the Buttons component
(`../../Components/Buttons/README.md`): fully rounded pills, Light mode (charts sit on light backgrounds), no icon: Download image is Primary, Sources is Secondary. Charts use the compact size, 30px high with a 14px SemiBold label and 16px side padding, instead of the standard 60px. "Back to chart" on the card's back is a
Primary, Light mode button at the same size. The two text links on the left are links, not buttons, and keep their underline style.

- **Download image** saves a JPG of the chart as it looks on screen: title, subtitle, key, graph, and a line with the source and base. The buttons are left out. It is made in the browser, at twice the size, on a white background.
- **Sources** flips the whole card over. The back shows the source, the base and the list of questions asked to get the data, each one a link to where it lives. "Back to chart" (or Escape) flips it back. The button only appears when there is something to show.

Fill these in with attributes and keep them out of the data:

```html
<gwi-chart type="bar" unit="%" title="..." subtitle="..."
  source="GWI Core, Q2 2026" source-url="https://example.com/core"
  base="Online adults 16 to 64"
  questions='[{"text":"Q4. Which of the following do you use weekly?","url":"https://example.com/q4"},
              {"text":"Q7. How often do you research before buying?","url":"https://example.com/q7"}]'>
```

Each question needs a `text` and, if you have one, a `url` (https links only, opened in a new tab). A question with no `url` shows as plain text. You can also put the same list in the data as `"questions": [...]`, or for a single question use `question="..."` with `question-url="..."`. Write only the text, the labels "Source", "Base" and "Questions" are added for you.

**The graph is a 4:3 rectangle by default.** It takes the full width of its container, and its height is 75% of that width. It only grows
taller when the data needs more room, for example a bar chart with many rows. Sparse charts stretch their bars and rows
toward that shape but stop at a sensible size, so they can come out slightly shorter. No padding is added to force the
shape. The visible space between the subtitle (or the key, when there is one) and the graph is 40px, and so is the space between the graph and the buttons row, on every chart. The key sits 24px under the subtitle and always starts at the left edge, in line with the subtitle. Use `aspect="16:9"` or `aspect="auto"`
only when a layout truly needs it, and ask the design lead first.

## Filter by market or sector

Most charts need no filter. When one data set holds several markets or sectors, put each in a view and the chart gets a small drop-down. It sits on the right, level with the key, when there is a key, and on the left under the subtitle when there is not. Leave `views` out and nothing is added.

```json
{ "filterLabel": "Market",
  "views": [
    { "name": "United Kingdom", "categories": ["A", "B"], "series": [ { "name": "2026", "values": [72, 61] } ] },
    { "name": "United States",  "categories": ["A", "B"], "series": [ { "name": "2026", "values": [65, 58] } ] } ] }
```

Each view holds the data for that chart type, in the same format as without a filter. `filterLabel` is the small label next to the list ("Market", "Sector"). `defaultView` is the name of the view to open on, otherwise the first. A view can carry its own `questions`. Picking a view redraws the chart, and the table, CSV and image follow it. The page gets a `gwi-chart-filter` event with the view name.

## Chart types

| `type` | Use it for | Data | Notes |
|---|---|---|---|
| `stat` | One hero number with supporting tiles | value, label, tiles | The number counts up when scrolled into view |
| `stats` | Big numbers with a statement under each, no chart | `{"stats":[{"value":77,"label":"..."}]}` | Ovo numbers count up, a small % beside each when `unit="%"`. Two columns, one on narrow screens (`--gwi-stats-cols`) |
| `stat-bar` | One tall bar that stretches from one big stat to the next, then loops | `{"stats":[{"value":80,"label":"...","mark":"*"}],"interval":3,"notes":["..."]}` | `mark` is a small superscript, `notes` print under the bar. Starts when scrolled into view |
| `bar` | Comparing values | categories and series | One series: pink. Several series: grouped, up to four. Also: `labels="above"` puts each statement above a full-width bar, `ranked` adds numbered badges, `reference` draws a dotted line (for example the 50% Majority line), `"colors":[...]` in the data colours each bar, and `{"groups":[{"name","items":[{"name","value"}]}]}` draws bars in switchable groups. A `\n` in a label forces a line break Add `highlight="Name"` or an index to make one bar pink and the rest grey |
| `column` | Comparing groups across statements | categories and series | Scrolls sideways on very narrow screens |
| `line` | Change over time | categories (years) and series | Smooth curves, an end dot per line, values on hover. Shorter than the default shape (about 16:9 plot) on line, area and stacked area |
| `area` | Volume over time, one series | categories and one series | Pink, curved, with vertical grid lines |
| `stacked-area` | Parts of a total over time | categories and series | Series stack in colour order |
| `stacked-bar` | Parts of a whole | categories and series | Rows are normalised to 100 (`normalize="false"` for absolute totals). Key sits left under the subtitle. No numbers on the bars, a value appears in the segment you hover |
| `stacked-column` | Parts of a whole, as columns | categories and series | Also `type="stacked-col"`. Normalised to 100 like stacked bar (`normalize="false"` for absolute totals). Values show in segments that fit, hover shows any segment |
| `heatmap` | Spotting patterns | categories are rows, series are columns | One pink hue, light to dark. The key is a gradient pill under the subtitle with the minimum, middle and maximum. Cells show their value on hover only |
| `treemap` | Size and share | items | Biggest tile gets the darkest step. Hover a tile to see its value in the bottom right corner, with the other tiles greyed out and no pop up |
| `sankey` | Flows between stages, such as discover, research, buy | links (and optional stages) | Also `type="alluvial"`. Hover a node or ribbon to follow its flow, values show in place. See the data format above |
| `scatter` | Two measures against each other | points (name, x, y, optional group) | Axis titles from `xLabel` and `yLabel`. Names sit beside the dots and avoid each other. A `group` on each point colours by group. See the data format above |
| `dot-plot` | Comparing values per category on one line | categories and series | Also `type="dot"` or `"dumbbell"`. Two or more series, a bar joins the dots. Values show only on hover |
| `slope` | Change between two points in time | categories and series | Two or more series are the columns, one line per category, drawn as smooth curves. `highlight` colours one line and greys the rest |
| `half-donut` | Share of a whole | items | Up to nine segments. Values sit on the segments, the biggest is the darkest, the key runs in two columns under a rule. Hover a segment to isolate it |

## Attributes

| Attribute | What it does |
|---|---|
| `type` | The chart type, from the table above. Required |
| `title`, `subtitle` | Heading above the chart. Sentence case, no dashes. Both optional |
| `source`, `source-url`, `base` | Shown on the back of the card, behind the Sources button. Text only, the labels are added for you. Use `source` on every chart. `source-url` is optional and makes the source a link |
| `questions`, `question`, `question-url` | The questions asked to get the data, shown on the back of the card. `questions` is a JSON list of `{text, url}`. For one question use `question` and `question-url` |
| `aspect` | Shape of the graph. Default `4:3`, which grows taller only when the data needs it. Also `1:1`, `5:4`, `16:9` or `auto` (the natural height) |
| `unit` | `%` shows the GWI % symbol once and prints plain numbers. `$`, `£` or `€` prefixes every value. Any other text, such as `h`, is added after every value |
| `highlight` | Bars and columns, one series only. A category name or index becomes pink, the rest grey |
| `decimals` | Fixed decimals for every number. Default is none for whole numbers and one otherwise |
| `max` | Fixes the top of the value scale. Default is 100 for percentages, otherwise a rounded maximum |
| `height` | Fixed plot height in pixels for column, line, area, stacked area, treemap and one-series bar (the bars grow to fill it). Overrides the 4:3 shape |
| `ranked` | `bar`, one series: numbered pink badges left of the labels |
| `reference` | `bar`: a dotted vertical line with a label, e.g. `reference='{"value":50,"label":"Majority"}'`. Use with `max="100"` |
| `labels` | `above` on a one-series `bar`: statement above the bar, bar at full width. Below 520px wide this is always the layout |
| `filename` | Name of the downloaded JPG (default is the title) |
| `columns` | `wide` on a one-series `column`: columns as wide as their cell, minus a 30px gap |
| `layout` | `square` on `treemap`: tiles are arranged in the order given, in a square, then stretched to the chart. Default sorts by size |
| `nav` | Draws previous and next arrows by the Download image button. Set automatically inside a carousel |
| `normalize` | `false` on `stacked-bar` for absolute totals |
| `animate` | `false` turns off the entrance animation. It is off automatically for people who prefer reduced motion |
| `table`, `download` | `false` hides the "View as table" or "Download data (CSV)" links. The Download image and Sources buttons always show (Sources only when there is something to show) |

## What the reader gets

Hover or tap any data point and it is the only thing left in colour: everything else greys out. Most charts also show a tooltip. Stacked bars, heatmaps, treemaps and half donuts have no numbers at rest, so the value appears on the hovered segment, cell, tile or arc instead (a tooltip only appears if the shape is too small to hold the number). Lines and areas show a crosshair and every series at that point.
On charts with several series (grouped bars, columns, stacked bars, lines, stacked areas), hovering a bar, segment or line
focuses the whole series: every other series greys out and all values of that series show on the marks. Hovering a key entry does the same. Every mark is keyboard focusable, and focus shows the tooltip.
"View as table" swaps the chart for a table, which is also what screen readers read, and "Download data (CSV)"
saves the numbers. Every chart plays a short intro animation once, the first time it scrolls into view:
bars grow from left to right, one after another, while their numbers count up; columns rise from the baseline;
stacked bars wipe in row by row; lines and areas draw from left to right; heatmap cells and treemap tiles fade in on a
diagonal and in order of size; half donut segments appear in turn; the big number counts up and its tiles and
sparklines follow. It does not replay on resize or scroll, and it is switched off for people who prefer reduced motion
(or with `animate="false"`).

## Carousel

`<gwi-chart-carousel interval="8" download-all>` around two or more `<gwi-chart>` tags shows one at a time. It moves on by itself every `interval` seconds and loops. The previous and next arrows by the Download image button move one chart and stop the loop for good. With `download-all`, Download image saves every chart in turn (give each a `filename`). "View as table" switches all charts together. Give every chart the same `height` so they line up.

**Selector instead of arrows.** Add `selector` to the carousel (`<gwi-chart-carousel interval="8" download-all selector>`). Each chart's subtitle becomes a dropdown listing every chart's subtitle, for example "Most common impacts" and "By sector". Picking one shows that chart and stops the loop. Download image still saves every chart, with the plain subtitle.

## Titles and subtitles

`\n` in a title or subtitle breaks the line.

## Styling with CSS variables

Set any of these on the `<gwi-chart>` tag (or on a wrapper, or in site-wide Webflow CSS, e.g. `gwi-chart { --gwi-radius: 0 }`).
All are optional. Nothing changes if you set none.

```html
<gwi-chart type="bar" style="--gwi-pink:#0055FF; --gwi-radius:0px; --gwi-bar-height:28px" ...></gwi-chart>
```

| Variable | What it changes | Default |
|---|---|---|
| `--gwi-pink` | Primary data colour: bars, columns, big numbers, badges, treemap top tile | #FF0077 |
| `--gwi-lime`, `--gwi-deep`, `--gwi-dlime`, `--gwi-grey` | Other series colours | #B9DB51, #940045, #729508, #B0ACAA |
| `--gwi-ramp-1` … `--gwi-ramp-9` | Pink ramp used by treemap, donut and heatmap (7 is `--gwi-pink`) | Pink 10 to Pink 90 |
| `--gwi-ink`, `--gwi-ink-strong` | Text, axis ink, outlines, button text | #282523, #1E1B1A |
| `--gwi-muted`, `--gwi-soft` | Subtitle and secondary text | #7F7B79, #9C9896 |
| `--gwi-grid`, `--gwi-track`, `--gwi-axis` | Rules, bar tracks, axis lines | #E8E5E3, #F9F7F6, #D4D0CE |
| `--gwi-radius` | Corner radius of bars, columns, tiles, cards | 6px |
| `--gwi-bar-height` | Thickness of bars in single-series bar charts (a number with px) | 16px |
| `--gwi-font` | Font for all UI text. Use one with metrics close to Instrument Sans, labels are measured with the default | Instrument Sans |
| `--gwi-number-font` | Big-number font | Ovo |
| `--gwi-title-size`, `--gwi-title-weight`, `--gwi-sub-size` | Title and subtitle | 32px, 400, 16px |
| `--gwi-stat-size`, `--gwi-stat-label-size` | Big numbers and their statements (stats, stat-bar, stat) | responsive |
| `--gwi-stats-cols`, `--gwi-stats-gap` | Columns and gap of the big-number grid | 2, 40px |
| `--gwi-stat-bar-height` | Height of the stat-bar | responsive |
| `--gwi-head-gap`, `--gwi-foot-gap` | Space under the title block, space above the footer | 40px, 37px |
| `--gwi-btn-radius`, `--gwi-btn-height` | Button shape | 15px, 30px |
| `--gwi-max-width` | Max width of the chart | 100% |

Notes
- Colour variables recolour everything drawn in that colour, including the tooltip swatches and the downloaded JPG.
- Layout is calculated in script, so font sizes inside the SVG chart (axis labels, bar labels, values) are not variables. Ask for an attribute if you need them.
- A colour passed inside the data (`"colors":[...]`) is used as given and is not remapped.

## Events

The tag fires `gwi-chart-ready`, `gwi-chart-error` (with `detail.message`) and `gwi-chart-image` (when an image is downloaded), `gwi-chart-nav` and `gwi-chart-table` (carousel) and `gwi-chart-select`
(when a mark is clicked, with `detail.label` and `detail.rows`) so a page can react to a chart.

## The rules, built in

You cannot get these wrong, because the component enforces them. Do not try to override them.

- **Colours** follow `../../tokens/color-usage.md`. One series: pink, with grey as context. Two: pink, lime.
  Three: deep pink, pink, lime. Four: deep pink, pink, lime, dark lime. Five or more: the pink magnitude ramp.
  Series keep their colour in every chart and are never reordered.
- **Marks** have a 6px corner radius (bars, columns, stacked segments, cells and tiles alike, never fully rounded), light grey tracks, and white gaps between touching segments. Single series bar charts have no separator lines. Grouped bars and columns have a light grey separator line between the groups, never between the bars.
- **Numbers** are plain, in the series colour. The `%` shows once, as the Top, Side or Diagonal symbol from
  `../../Components/Presentations/Data viz`, always at the same scale.
- **Key** entries always have the same gap, and the key is always present for two or more series.
- **Type** is Instrument Sans throughout, with the title in Regular weight. Ovo is only for the big number and tile values.
- **Treemaps and heatmaps** use one hue from light to dark, with dark text on light steps and white on dark ones.

## Limits

- No dark mode yet. Colours are checked on white backgrounds only, as in `color-usage.md`.
- More than nine series is not covered by the colour rules. Group the smallest into "Other" or split the chart.
- The chart is sealed from site CSS on purpose. To fit a layout, change the width of its container, not the chart.
- Self host the files. If `source/fonts/` sits somewhere else, set `window.GwiChart = { fontBase: '/path/to/fonts/' }`
  before loading `source/gwi-chart.js`. `gwi-chart.standalone.js` needs no font path.

## Changing the component

Edit `source/gwi-chart.js`, then run `python3 source/build-standalone.py` to rebuild the standalone file. Colours, mark sizes and
the key gap are constants at the top of the file, and they come from `tokens/color.json` and
`../../Components/Presentations/README.md`. If a design rule changes there, change it here too.
