#!/usr/bin/env python3
import pathlib;d=pathlib.Path(__file__).parent
h=(d/'src/app.html').read_text();v=(d/'src/supabase-js-2.117.2.umd.js').read_text();j=(d/'src/app.js').read_text()
(d/'dist/index.html').write_text(h.replace('/*VENDOR*/',v).replace('/*JS*/',j.replace('</script','<\\/script')))
