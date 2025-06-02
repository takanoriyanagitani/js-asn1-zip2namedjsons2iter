#!/bin/sh

port=52980
addr=127.0.0.1
pubd=./public.d

miniserve \
  --port $port \
  --interfaces "${addr}" \
  "${pubd}"
