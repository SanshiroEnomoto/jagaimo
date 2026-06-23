# Jagaimo Library Reference

## Reference Version

Jagaimo is a dependency-free browser JavaScript library providing:

- a lightweight DOM and SVG wrapper;
- SVG plotting components;
- interactive plot widgets;
- basic UI widgets; and
- numerical color maps.

## Modules and Imports

```js
import { JG, JGElement, JGDateTime } from './jagaimo.mjs';
import {
    JGWidget,
    JGTabWidget,
    JGPopupWidget,
    JGDraggable,
    JGDialogWidget,
    JGMenuListWidget,
    JGPullDownWidget,
    JGTreeWidget,
    JGHiddenWidget,
    JGInvisibleWidget,
    JGIndicatorWidget,
    JGFileIconWidget
} from './jagawidgets.mjs';
import {
    JGPlotAxisScale,
    JGPlotColorBarScale,
    JGPlotFrame,
    JGPlot,
    JGPlotWidget
} from './jagaplot.mjs';
import { ColorMap } from './colormap.mjs';
```

Applications conventionally import `JG` as `$`:

```js
import { JG as $ } from './jagaimo.mjs';
```

## Quick Start: Interactive Plot

```html
<div id="plot" style="width:640px;height:480px"></div>

<script type="module">
    import { JG as $ } from './jagaimo/jagaimo.mjs';
    import { JGPlotWidget } from './jagaimo/jagaplot.mjs';

    const plot = new JGPlotWidget($('#plot'), { grid: true });
    const graph = {
        x: [0, 1, 2, 3],
        y: [0, 1, 0, -1],
        style: {
            lineColor: 'navy',
            lineWidth: 2,
            markerColor: 'orange',
            markerType: 'circle',
            markerSize: 3
        }
    };

    plot.setRange(0, 3, -1.5, 1.5);
    plot.setTitle('Example').setXTitle('Time').setYTitle('Signal');
    plot.addGraph(graph);
</script>
```

Serve pages using HTTP when loading modules in a browser:

```bash
cd docs
python3 -m http.server 8000
```

## `jagaimo.mjs`: Core API

## `JG(elem, nameSpace = null)`

Factory function returning a `JGElement`.

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `elem` | `string`, `Element`, `Window`, or `JGElement` | Selector, creation expression, DOM-like object, or existing wrapper. |
| `nameSpace` | `string` or `null` | Use `'svg'` when constructing an SVG element. |

### Examples

```js
const div = $('#container');
const button = $('<button>').text('Apply');
const svgLine = $('<line>', 'svg');
```

For element creation, the string must be of the form `'<tag>'`. Other strings
are interpreted as selectors.

## `JGElement`

Wrapper for a collection of HTML or SVG DOM elements.

### Collection Methods

| Method | Return Value | Description |
| --- | --- | --- |
| `size()` | `number` | Returns the number of wrapped elements. |
| `enumerate()` | iterator of `JGElement` | Iterates over wrapped elements one by one. |
| `at(index)` | `JGElement` or `undefined` | Returns a wrapper for an element at an index. |
| `eq(index)` | `JGElement` or `undefined` | Alias for `at(index)`. |
| `get(index = 0)` | DOM element or `undefined` | Returns an unwrapped DOM element. |
| `last()` | `JGElement` or `undefined` | Returns the final wrapped element. |

### Traversal Methods

| Method | Return Value | Description |
| --- | --- | --- |
| `find(query)` | `JGElement` | Finds descendants matching a CSS selector. |
| `closest(query)` | `JGElement` | Walks upward until an id, class, or tag match is found. |
| `parent()` | `JGElement` | Wraps the parent node of the first element. |
| `next()` | `JGElement` | Wraps the next sibling of the first element. |

### DOM Modification Methods

| Method | Return Value | Description |
| --- | --- | --- |
| `append(element)` | `this` | Appends an element to the first wrapped node. |
| `appendTo(element)` | `this` | Appends this wrapper's first node to another element. |
| `prepend(element)` | `this` | Inserts an element before the first child. |
| `prependTo(element)` | `this` | Prepends this wrapper's first node to another element. |
| `insertBefore(element, where)` | `this` | Inserts an element before a child node. |
| `insertAfter(element, where)` | `this` | Inserts an element after a child node. |
| `empty()` | `this` | Removes all child nodes. |
| `remove(sel = null)` | `this` | Removes wrapped nodes, or matching descendants when `sel` is provided. |

### Content, Attributes, and Style

Getter methods return the value from the first wrapped node. Setter methods
modify all wrapped nodes and return `this`.

| Method | Description |
| --- | --- |
| `html(str = null)` | Reads or sets `innerHTML`. |
| `text(str = null)` | Reads or sets `textContent`. |
| `css(name, value = null)` | Reads or sets inline style; accepts an object for multiple settings. |
| `attr(name, value = null)` | Reads or sets attributes; `undefined` removes an attribute; accepts an object. |
| `data(name, value = null)` | Reads or sets a `data-*` attribute. |
| `addClass(className)` | Adds one or more space-separated CSS classes. |
| `removeClass(className)` | Removes one or more CSS classes. |
| `toggleClass(className)` | Toggles one or more CSS classes. |
| `hasClass(className)` | Tests the first wrapped node for a class. |

### Form Methods

| Method | Description |
| --- | --- |
| `val(str = null)` | Reads or assigns form control values. |
| `selected(option = null)` | Reads the selected `<option>`, or selects an option by value, index, or wrapper. |
| `checked(toCheck = null)` | Reads or sets checkbox/radio checked state. |
| `enabled(toEnable = null)` | Reads or sets enabled state for form controls or custom enabled objects. |

`val()` reading behavior:

| Element Type | Getter Result |
| --- | --- |
| `<select>` | Selected option value. |
| `<input type="checkbox">`, `<input type="radio">` | Value or `true` when checked; `false` otherwise. |
| `<input type="number">`, `<input type="range">` | JavaScript number via `valueAsNumber`. |
| Other input-like element | Its string `value`. |

### Events, Visibility, and Geometry

| Method | Description |
| --- | --- |
| `bind(event, callback)` | Adds an event listener to all wrapped nodes. |
| `unbind(event, callback)` | Removes an event listener from all wrapped nodes. |
| `click(fn = null)` | Invokes clicks, or assigns `onclick` when a callback is supplied. |
| `show()` | Restores display state or displays as `block`. |
| `hide()` | Hides elements while storing prior inline display state. |
| `focus()` | Focuses wrapped elements. |
| `boundingClientWidth()` | Returns visible bounding width for the first node. |
| `boundingClientHeight()` | Returns visible bounding height for the first node. |
| `screenX()`, `screenY()` | Returns viewport-relative position. |
| `pageX()`, `pageY()` | Returns page-relative position. |

## Static `JG` Utilities

| Function | Description |
| --- | --- |
| `JG.sanitize(line)` | Decodes known entities, then escapes `&`, `<`, and `>`. |
| `JG.sanitizeWeakly(line)` | Escapes `<` and `>`, preserving ampersands for limited markup use. |
| `JG.unsanitize(line)` | Decodes `&gt;`, `&lt;`, and `&amp;`. |
| `JG.isDict(x)` | Returns true for ordinary objects with `Object` as constructor. |
| `JG.extend([deep], dest, ...sources)` | Merges source properties into a destination; pass `true` for nested ordinary objects. |
| `JG.sprintf(format, ...args)` | Formats `%d`, `%x`, `%s`, `%f`, `%e`, and `%g` conversions. |
| `JG.JSON_stringify(doc, options = {})` | Produces an indented JSON-like string. |
| `JG.time()` | Returns current Unix time in integer seconds. |
| `JG.formatDuration(format, duration)` | Formats seconds using duration placeholders. |
| `JG.percentileOf(data, percentile, filter = x => x)` | Returns a low/high numeric interval. |
| `JG.hsv2rgb(h, s, v)` | Converts HSV to normalized RGB values. |

### Date and Duration Format Specifiers

`JGDateTime.asString()` supports:

| Specifier | Meaning |
| --- | --- |
| `%Y`, `%y` | Four-digit and two-digit year. |
| `%m`, `%_m`, `%-m` | Zero-padded, space-padded, and unpadded month. |
| `%d`, `%_d`, `%-d` | Day of month. |
| `%H`, `%_H`, `%-H` | 24-hour clock hour. |
| `%I`, `%_I`, `%-I` | 12-hour clock hour. |
| `%M`, `%_M`, `%-M` | Minutes. |
| `%S`, `%_S`, `%-S` | Seconds. |
| `%a`, `%A` | Abbreviated weekday name. |
| `%b`, `%B` | Abbreviated month name. |
| `%p`, `%P` | `AM`/`PM` or lowercase equivalent. |
| `%Z`, `%z`, `%:z` | Timezone offset variants. |

`JG.formatDuration()` supports `%d`, `%H`, `%M`, and `%S`, including the
space-padded and unpadded variants.

## `JGDateTime`

### Constructor

```js
new JGDateTime(param = null)
```

| `param` Value | Interpretation |
| --- | --- |
| `number` | Unix timestamp in seconds. |
| Numeric `string` | Unix timestamp in seconds. |
| Date-like `string` | Parsed with `Date.parse()`. |
| `Date` | Converted to Unix timestamp seconds. |
| `null` | Current time. |

### Methods

| Method | Return Value | Description |
| --- | --- | --- |
| `advanceBy(offset)` | `this` | Adds seconds to the timestamp. |
| `asInt()` | `number` | Returns integer seconds. |
| `asString(format = '%Y-%m-%d,%H:%M:%S', isUTC = false)` | `string` | Formats local or UTC time. |
| `asUTCString(format)` | `string` | Formats time in UTC. |

## `colormap.mjs`: Color Maps

## `ColorMap`

### Constructor

```js
new ColorMap(name)
```

### Palette Names

| Name | Notes |
| --- | --- |
| `'Parula'` | Blue-to-yellow scientific palette. |
| `'Viridis'` | Perceptually uniform dark-purple-to-yellow palette. |
| `'Magma'` | Dark-to-bright warm palette. |
| `'DarkBodyRadiator'` | Radiator-style thermal palette. |
| `'UW'`, `'UWGold'` | UW-themed palettes. |
| `'MIT'` | Uses the dark body radiator palette. |
| `'KIT'` | KIT-themed palette. |
| `'Gray'` | Generated gray palette. |
| Other name | Generated rainbow palette. |

### Methods

| Method | Description |
| --- | --- |
| `indicateOutOfRange(isIndicated)` | Enables or disables dedicated underflow/overflow colors. |
| `colorNameOf(x)` | Converts a normalized value, conventionally from `0` to `1`, into an `rgb(r,g,b)` string or an out-of-range color. |

## `jagawidgets.mjs`: UI Widgets

## `JGWidget`

Base class for widgets.

```js
new JGWidget(obj, options)
```

| Method | Description |
| --- | --- |
| `element()` | Returns the associated `JGElement`. |

Widget instances are registered on their associated DOM elements so internal
global event handlers can recover popup widget instances.

## `JGTabWidget`

Transforms existing `.jaga-tabPage` child elements into a tab interface.

```js
new JGTabWidget(obj, {
    openPage: page => { /* called after selection */ }
});
```

Expected child structure:

```html
<div id="tabs">
    <div class="jaga-tabPage" label="Overview"></div>
    <div class="jaga-tabPage" label="Details"></div>
</div>
```

| Method | Description |
| --- | --- |
| `openPage(page)` | Opens a page by numeric index or label text; negative indexes count from the end. |
| `appendPage(label)` | Appends and opens a new blank page. |
| `removePage(page = null)` | Removes a specified or currently selected page. |

## `JGPopupWidget`

Displays an existing element as a fixed-position popup.

### Options

| Option | Default | Description |
| --- | --- | --- |
| `x`, `y` | `null` | Fixed screen position; `null` centers on open. |
| `zIndex` | `1000` | CSS stacking order. |
| `closeButtons` | `null` | Button wrapper or array of button wrappers that close the popup. |
| `closeOnGlobalClick` | `false` | Closes after a click outside the popup. |
| `closeOnEscapeKey` | `true` | Closes after Escape. |
| `open` | `null` | Callback invoked before display. |
| `close` | `null` | Callback invoked after closing. |

### Methods

| Method | Description |
| --- | --- |
| `setPosition(x, y)` | Updates preferred popup position. |
| `moveTo(x = null, y = null)` | Immediately updates specified CSS position coordinates. |
| `open()` | Shows the popup. |
| `openNear(x, y)` | Shows near a point while fitting it within the viewport. |
| `close()` | Hides the popup and removes global closing listeners. |

## `JGDraggable`

Adds mouse dragging to a positioned element.

```js
new JGDraggable(obj, {
    handle: titleBar,
    preventDefault: true,
    stopPropagation: true
});
```

| Option | Default | Description |
| --- | --- | --- |
| `handle` | `null` | Drag handle; the target object is used when omitted. |
| `preventDefault` | `false` | Prevents the starting mouse event's default action. |
| `stopPropagation` | `false` | Stops propagation of the starting mouse event. |

## `JGDialogWidget`

Popup-based dialog with title, optional close button, dragging, content area,
and action buttons.

### Options

| Option | Default | Description |
| --- | --- | --- |
| `title` | `null` | Title bar text. |
| `x`, `y` | `null` | Popup position. |
| `zIndex` | `1000` | CSS stacking order. |
| `closeOnGlobalClick` | `false` | Closes on an outside click. |
| `closeOnEscapeKey` | `true` | Closes on Escape. |
| `closeButton` | `false` | Adds a close button in the title bar. |
| `open`, `close` | `null` | Lifecycle callbacks. |
| `buttons` | `{}` | Mapping from button label to callback. |

| Method | Description |
| --- | --- |
| `content()` | Returns the `.jaga-dialog-content` wrapper. |

## `JGMenuListWidget`

Applies menu list behavior and `.jaga-menulist` styling to a list:

```js
new JGMenuListWidget($('#menu'));
```

## `JGPullDownWidget`

Wraps a `<select>` as a selection control with an updating heading label.

### Options

| Option | Default | Description |
| --- | --- | --- |
| `heading` | `''` | Initial heading text. |
| `items` | `[]` | Strings or `{ value, label }` item objects. |
| `initial` | `null` | Initial item index. |
| `select` | `null` | Callback `(event, value, widget)` after selection. |
| `labelOf` | generated function | Converts the selected label to displayed heading HTML. |

| Method | Description |
| --- | --- |
| `setLabel(label)` | Updates the displayed hidden heading option using a wrapper or label text. |

## `JGTreeWidget`

Displays a nested JavaScript object or JSON text as a collapsible tree.

```html
<div id="tree">{"run": {"status": "done", "events": [1, 2, 3]}}</div>

<script type="module">
    import { JG as $ } from './jagaimo/jagaimo.mjs';
    import { JGTreeWidget } from './jagaimo/jagawidgets.mjs';

    new JGTreeWidget($('#tree'), { rootLabel: 'result' });
</script>
```

You can also pass data directly:

```js
new JGTreeWidget($('#tree'), data, {
    rootLabel: 'result',
    expandedDepth: 2,
    sortKeys: true
});
```

| Option | Default | Description |
| --- | --- | --- |
| `data` | `undefined` | Object to render when not passed as the second constructor argument. |
| `rootLabel` | `''` | Optional label shown for the root node. |
| `expandedDepth` | `Infinity` | Initial depth to expand. Use `0` to start fully collapsed. |
| `sortKeys` | `false` | Sort object keys alphabetically before rendering. |
| `parseJSON` | `true` | Parse the element text as JSON when no object is passed. |

| Method | Description |
| --- | --- |
| `setData(data)` | Replaces the rendered data. |
| `expandAll()` | Opens every branch. |
| `collapseAll()` | Closes every branch. |

## `JGHiddenWidget` and `JGInvisibleWidget`

Both controls show content while a sensing element is hovered and optionally
hide it after a delay.

| Option | Default | Description |
| --- | --- | --- |
| `sensingObj` | `obj` | Element whose pointer events drive visibility. |
| `group` | `null` | Group name; showing one hides other active elements in the group. |
| `opacity` | `1` | Used by `JGInvisibleWidget` when shown. |
| `autoHide` | `0` | Number of seconds after which shown content hides. |

| Method | Description |
| --- | --- |
| `hide()` | Hides the element. |
| `hideAll()` | Hides currently shown elements in the same group. |
| `show()` | Shows the element and starts auto-hide when configured. |

`JGHiddenWidget` changes `display`; `JGInvisibleWidget` changes opacity while
preserving layout.

## `JGIndicatorWidget`

Fixed-position temporary message indicator.

| Method | Description |
| --- | --- |
| `open(message = '', icon = '', x = null, y = null)` | Displays a message near a point or the viewport center. |
| `close(message = '', icon = '', duration_ms = 100)` | Optionally updates the content and hides it after a delay. |

## `JGFileIconWidget`

Converts an existing text-labeled element into a file icon.

| Option | Default | Description |
| --- | --- | --- |
| `filetype` | `''` | Text shown within the document icon. |
| `badge` | `''` | Optional badge HTML. |
| `back` | `''` | Optional background HTML. |

## `jagaplot.mjs`: Plotting API

## Plot Class Overview

| Class | Intended Use |
| --- | --- |
| `JGPlotAxisScale` | Low-level numeric, logarithmic, or date axis construction. |
| `JGPlotColorBarScale` | Low-level colored Z-axis scale. |
| `JGPlotFrame` | Low-level plot frame, axes, labels, grid, and transforms. |
| `JGPlot` | Plot drawing into an existing SVG node. |
| `JGPlotWidget` | Interactive plot drawing into an HTML container. |

Most applications should use `JGPlotWidget`. Use `JGPlot` when managing an SVG
canvas directly or placing multiple independent plots on one canvas.

## Common Plot Options

The following options are accepted by plot frame and/or widget construction.

| Option | Typical Default | Description |
| --- | --- | --- |
| `x`, `y` | `0` | Plot position within an existing SVG (`JGPlot`). |
| `width`, `height` | `640`, `480`, or container-derived | SVG/view dimensions. |
| `x0`, `x1`, `y0`, `y1` | `0`, `1`, `0`, `1` | Initial displayed data range. |
| `z0`, `z1` | `0`, `1` | Initial color scale range. |
| `logX`, `logY`, `logZ` | `false` | Logarithmic coordinate modes. |
| `dateFormat` | `null` | X-axis date/time format; use `utc:` prefix for UTC labels. |
| `grid` | `false` | Initial grid visibility. |
| `stat` | `true` | Initial statistics layer visibility. |
| `ticksX`, `ticksY`, `ticksZ` | `10` | Tick-count targets. |
| `ticksOutwards` | `true` | Draw ticks outside the plotting area. |
| `colorScale` | `null` | Color map name; enables the Z scale bar. |
| `plotMarginColor` | `'none'` | Background outside the plot area. |
| `plotAreaColor` | `'none'` | Background inside the plot area. |
| `frameColor` | `'black'` | Axis/frame color. |
| `frameThickness` | depends on class | Frame stroke width. |
| `labelColor` | frame color | Text and label color. |
| `gridColor` | frame color or `'gray'` | Grid color. |
| `marginTop`, `marginRight`, `marginBottom`, `marginLeft` | class-specific | Plot margins in SVG coordinates. |
| `plotDigits` | `6` | Numeric precision used for generated SVG geometry. |

`JGPlotWidget` additionally accepts:

| Option | Default | Description |
| --- | --- | --- |
| `labelScaling` | `1` | Divides view-box size to scale apparent labels. |
| `cursorDigits` | `5` | Pointer coordinate precision; values not greater than zero disable cursor reading. |
| `rangeSelect` | zoom callback | Callback `(plotWidget, x0, x1, y0, y1)` for mouse/touch selected ranges. |

## `JGPlotAxisScale`

```js
new JGPlotAxisScale(min, max, isLog, options = {})
```

### Options

| Option | Default | Description |
| --- | --- | --- |
| `x`, `y` | `0` | Axis start position in parent coordinates. |
| `length` | `100` | Axis length. |
| `labelPosition` | `'bottom'` | `'left'`, `'right'`, `'top'`, or `'bottom'`. |
| `labelMargin` | automatic | Label/title reserved margin. |
| `ticksOutwards` | `true` | Tick direction behavior. |
| `dateFormat` | `null` | Time label format for numeric timestamps. |
| `numberOfTicks` | `5` | Major tick target. |
| `title` | `''` | Axis title. |
| `frameColor` | `'black'` | Axis line color. |
| `frameThickness` | `2` | Axis line width. |
| `labelColor`, `gridColor` | frame color | Text/grid colors. |

### Methods

| Method | Description |
| --- | --- |
| `setOptions(options)` | Merges scale configuration options. |
| `setRange(min, max, isLog = false)` | Updates the numeric range and scale type. |
| `draw(g, options = {})` | Draws an SVG axis in a parent SVG group. |
| `JGPlotAxisScale.findRangeFromValues(minValue, maxValue, options = {})` | Calculates a padded display range. |

## `JGPlotColorBarScale`

Extends `JGPlotAxisScale` with a `ColorMap` backed colored strip.

```js
new JGPlotColorBarScale(min, max, isLog, {
    colorCoding: 'Parula',
    scaleBarWidth: 10,
    numberOfSlices: 32
});
```

| Method | Description |
| --- | --- |
| `colorNameOf(value)` | Returns the scale's color for a data-space Z value. |
| `draw(g, options = {})` | Draws the color bar and its numeric axis. |

## `JGPlotFrame`

Frame base class used by `JGPlot`.

### Public Methods

| Method | Description |
| --- | --- |
| `clear()` | Redraws an empty frame. |
| `getRange()` | Returns geometry and current ranges. |
| `setRange(x0, x1, y0, y1, z0 = null, z1 = null, options = {})` | Updates ranges and redraws the frame. |
| `setStyle(style)` | Updates default drawing style. |
| `setTitle(title)` | Sets displayed plot title. |
| `setXTitle(title)`, `setYTitle(title)`, `setZTitle(title)` | Sets axis titles. |
| `setFootnote(footnote)` | Sets text at the bottom of the frame. |
| `setXDateFormat(fmt)` | Sets X-axis timestamp formatting. |
| `enableGrid(enabled = true)` | Shows or hides grid lines. |
| `enableStat(enabled = true)` | Shows or hides statistics overlay content. |
| `drawFrame()` | Rebuilds background, axes, labels, clip path, grid, and scale bar. |

### Range Options

`setRange(..., options)` recognizes:

| Option | Description |
| --- | --- |
| `xlog`, `ylog`, `zlog` | Changes logarithmic behavior for each range. |
| `grid` | Sets grid visibility during redrawing. |
| `stat` | Sets statistics visibility during redrawing. |

## `JGPlot`

Draws graphic items into an existing SVG element.

```js
const plot = new JGPlot($('#canvas'), { width: 640, height: 480 });
```

### Default Item Style

Style objects may override these values:

| Property | Default |
| --- | --- |
| `lineColor` | `'black'` |
| `lineWidth` | `1` |
| `lineOpacity` | `1` |
| `lineStyle` | `'solid'` |
| `fillColor` | `''` |
| `fillOpacity` | `1` |
| `markerType` | `'circle'` |
| `markerColor` | `'black'` |
| `markerOpacity` | `1` |
| `markerSize` | `3` |
| `textColor` | `'black'` |
| `fontFamily` | `'sans-serif'` |
| `fontSize` | `'16px'` |

Line styles accept `'solid'`, `'dot'`/`'dotted'`, and for line annotations a
custom SVG `stroke-dasharray` value.

### `drawGraph(graph)`

Draws lines, markers, uncertainty bars, and optional filled areas.

```js
plot.drawGraph({
    x: [0, 1, 2],
    y: [2, 5, 3],
    y_err: [0.2, 0.4, 0.1],
    style: {
        lineColor: 'steelblue',
        markerColor: 'steelblue',
        markerType: 'circle',
        markerSize: 3
    }
});
```

| Property | Type | Description |
| --- | --- | --- |
| `x` | array | X coordinates. When missing or of a different length from `y`, integer indexes are used. |
| `y` | array | Y coordinates. |
| `x_err` | array | Symmetric X uncertainties, drawn when markers are enabled. |
| `y_err` | array | Symmetric Y uncertainties, drawn when markers are enabled. |
| `y_min`, `y_max` | arrays | Low and high envelopes. |
| `style` | object | Drawing style overrides. |

Additional graph style properties:

| Property | Default | Description |
| --- | --- | --- |
| `lineType` | `'connect'` | Use `'last'` for step-like lines retaining the previous value. |
| `fillColor` | line color | Fill color. |
| `fillOpacity` | `0` | Set above zero to draw fill. |
| `fillEnvelope` | `false` | Fills between `y_min` and `y_max`. |
| `fillBaseline` | `1e-100` | Baseline for normal filled series. |

Marker types include `circle`, `square`, `diamond`, and `triangle`. Prefix a
marker type with `open`, such as `opencircle`, for an outlined marker.

Invalid or missing points are skipped. The implementation intentionally
connects remaining valid points across skipped entries, which is useful for
sparse sampled data.

### `drawHistogram(hist)`

Draws a one-dimensional stepped histogram.

```js
plot.drawHistogram({
    bins: { min: 0, max: 4 },
    counts: [2, 5, 3, 1],
    style: { lineColor: 'red', fillColor: 'pink', fillOpacity: 0.4 }
});
```

| Property | Description |
| --- | --- |
| `bins.min`, `bins.max` | X extent divided evenly among count entries. |
| `counts` | Numeric bin heights. |
| `style` | Line and fill overrides. |

### `drawHistogram2d(hist2d)`

Draws a colored rectangle per cell. A `colorScale` must have been enabled on
the plot.

```js
const plot = new JGPlot($('#canvas'), { colorScale: 'Viridis' });
plot.setRange(0, 2, 0, 2, 0, 10);
plot.drawHistogram2d({
    xbins: { min: 0, max: 2 },
    ybins: { min: 0, max: 2 },
    counts: [[1, 4], [7, 10]]
});
```

| Property | Description |
| --- | --- |
| `xbins.min`, `xbins.max` | X extent of cells. |
| `ybins.min`, `ybins.max` | Y extent of cells. |
| `counts` | Array of rows; values are mapped through the color scale. |

### `drawBarChart(graph)`

Draws bars from zero to each Y value.

```js
plot.drawBarChart({
    x: [1, 2, 3],
    y: [5, 3, 8],
    style: { fillColor: 'cornflowerblue', width: 0.6 }
});
```

| Style Property | Description |
| --- | --- |
| `fillColor` | Bar color. |
| `fillOpacity` | Bar opacity. |
| `width` | Bar width in data coordinates; calculated automatically when omitted. |

### `drawFunction(func)`

Draws sampled function output or provided X/Y arrays.

```js
plot.drawFunction({
    func: x => Math.sin(x),
    range: { min: 0, max: 6.28 },
    step: 0.05,
    style: { lineColor: 'green', lineWidth: 2 }
});
```

| Property | Description |
| --- | --- |
| `x`, `y` | Optional already sampled coordinates. |
| `func` | Function used when `x` is empty. |
| `range.min`, `range.max` | Function sampling range. |
| `step` | Sampling step; defaults to one hundredth of the range width. |
| `style` | Line style overrides. |

### `drawStat(stat)`

Draws or clears a statistics box.

```js
plot.drawStat({
    title: 'Statistics',
    contents: {
        Mean: '2.43',
        Entries: '100'
    }
});

plot.drawStat(null); // clear
```

### `drawText(text)`

```js
plot.drawText({
    x: 2,
    y: 4,
    text: 'peak',
    style: {
        textColor: 'red',
        fontSize: '14px',
        'text-anchor': 'middle'
    }
});
```

### `drawLine(line)`

```js
plot.drawLine({
    y0: 0,
    style: { lineColor: 'gray', lineStyle: 'dotted' }
});
```

| Coordinates | Result |
| --- | --- |
| Only `y0` supplied | Horizontal line across the displayed X range. |
| Only `x0` supplied | Vertical line across the displayed Y range. |
| `x0`, `y0`, and optional `x1`, `y1` supplied | Line segment. |

### `drawRectangle(rect)`

```js
plot.drawRectangle({
    x0: 1,
    x1: 3,
    style: { fillColor: 'yellow', fillOpacity: 0.25, lineColor: '' }
});
```

Unspecified coordinates extend to the relevant displayed axis boundary.

## `JGPlotWidget`

Interactive container-based plot API. It owns a generated `<svg>` and an
internal `JGPlot`.

```js
const plot = new JGPlotWidget($('#plot'), {
    grid: true,
    cursorDigits: 4,
    rangeSelect: (widget, xmin, xmax, ymin, ymax) => {
        widget.setRange(xmin, xmax, ymin, ymax);
    }
});
```

### Control Methods

| Method | Description |
| --- | --- |
| `setCanvasSize(width, height)` | Rescales the generated SVG while retaining its original aspect ratio. |
| `clear(removeItems = true)` | Clears frame data; optionally retains stored items. |
| `update()` | Redraws current stored items using current ranges. |
| `getRange()` | Returns internal plot geometry and data ranges. |
| `setRange(x0, x1, y0, y1, z0 = null, z1 = null, options = {})` | Updates range, redraws frame, and redraws stored items. |
| `setStyle(style)` | Updates internal default style. |
| `setTitle(title)` | Updates the plot title. |
| `setXTitle(title)`, `setYTitle(title)`, `setZTitle(title)` | Updates axis titles. |
| `setFootnote(footnote)` | Updates footnote text. |
| `setXDateFormat(fmt)` | Updates X date formatting. |
| `enableGrid(enabled = true)` | Changes grid visibility. |
| `enableStat(enabled = true)` | Changes statistics visibility. |

### Retained Item Methods

These store the passed object by reference, draw it immediately, and redraw
it after range changes or calls to `update()`.

| Method | Data Format |
| --- | --- |
| `addGraph(itemData)` | Same as `drawGraph()`. |
| `addHistogram(itemData)` | Same as `drawHistogram()`. |
| `addHistogram2d(itemData)` | Same as `drawHistogram2d()`. |
| `addBarChart(itemData)` | Same as `drawBarChart()`. |
| `addFunction(itemData)` | Same as `drawFunction()`. |
| `addStat(itemData)` | Same as `drawStat()`. |
| `addText(itemData)` | Same as `drawText()`. |
| `addLine(itemData)` | Same as `drawLine()`. |
| `addRectangle(itemData)` | Same as `drawRectangle()`. |

### Immediate Item Methods

These draw without adding the item to the retained redraw list:

`drawGraph()`, `drawHistogram()`, `drawHistogram2d()`, `drawBarChart()`,
`drawFunction()`, `drawStat()`, `drawText()`, `drawLine()`, and
`drawRectangle()`.

## CSS Classes

Include `jagaimo.css` when using the general UI widgets:

```html
<link rel="stylesheet" type="text/css" href="./jagaimo.css">
```

Principal styled classes include:

| CSS Class | Associated Widget |
| --- | --- |
| `.jaga-tabLabelBox`, `.jaga-tabLabel`, `.jaga-tabPage` | Tab widget |
| `.jaga-popup` | Popup and dialog base |
| `.jaga-dialog-title`, `.jaga-dialog-content`, `.jaga-dialog-button-pane` | Dialog widget |
| `.jaga-menulist` | Menu list widget |
| `.jaga-treeWidget` | Collapsible tree widget |
| `.jaga-fileicon`, `.jaga-fileicon-icon`, `.jaga-fileicon-label` | File icon widget |

Plot appearance is predominantly configured through constructor options and
per-item SVG styles rather than `jagaimo.css`.

## Behavioral Notes and Current Limitation

- `JGPlotWidget.add...()` methods retain references, not deep copies. Mutating
  the original data object and calling `update()` is an intended workflow.
- In `drawGraph()`, invalid entries are omitted while valid observations on
  either side remain connected. This is intentional for sparse datasets.
- Error bars in `drawGraph()` are rendered only when markers are enabled.
