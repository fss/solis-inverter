#!/usr/bin/env bash
docker buildx build --platform linux/arm/v7 -t stryjek4/solis-api:rpi . --push
