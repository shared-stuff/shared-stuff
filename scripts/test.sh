#!/bin/bash

BASE_DIR=`dirname $0`

coffee -c -o app/js/gen app/js
coffee -c -o test/unit/gen test/unit

java -jar "$BASE_DIR/../test/lib/jstestdriver/JsTestDriver.jar" \
     --config "$BASE_DIR/../config/jsTestDriver.conf" \
     --basePath "$BASE_DIR/.." \
     --tests all
#     --testOutput target
