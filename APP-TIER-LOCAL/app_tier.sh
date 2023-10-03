#!/bin/bash

cd /Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER-LOCAL/controller
node request.js
cd /Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER-LOCAL/classifier
image_name=$(find ./ -type f \( -iname \*.JPEG -o -iname \*.jpg -o -iname \*.png \))
python3 image_classification.py $image_name
cd /Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER-LOCAL/controller
node response.js