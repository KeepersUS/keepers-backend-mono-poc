#!/bin/bash
ports=( 8080 4000 5000 9000 8085 )

firebase auth:export test-data/cloud-data/auth_export/accounts.json --format=JSON

for i in "${ports[@]}"
do
    :
    lsof -ti tcp:$i | xargs kill -9 > /dev/null 2>&1 || echo "no process to kill on port $i"
done

firebase emulators:start --import=./test-data/cloud-data --export-on-exit