#!/bin/sh

rm -rf .next
mkdir .next

docker container cp hikari:/app/.next/static/ .next/
