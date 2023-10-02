#!/bin/bash

cd /home/ubuntu/app_tier/controller
node request.js
cd /home/ubuntu/app_tier/classifier
image_name=$(find ./ -type f \( -iname \*.JPEG -o -iname \*.jpg -o -iname \*.png \))
python3 image_classification.py $image_name
cd /home/ubuntu/app_tier/controller
node response.js