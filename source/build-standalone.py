#!/usr/bin/env python3
"""Builds ../gwi-chart.standalone.js: gwi-chart.js (in this folder) with both fonts inlined as base64,
so a single file is all a web page needs. Run after editing gwi-chart.js."""
import base64, os
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(os.path.dirname(here), 'gwi-chart.standalone.js')
b64 = lambda p: base64.b64encode(open(os.path.join(here, 'fonts', p), 'rb').read()).decode()
src = open(os.path.join(here, 'gwi-chart.js'), encoding='utf-8').read()
pre = ('window.GwiChart = window.GwiChart || {}; window.GwiChart.fonts = window.GwiChart.fonts || {'
       'instrument: "data:font/woff2;base64,%s", ovo: "data:font/woff2;base64,%s"};\n') % (b64('InstrumentSans.woff2'), b64('Ovo-Regular.woff2'))
open(out, 'w', encoding='utf-8').write(pre + src)
print(out, os.path.getsize(out) // 1024, 'KB')
