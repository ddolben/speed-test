#!/usr/bin/env bash

script_dir="$(cd $(dirname "$0") && pwd)"
cd "$script_dir"

image_name=node:18
docker run --rm -it \
  -v ${script_dir}/..:/code -w /code/app \
  -p 8001:8001 \
  "$image_name" "$@"

