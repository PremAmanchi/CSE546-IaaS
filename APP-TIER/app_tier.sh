#!/bin/bash

cd /home/ubuntu/app-tier/controller
node request.js
cd /home/ubuntu/app-tier/classifier
image_name=$(find ./ -type f \( -iname \*.JPEG -o -iname \*.jpg -o -iname \*.png \))
python3 image_classification.py $image_name
cd /home/ubuntu/app-tier/controller
node response.js