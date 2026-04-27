#!/bin/bash
export PATH="/Users/joaquincorella/.nvm/versions/node/v24.15.0/bin:$PATH"
cd "$(dirname "$0")"
exec npm run dev
