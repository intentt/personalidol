#!/usr/bin/env sh

GIT_LAST_COMMIT_ID=$(git log --format="%H" -n 1);

git diff-index --quiet HEAD;

GIT_HAS_CHANGES=$?;

BUILD_ID_APPEND="";

if [ $GIT_HAS_CHANGES ]; then
    # Append hash of changes.
    BUILD_ID_APPEND="_$( git diff | md5sum | cut -d ' ' -f 1 )";
fi

BUILD_ID="${GIT_LAST_COMMIT_ID}${BUILD_ID_APPEND}";

echo $BUILD_ID
