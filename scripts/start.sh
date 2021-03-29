#!/bin/bash

NODE_PATH=. node dist/index.js | ./node_modules/.bin/bunyan -o short
