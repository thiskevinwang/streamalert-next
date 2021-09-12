#!/bin/bash

# macOS: brew update && brew install pandoc

# recursively find and convert RST to MD
find . -name '*.rst' -exec pandoc {} -f rst -t markdown -o {}.md \;
# rename .rst.md extensions to just .md
find . -name '*.rst.md' -exec rename "s/.rst.md/.md/" {} \;