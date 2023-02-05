#!/usr/bin/env bash

set -e

DO_BUILD_APP=true
DO_BUILD_SERVER=true

while [ "$#" -gt "0" ]; do
  case "$1" in
    "--no-app")
      DO_BUILD_APP=
      shift
      ;;
    "--no-server")
      DO_BUILD_SERVER=
      shift
      ;;
  esac
done

set -x

if [ ! -z "$DO_BUILD_APP" ]; then
  mkdir -p dist/app
  cp -r app/*.js app/*.html dist/app/
fi

if [ ! -z "$DO_BUILD_SERVER" ]; then
  mkdir -p dist/server
  cd server
  docker run --rm -v ${PWD}:/code -w /code -e GOARCH="arm64" -e GOOS="darwin" golang:1.16 go build -o speed-test .
  cd -
  cp server/speed-test dist/server/
fi

