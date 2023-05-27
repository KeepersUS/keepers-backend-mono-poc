#!/bin/bash

# we need to login to these services.
# firebase login
# gcloud auth login

# firebase projects:list
firebase use keepers-web-app

gcloud projects list
gcloud config set project keepers-web-app

# clear out old data.
rm -rf test-data/*

# get the backups list, take the most recent.
folders=( $(gsutil list gs://keepers-firestore-backups) )
length=${#folders[@]}
latest=${folders[length-1]}

# gsutil -m cp -r $latest ./test-data
gcloud storage cp -r $latest ./test-data

folderName=( $(ls test-data))

mv test-data/$folderName test-data/cloud-data
mkdir -p test-data/cloud-data/auth_export
firebase auth:export test-data/cloud-data/auth_export/accounts.json --format=JSON